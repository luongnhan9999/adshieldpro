import React from 'react';
import { AlertTriangle, ExternalLink } from 'lucide-react';
import { STUDIO_ACCOUNTS_URL } from '../config/genlayer';

interface ZeroBalanceBannerProps {
  balance: string;
  userAddress: string | null;
}

export const ZeroBalanceBanner: React.FC<ZeroBalanceBannerProps> = ({ balance, userAddress }) => {
  if (!userAddress || parseFloat(balance) > 0) {
    return null;
  }

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-3 text-amber-200">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-2.5">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 animate-pulse" />
          <span>
            <strong className="font-semibold text-amber-300">0 GEN Balance Detected!</strong> You need test GEN tokens to create escrow campaigns or stake dispute bonds on Studionet.
          </span>
        </div>
        <a
          href={STUDIO_ACCOUNTS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-medium text-xs rounded-lg border border-amber-500/40 transition-colors shrink-0"
        >
          <span>Claim Test GEN in GenLayer Studio Accounts</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
};
