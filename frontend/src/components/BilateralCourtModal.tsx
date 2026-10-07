import React from 'react';
import {
  X,
  Scale,
  ShieldCheck,
  Lock,
  Clock,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Globe,
  Coins,
  FileText
} from 'lucide-react';

interface BilateralCourtModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BilateralCourtModal: React.FC<BilateralCourtModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0b101d] border border-slate-700/80 rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white">
                  GenVM Subjective Consensus Court Charter
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 text-[10px] font-mono font-bold">
                  Bilateral Protection
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Symmetric interest protection and equal sovereign rights for Brand Sponsors &amp; Creators
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-xs leading-relaxed">
          {/* Summary Box */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-teal-500/10 border border-indigo-500/30">
            <h4 className="font-bold text-white text-sm flex items-center gap-2 mb-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Decentralized Arbitration Principles on GenLayer</span>
            </h4>
            <p className="text-slate-300 text-xs">
              Every marketing escrow agreement is executed deterministically and autonomously via <strong>GenVM</strong> intelligent contracts on Studionet (Chain ID: 61999). 
              No central party, protocol admin, or malicious actor has the unilateral power to override consensus, alter guidelines, or confiscate escrowed funds.
            </p>
          </div>

          {/* Bilateral Comparison Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Creator Protections */}
            <div className="p-5 rounded-2xl bg-slate-950/80 border border-teal-500/30 space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-800 text-teal-300 font-bold text-sm">
                <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400">
                  <Lock className="w-4 h-4" />
                </div>
                <span>Rights &amp; Safeguards for Content Creators</span>
              </div>

              <div className="space-y-2.5 text-slate-300">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">Anti-Cancel Escrow Lock:</strong> The moment a creator submits their deliverable link, the smart contract immediately freezes brand cancellation rights. The sponsor cannot pull back or drain funds.
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">Guaranteed Auto-Payout Timeout:</strong> If a brand sponsor fails or neglects to adjudicate within the agreed review window (e.g. 48 hours), the creator can autonomously claim 100% of the bounty directly from the contract.
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">Right to Dispute Appeal:</strong> In the event of an initial VIOLATED verdict, creators retain the sovereign right to stake a 20% appeal bond to trigger a full re-audit by a diverse multi-validator consensus committee.
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">Immutable Evaluation Scope:</strong> The AI Court strictly evaluates the deliverable against the on-chain guidelines locked at campaign creation. Sponsors cannot introduce retroactive requirements.
                  </div>
                </div>
              </div>
            </div>

            {/* Brand Protections */}
            <div className="p-5 rounded-2xl bg-slate-950/80 border border-indigo-500/30 space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-800 text-indigo-300 font-bold text-sm">
                <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                  <Coins className="w-4 h-4" />
                </div>
                <span>Rights &amp; Safeguards for Brand Sponsors</span>
              </div>

              <div className="space-y-2.5 text-slate-300">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">Direct Web Ground-Truth Extraction:</strong> GenVM validators execute `gl.nondet.web.render` to extract real live web text. If the deliverable is missing, 404, or private, 100% of the bounty is refunded to the brand.
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">Strict Compliance Threshold (&gt;= 70%):</strong> Creators must genuinely satisfy hashtags, backlinks, and talking points. Submissions scoring under 70 are rejected with an automatic refund.
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">Safe Pre-Submission Cancellation:</strong> As long as no deliverable has been submitted by a creator, brand sponsors retain 100% custody recovery to cancel and withdraw escrow instantly.
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">Sponsor Dispute Appeal Right:</strong> If a faulty COMPLIANT verdict occurs, brands also hold the right to stake a 20% appeal bond to invoke higher-tier committee re-evaluation.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Smart Contract Technical Safeguards */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
            <h5 className="font-bold text-white uppercase text-[11px] tracking-wider text-slate-400">
              Technical Smart Contract Guarantees (GenVM Zero-Trust)
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-slate-300 text-[11px]">
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block font-bold mb-1">1. Non-Custodial Vault</span>
                Tokens are held solely in contract escrow and settled via native `emit_transfer` calls.
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block font-bold mb-1">2. Multi-Validator Quorum</span>
                Independent validator LLMs vote in parallel; verdicts require consensus quorum (&gt; 66%).
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block font-bold mb-1">3. Anti-Griefing 20% Bond</span>
                The 20% appeal staking bond prevents frivolous dispute spam and aligns economic incentives.
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20"
          >
            I Understand the Protocol Charter
          </button>
        </div>
      </div>
    </div>
  );
};
