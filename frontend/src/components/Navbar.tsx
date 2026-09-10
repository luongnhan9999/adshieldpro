import React, { useState, useEffect } from 'react';
import {
  Shield,
  Wallet,
  CheckCircle2,
  Settings,
  Network,
  ExternalLink,
  Activity,
  Copy,
  Check,
  AlertCircle
} from 'lucide-react';
import { truncateAddress } from '../utils/formatters';
import { STUDIONET_CHAIN_ID, STUDIONET_RPC_URL, STUDIO_ACCOUNTS_URL, ensureStudionetNetwork } from '../config/genlayer';

interface NavbarProps {
  userAddress: string | null;
  balance: string;
  chainId: number | null;
  contractAddress: string;
  onConnectWallet: () => void;
  onSwitchNetwork?: () => void;
  onUpdateContractAddress: (newAddress: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  userAddress,
  balance,
  chainId,
  contractAddress,
  onConnectWallet,
  onSwitchNetwork,
  onUpdateContractAddress,
}) => {
  const [showConfig, setShowConfig] = useState(false);
  const [tempAddress, setTempAddress] = useState(contractAddress);
  const [copied, setCopied] = useState(false);
  const [rpcPing, setRpcPing] = useState<number | null>(null);

  const isStudionet = chainId === STUDIONET_CHAIN_ID;

  // Monitor Studionet RPC latency
  useEffect(() => {
    let isMounted = true;
    const measurePing = async () => {
      const start = Date.now();
      try {
        await fetch(STUDIONET_RPC_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'net_version', params: [] }),
        });
        if (isMounted) {
          setRpcPing(Date.now() - start);
        }
      } catch {
        if (isMounted) {
          setRpcPing(null);
        }
      }
    };

    measurePing();
    const interval = setInterval(measurePing, 20000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempAddress.trim()) {
      onUpdateContractAddress(tempAddress.trim());
      setShowConfig(false);
    }
  };

  return (
    <header className="border-b border-slate-800/80 bg-[#070a14]/90 backdrop-blur-xl sticky top-0 z-40 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3.5">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 via-teal-400 to-purple-500 rounded-2xl blur opacity-40 group-hover:opacity-75 transition duration-500"></div>
            <div className="relative w-11 h-11 rounded-xl bg-slate-900 border border-slate-700/80 flex items-center justify-center shadow-lg">
              <Shield className="w-6 h-6 text-indigo-400 group-hover:scale-110 transition-transform duration-300" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                AdShield Pro
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 tracking-wider uppercase">
                Studionet v1.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <span>Autonomous Creator Marketing Escrow</span>
              <span className="text-slate-600">•</span>
              <span className="text-indigo-400/90 font-medium">GenVM Consensus</span>
            </p>
          </div>
        </div>

        {/* Right action group */}
        <div className="flex items-center gap-3">
          {/* RPC Latency & Telemetry */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono">
            <Activity className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
            <span className="text-slate-400">RPC:</span>
            <span className={rpcPing ? 'text-teal-300 font-semibold' : 'text-slate-500'}>
              {rpcPing ? `${rpcPing}ms` : '61999'}
            </span>
          </div>

          {/* Network indicator */}
          <div
            onClick={() => onSwitchNetwork ? onSwitchNetwork() : ensureStudionetNetwork()}
            className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-mono font-medium cursor-pointer transition-all ${
              isStudionet
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/15'
                : 'bg-rose-500/15 border-rose-500/40 text-rose-300 hover:bg-rose-500/25 animate-pulse'
            }`}
            title={isStudionet ? 'Connected to GenLayer Studionet (61999)' : 'Click to switch MetaMask to Studionet'}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isStudionet ? 'bg-emerald-400 animate-ping' : 'bg-rose-400'
              }`}
            />
            <Network className="w-3.5 h-3.5 opacity-80" />
            <span>{isStudionet ? 'Studionet (61999)' : 'Switch to Studionet'}</span>
          </div>

          {/* Faucet Link */}
          <a
            href={STUDIO_ACCOUNTS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-medium transition-all"
            title="Get test GEN from Studio Accounts"
          >
            <span>Studio Faucet</span>
            <ExternalLink className="w-3 h-3" />
          </a>

          {/* Contract address modal trigger */}
          <button
            onClick={() => setShowConfig(!showConfig)}
            className={`p-2 rounded-xl transition-all ${
              showConfig
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800'
            }`}
            title="Configure Escrow Contract Address"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Connect / User Info */}
          {userAddress ? (
            <div className="flex items-center gap-2 p-1.5 pl-3 rounded-2xl bg-slate-900/90 border border-slate-700/80 shadow-inner">
              <div className="flex flex-col items-end text-right">
                <span className="text-xs font-semibold text-slate-200 font-mono">
                  {truncateAddress(userAddress)}
                </span>
                <span className="text-[11px] text-teal-400 font-mono font-bold">
                  {parseFloat(balance) > 0 ? parseFloat(balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 }) : '0.000'} GEN
                </span>
              </div>
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-teal-400 p-[1px] shadow-sm">
                <div className="w-full h-full bg-slate-900 rounded-[11px] flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-teal-400" />
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={onConnectWallet}
              className="relative group flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-teal-500 hover:from-indigo-500 hover:to-teal-400 text-white text-xs font-bold shadow-lg shadow-indigo-600/25 transition-all active:scale-[0.98]"
            >
              <Wallet className="w-4 h-4" />
              <span>Connect Wallet</span>
            </button>
          )}
        </div>
      </div>

      {/* Contract configuration dropdown/panel */}
      {showConfig && (
        <div className="border-t border-slate-800 bg-[#080c16]/95 backdrop-blur-xl px-4 py-3.5 animate-in slide-in-from-top-2">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-300 w-full sm:w-auto">
              <span className="font-semibold text-slate-400 uppercase tracking-wider text-[11px]">Active Escrow Contract:</span>
              <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 font-mono text-indigo-300 text-xs">
                <span>{contractAddress || 'Not set'}</span>
                {contractAddress && (
                  <button
                    onClick={() => handleCopy(contractAddress)}
                    className="hover:text-white transition-colors ml-1"
                    title="Copy Address"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>
            </div>

            <form onSubmit={handleSaveAddress} className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                value={tempAddress}
                onChange={(e) => setTempAddress(e.target.value)}
                placeholder="Enter 0x... contract address"
                className="px-3.5 py-1.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-full sm:w-80 shadow-inner"
              />
              <button
                type="submit"
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all shadow-md shadow-indigo-600/20 shrink-0 text-xs"
              >
                Save
              </button>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};

