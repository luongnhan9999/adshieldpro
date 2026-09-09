import sys
import socket
import threading
import time
import pytest
import uvicorn
import glsim.server
from glsim.server import create_app
from glsim.engine import SimEngine
from gltest_cli.config.general import get_general_config
from gltest_cli.config.user import load_user_config, user_config_exists, get_default_user_config
from gltest.contracts import get_contract_factory
from gltest.contracts.contract import Contract
from gltest.accounts import get_accounts, get_default_account
from gltest.clients import get_gl_client

# Monkeypatch glsim to correctly propagate transaction value (wei) to gl.message.value
_orig_rpc_eth_send_raw_transaction = glsim.server._rpc_eth_send_raw_transaction

def _patched_rpc_eth_send_raw_transaction(state, engine, params):
    raw_hex = glsim.server._positional(params, 0)
    if raw_hex:
        try:
            eth_tx = glsim.server.decode_raw_transaction(raw_hex)
            tx_val = eth_tx.get("value", 0)
            engine._current_tx_value = tx_val
            SimEngine._current_tx_value = tx_val
            if hasattr(engine, "vm"):
                engine.vm._value = tx_val
        except Exception:
            pass
    return _orig_rpc_eth_send_raw_transaction(state, engine, params)

glsim.server._rpc_eth_send_raw_transaction = _patched_rpc_eth_send_raw_transaction
glsim.server.RPC_METHODS["eth_sendRawTransaction"] = _patched_rpc_eth_send_raw_transaction

_orig_set_message_context = SimEngine._set_message_context

@staticmethod
def _patched_set_message_context(contract_address, sender):
    _orig_set_message_context(contract_address, sender)
    if "genlayer.gl" in sys.modules:
        try:
            gl = sys.modules["genlayer.gl"]
            from genlayer.py.types import u256
            val = getattr(SimEngine, "_current_tx_value", 0)
            if hasattr(gl, "message") and gl.message is not None:
                gl.message = gl.MessageType(
                    contract_address=gl.message.contract_address,
                    sender_address=gl.message.sender_address,
                    origin_address=gl.message.origin_address,
                    value=u256(val),
                    chain_id=gl.message.chain_id,
                )
        except Exception:
            pass

SimEngine._set_message_context = _patched_set_message_context

import json

def _normalize_web_mock(resp):
    if isinstance(resp, str):
        return {"method": "GET", "status": 200, "body": resp}
    elif isinstance(resp, dict):
        res = dict(resp)
        if "body" not in res:
            res["body"] = ""
        if "method" not in res:
            res["method"] = "GET"
        if "status" not in res:
            res["status"] = 200
        return res
    return {"method": "GET", "status": 200, "body": str(resp)}

def _patched_sim_install_mocks(state, engine, params):
    if 0 in params and isinstance(params[0], dict):
        params = params[0]
    llm_mocks = params.get("llm_mocks", {})
    raw_web_mocks = params.get("web_mocks", {})
    web_mocks = {k: _normalize_web_mock(v) for k, v in raw_web_mocks.items()}
    strict = params.get("strict", False)

    engine._persistent_llm_mocks = llm_mocks
    engine._persistent_web_mocks = web_mocks
    engine.vm._strict_mock_mode = bool(strict)

    engine.vm._web_mocks.clear()
    engine.vm._web_mocks_hit.clear()
    engine.vm._llm_mocks.clear()
    engine.vm._llm_mocks_hit.clear()

    for pattern, resp in llm_mocks.items():
        resp_str = json.dumps(resp) if isinstance(resp, dict) else str(resp)
        engine.vm.mock_llm(pattern, resp_str)
    for url_pat, resp in web_mocks.items():
        engine.vm.mock_web(url_pat, resp)

    return {"llm": len(llm_mocks), "web": len(web_mocks), "strict": bool(strict)}

glsim.server.RPC_METHODS["sim_installMocks"] = _patched_sim_install_mocks

def _patched_reinstall_persistent_mocks(engine):
    for pattern, resp in getattr(engine, '_persistent_llm_mocks', {}).items():
        resp_str = json.dumps(resp) if isinstance(resp, dict) else str(resp)
        engine.vm.mock_llm(pattern, resp_str)
    for url_pat, resp in getattr(engine, '_persistent_web_mocks', {}).items():
        engine.vm.mock_web(url_pat, _normalize_web_mock(resp))

glsim.server._reinstall_persistent_mocks = _patched_reinstall_persistent_mocks


from pathlib import Path
import hashlib
from gltest.direct.vm import InmemManager
from gltest.direct.loader import _make_contract_proxy, _allocate_contract, deploy_contract

