import { createClient, chains } from 'genlayer-js';
import { toRlp } from 'viem';
import { encodeCalldata, encodeAddTransaction, decodeCalldataString } from '../utils/calldata';

export const STUDIONET_CHAIN_ID = 61999;
export const STUDIONET_CHAIN_ID_HEX = '0xF22F';
export const STUDIONET_RPC_URL = 'https://studio.genlayer.com/api';
export const STUDIO_ACCOUNTS_URL = 'https://studio.genlayer.com';

export const STUDIONET_CHAIN_CONFIG = {
  chainId: STUDIONET_CHAIN_ID_HEX,
  chainName: 'GenLayer Studionet',
  nativeCurrency: {
    name: 'GEN',
    symbol: 'GEN',
    decimals: 18,
  },
  rpcUrls: [STUDIONET_RPC_URL],
  blockExplorerUrls: ['https://studio.genlayer.com'],
};

export const studionet = {
  ...chains.simulator,
  id: STUDIONET_CHAIN_ID,
  name: 'GenLayer Studionet',
  rpcUrls: {
    default: { http: [STUDIONET_RPC_URL] },
  },
  blockExplorers: {
    default: { name: 'GenLayer Studio', url: 'https://studio.genlayer.com' },
  },
};

// Client for GenLayer Studionet schema and general operations
export const genlayerClient = createClient({
  chain: studionet,
  endpoint: STUDIONET_RPC_URL,
});

export const DEFAULT_CONTRACT_ADDRESS = '0x916E0030A988f99680b314AA17eCD9Ce70907D03';

export function getStoredContractAddress(): string {
  if (typeof window === 'undefined') return DEFAULT_CONTRACT_ADDRESS;
  const stored = localStorage.getItem('adshield_contract_address');
  if (
    !stored ||
    stored === '0x0000000000000000000000000000000000000000' ||
    stored.toLowerCase() === '0x0ea45978d1960b5286b63aeb574fb0dfa37833bf'
  ) {
    localStorage.setItem('adshield_contract_address', DEFAULT_CONTRACT_ADDRESS);
    return DEFAULT_CONTRACT_ADDRESS;
  }
  return stored;
}

export function setStoredContractAddress(address: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('adshield_contract_address', address.trim());
  }
}

/**
 * Switch or add GenLayer Studionet (Chain ID 61999 / 0xF22F) in MetaMask.
 */
export async function ensureStudionetNetwork(): Promise<boolean> {
  if (typeof window === 'undefined' || !(window as any).ethereum) {
    throw new Error('MetaMask is not installed. Please install MetaMask to interact with AdShield Pro.');
  }

  const ethereum = (window as any).ethereum;

  try {
    await ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: STUDIONET_CHAIN_ID_HEX }],
    });
    return true;
  } catch (switchError: any) {
    // Error 4902 indicates chain hasn't been added yet
    if (switchError.code === 4902 || switchError?.data?.originalError?.code === 4902) {
      try {
        await ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [STUDIONET_CHAIN_CONFIG],
        });
        return true;
      } catch (addError) {
        console.error('Failed to add GenLayer Studionet to MetaMask:', addError);
        throw addError;
      }
    }
    console.error('Failed to switch to GenLayer Studionet:', switchError);
    throw switchError;
  }
}

/**
 * Directly fetch native GEN balance from GenLayer Studionet RPC.
 * Guaranteed to reflect true on-chain balance without MetaMask network lag.
 */
export async function fetchStudionetBalance(address: string): Promise<bigint> {
  if (!address || address === '0x0000000000000000000000000000000000000000') return 0n;

  try {
    const res = await fetch(STUDIONET_RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_getBalance',
        params: [address, 'latest'],
      }),
    });
    const json = await res.json();
    if (json?.result) {
      return BigInt(json.result);
    }
  } catch (e) {
    console.warn('Failed to query balance directly from Studionet RPC:', e);
  }
  return 0n;
}

/**
 * Authoritative on-chain contract reader using native GenLayer gen_call.
 */
export async function readContractStudionet(params: {
  address: string;
  functionName: string;
  args?: any[];
  from?: string;
}): Promise<string> {
  const { address, functionName, args = [], from = '0x0000000000000000000000000000000000000000' } = params;
  const calldataHex = encodeCalldata({ method: functionName, args });

  // 1. Try via window.ethereum if connected on Studionet
  if (typeof window !== 'undefined' && (window as any).ethereum) {
    try {
      const ethRes = await (window as any).ethereum.request({
        method: 'gen_call',
        params: [
          {
            from,
            to: address,
            data: calldataHex,
            type: 'read',
          },
        ],
      });
      if (ethRes) {
        return decodeCalldataString(ethRes);
      }
    } catch (e) {
      // Fallback to direct HTTP RPC fetch
    }
  }

  // 2. Direct HTTP RPC fetch
  const response = await fetch(STUDIONET_RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'gen_call',
      params: [
        {
          from,
          to: address,
          data: calldataHex,
          type: 'read',
        },
      ],
    }),
  });

  const json = await response.json();
  if (json.error) {
    throw new Error(json.error.message || 'GenLayer read error');
  }

  return decodeCalldataString(json.result);
}

/**
 * Execute a write transaction through MetaMask with serialized calldata.
 */
export async function sendContractTransaction(params: {
  address: string;
  functionName: string;
  args: any[];
  from: string;
  value?: bigint;
}): Promise<string> {
  if (typeof window === 'undefined' || !(window as any).ethereum) {
    throw new Error('MetaMask is not installed.');
  }

  const { address, functionName, args, from, value = 0n } = params;

  // 1. Encode GenVM method and arguments
  const calldataHex = encodeCalldata({ method: functionName, args });

  // 2. Wrap into RLP pair [calldata, "0x"] (standard GenLayer transaction format)
  const txDataRlp = toRlp([calldataHex, '0x']);

  // 3. Wrap in GenLayer Consensus rollup envelope (0x27241a99)
  const callData = encodeAddTransaction(from, address, 5, 3, txDataRlp);

  const txParams: any = {
    from,
    to: address,
    data: callData,
    value: value > 0n ? `0x${value.toString(16)}` : '0x0',
  };

  const txHash = await (window as any).ethereum.request({
    method: 'eth_sendTransaction',
    params: [txParams],
  });

  return txHash;
}
