import React from 'react';
import { X, Sparkles, ExternalLink, ShieldCheck, ShieldAlert, Clock, Award } from 'lucide-react';
import { Campaign, CampaignStatus } from '../types';
import { truncateAddress } from '../utils/formatters';

interface AuditModalProps {
  campaign: Campaign | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AuditModal: React.FC<AuditModalProps> = ({ campaign, isOpen, onClose }) => {
  if (!isOpen || !campaign) return null;

  const isCompliant = campaign.verdict === 'COMPLIANT' || campaign.verdict === 'TIMEOUT_APPROVED';
  const isViolated = campaign.verdict === 'VIOLATED';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#111726] border border-slate-700/80 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isCompliant
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : isViolated
                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
            }`}>
              {isCompliant ? <ShieldCheck className="w-5 h-5" /> : isViolated ? <ShieldAlert className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  GenLayer Consensus Audit Report
                </h3>
                <span className="text-xs font-mono text-indigo-400 font-semibold">
                  [{campaign.campaign_id}]
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Decentralized subjective agreement rendered on GenVM
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Verdict Hero */}
          <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
            isCompliant
              ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-300'
              : isViolated
              ? 'bg-rose-500/5 border-rose-500/20 text-rose-300'
              : 'bg-amber-500/5 border-amber-500/20 text-amber-300'
          }`}>
            <div>
              <span className="text-[11px] uppercase tracking-wider font-semibold opacity-70">
                Consensus Verdict
              </span>
              <div className="text-xl font-extrabold tracking-tight mt-0.5">
                {campaign.verdict}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-[10px] uppercase font-semibold text-slate-400">Compliance</span>
                <div className="text-lg font-bold font-mono text-white">
                  {campaign.compliance_score}%
                </div>
              </div>
              <div className="w-px h-8 bg-slate-700/60" />
              <div className="text-right">
                <span className="text-[10px] uppercase font-semibold text-slate-400">Confidence</span>
                <div className="text-lg font-bold font-mono text-white">
                  {campaign.confidence}%
                </div>
              </div>
            </div>
          </div>

          {/* Qualitative Rationale */}
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Auditor Qualitative Rationale
            </span>
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-sm text-slate-200 leading-relaxed font-sans">
              {campaign.reason || 'No audit reason recorded yet.'}
            </div>
          </div>

          {/* Deliverable Evidence */}
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Live Deliverable Inspected On-Chain
            </span>
            {campaign.deliverable_url ? (
              <a
                href={campaign.deliverable_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3.5 rounded-xl bg-indigo-500/5 border border-indigo-500/20 text-indigo-300 hover:bg-indigo-500/10 text-xs transition-colors"
              >
                <span className="font-mono truncate mr-2">{campaign.deliverable_url}</span>
                <ExternalLink className="w-4 h-4 shrink-0" />
              </a>
            ) : (
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-500 text-xs italic">
                Deliverable has not been submitted yet.
              </div>
            )}
          </div>

          {/* Guidelines */}
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Brand Guidelines Evaluated Against
            </span>
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 whitespace-pre-wrap font-mono">
              {campaign.guidelines}
            </div>
          </div>

          {/* Parties involved */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
            <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/70">
              <span className="text-[11px] text-slate-400 uppercase font-semibold">Brand Sponsor</span>
              <div className="text-xs font-mono text-slate-200 mt-1">
                {truncateAddress(campaign.brand)}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/70">
              <span className="text-[11px] text-slate-400 uppercase font-semibold">Participating Creator</span>
              <div className="text-xs font-mono text-teal-300 mt-1">
                {truncateAddress(campaign.creator)}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-[#0c101d] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium transition-colors"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};