def _patched_deploy(self, code_path, args=None, kwargs=None, sender=None):
    args = args or []
    kwargs = kwargs or {}

    path = Path(code_path).resolve()
    if not path.exists():
        for base in [Path.cwd(), Path.cwd() / "contracts"]:
            candidate = base / code_path
            if candidate.exists():
                path = candidate.resolve()
                break

    if not path.exists():
        raise FileNotFoundError(f"Contract not found: {code_path}")

    deployer = sender or "0x" + self.vm._to_bytes(self.vm.sender).hex()
    nonce = self.state.get_nonce(deployer)
    contract_addr = self.state.generate_contract_address(deployer, nonce)
    self.state.increment_nonce(deployer)

    addr_key = contract_addr.lower()
    addr_bytes = bytes.fromhex(contract_addr[2:])
    self.vm._contract_address = addr_bytes

    if sender:
        self.vm.sender = bytes.fromhex(sender[2:]) if sender.startswith("0x") else sender

    self._install_live_handlers()
    self._ensure_direct_mode_runtime_patches()

    storage = InmemManager()
    self._storages[addr_key] = storage
    self.vm._storage = storage

    self._set_message_context(
        contract_address=addr_bytes,
        sender=self.vm.sender,
    )

    path_key = str(path)
    cached_cls = self._class_cache.get(path_key)
    if cached_cls is not None and hasattr(cached_cls, "__gl_allow_storage__"):
        raw_instance = _allocate_contract(cached_cls, self.vm, *args, **kwargs)
        instance = _make_contract_proxy(raw_instance)
        contract_cls = cached_cls
    else:
        self._reset_contract_registry()
        instance = deploy_contract(path, self.vm, *args, sdk_version=None, **kwargs)
        if hasattr(instance, "_instance"):
            contract_cls = type(object.__getattribute__(instance, "_instance"))
        else:
            contract_cls = type(instance)
            for cls in type(instance).__mro__:
                if hasattr(cls, "__annotations__") and cls.__module__.startswith("_contract_"):
                    contract_cls = cls
                    break

    self.vm._contract_address = addr_bytes
    self._sync_gl_message_contract_address(addr_bytes)

    self._instances[addr_key] = instance
    self._classes[addr_key] = contract_cls
    self._class_cache[path_key] = contract_cls

    try:
        code_hash = hashlib.sha256(path.read_bytes()).hexdigest()[:16]
        self._code_hash_cache[code_hash] = contract_cls
    except OSError:
        pass

    schema = self._extract_schema(contract_cls)
    self.state.register_contract(contract_addr, str(path), instance, schema)

    return contract_addr, instance

SimEngine.deploy = _patched_deploy




CONTRACT_SCHEMA = {
    "ctor": {"params": [], "kwparams": {}},
    "methods": {
        "create_campaign": {"params": ["str", "str", "int"], "kwparams": {}, "ret": "str", "readonly": False},
        "submit_content": {"params": ["str", "str"], "kwparams": {}, "ret": "None", "readonly": False},
        "adjudicate": {"params": ["str"], "kwparams": {}, "ret": "None", "readonly": False},
        "claim_timeout_payout": {"params": ["str"], "kwparams": {}, "ret": "None", "readonly": False},
        "file_dispute_appeal": {"params": ["str"], "kwparams": {}, "ret": "None", "readonly": False},
        "cancel_campaign": {"params": ["str"], "kwparams": {}, "ret": "None", "readonly": False},
        "get_campaign": {"params": ["str"], "kwparams": {}, "ret": "str", "readonly": True},
        "get_campaign_count": {"params": [], "kwparams": {}, "ret": "int", "readonly": True},
        "get_campaign_id_by_index": {"params": ["int"], "kwparams": {}, "ret": "str", "readonly": True},
        "get_stats": {"params": [], "kwparams": {}, "ret": "str", "readonly": True},
    }
}


def _is_port_open(host: str, port: int) -> bool:
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(0.5)
    try:
        s.connect((host, port))
        s.close()
        return True
    except Exception:
        return False


@pytest.fixture(scope="session", autouse=True)
def glsim_server():
    """Ensure a local GenLayer simulator is running for tests."""
    general_config = get_general_config()
    if general_config.user_config is None:
        if user_config_exists():
            general_config.user_config = load_user_config("gltest.config.yaml")
        else:
            general_config.user_config = get_default_user_config()

    if not _is_port_open("127.0.0.1", 4000):
        app = create_app(num_validators=1, max_rotations=1)
        config = uvicorn.Config(app, host="127.0.0.1", port=4000, log_level="warning")
        server = uvicorn.Server(config)
        thread = threading.Thread(target=server.run, daemon=True)
        thread.start()

        # Wait for server to become available
        for _ in range(30):
            if _is_port_open("127.0.0.1", 4000):
                break
            time.sleep(0.1)

        yield server
        server.should_exit = True
    else:
        yield None


@pytest.fixture(scope="session")
def client(glsim_server):
    """GenLayer client instance connected to simulator."""
    return get_gl_client()


@pytest.fixture(scope="session")
def test_accounts(glsim_server):
    """Test accounts for brand, creator, and appealer."""
    accs = get_accounts()
    return accs


@pytest.fixture(scope="session")
def brand_account(test_accounts):
    return test_accounts[0]


@pytest.fixture(scope="session")
def creator_account(test_accounts):
    return test_accounts[1]


@pytest.fixture(scope="session")
def appealer_account(test_accounts):
    return test_accounts[2]


@pytest.fixture
def install_mocks(client):
    """
    Install persistent simulator mocks using a bare-dict payload.
    Requirement: gltest fixtures with bare-dict sim_installMocks.
    """
    def _install(llm_mocks=None, web_mocks=None, strict=False):
        payload = {
            "llm_mocks": llm_mocks or {},
            "web_mocks": web_mocks or {},
            "strict": strict,
        }
        # Bare dict parameter for sim_installMocks
        return client.provider.make_request("sim_installMocks", payload)

    return _install


@pytest.fixture
def adshield_contract(client, brand_account):
    """Deploy fresh AdShield Pro contract instance for test."""
    factory = get_contract_factory(contract_file_path="contract.py")
    contract = factory.deploy(account=brand_account)
    return Contract.new(address=contract.address, schema=CONTRACT_SCHEMA, account=brand_account)
