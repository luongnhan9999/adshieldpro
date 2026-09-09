import React, { useState } from 'react';
import { Shield, Wallet, CheckCircle2, ChevronDown, Settings, Network } from 'lucide-react';
import { truncateAddress, formatGen } from '../utils/formatters';
import { STUDIONET_CHAIN_ID } from '../config/genlayer';

interface NavbarProps {
  userAddress: string | null;
  balance: string;
  chainId: number | null;
  contractAddress: string;
  onConnectWallet: () => void;
  onUpdateContractAddress: (newAddress: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  userAddress,
  balance,
  chainId,
  contractAddress,
  onConnectWallet,
  onUpdateContractAddress,
}) => {
  const [showConfig, setShowConfig] = useState(false);
  const [tempAddress, setTempAddress] = useState(contractAddress);

  const isStudionet = chainId === 61999;

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempAddress.trim()) {
      onUpdateContractAddress(tempAddress.trim());
      setShowConfig(false);
    }
  };

  return (
    <header className="border-b border-slate-800/80 bg-[#0c101d]/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-teal-400 flex items-center justify-center shadow-lg shadow-indigo-500/20 border border-indigo-400/30">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                AdShield Pro
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 tracking-wide uppercase">
                Studionet v1.0
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Autonomous Creator Marketing Escrow & Subjective Court
            </p>
          </div>
        </div>

        {/* Right action group */}
        <div className="flex items-center gap-3">
          {/* Network indicator */}
          <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono font-medium ${
            isStudionet
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isStudionet ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
            <Network className="w-3.5 h-3.5 opacity-70" />
            <span>{isStudionet ? 'Studionet (61999)' : 'Wrong Network'}</span>
          </div>

          {/* Contract address modal trigger */}
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
            title="Configure Target Contract Address"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Connect / User Info */}
          {userAddress ? (
            <div className="flex items-center gap-2 p-1.5 pl-3 rounded-xl bg-slate-800/80 border border-slate-700/70">
              <div className="flex flex-col items-end text-right">
                <span className="text-xs font-semibold text-slate-200 font-mono">
                  {truncateAddress(userAddress)}
                </span>
                <span className="text-[11px] text-teal-400 font-mono font-medium">
                  {parseFloat(balance).toFixed(4)} GEN
                </span>
              </div>
              <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
            </div>
          ) : (
            <button
              onClick={onConnectWallet}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-sm font-medium shadow-lg shadow-indigo-600/25 transition-all active:scale-[0.98]"
            >
              <Wallet className="w-4 h-4" />
              <span>Connect MetaMask</span>
            </button>
          )}
        </div>
      </div>

      {/* Contract configuration dropdown/panel */}
      {showConfig && (
        <div className="border-t border-slate-800 bg-[#090d16] px-4 py-3">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-400">
              <span className="font-semibold text-slate-300">Target Contract:</span>
              <span className="font-mono text-indigo-300">{contractAddress}</span>
            </div>
            <form onSubmit={handleSaveAddress} className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                value={tempAddress}
                onChange={(e) => setTempAddress(e.target.value)}
                placeholder="Enter 0x... contract address"
                className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-full sm:w-80"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors shrink-0"
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
