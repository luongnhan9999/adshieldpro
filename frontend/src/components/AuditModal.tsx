import React, { useState } from 'react';
import {
  X,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Award,
  Cpu,
  FileSearch,
  CheckCircle2,
  AlertTriangle,
  Scale
} from 'lucide-react';
import { Campaign, CampaignStatus } from '../types';
import { truncateAddress } from '../utils/formatters';

interface AuditModalProps {
  campaign: Campaign | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AuditModal: React.FC<AuditModalProps> = ({ campaign, isOpen, onClose }) => {
  if (!isOpen || !campaign) return null;

  const [activeTab, setActiveTab] = useState<'verdict' | 'evidence' | 'consensus'>('verdict');

  const isCompliant = campaign.verdict === 'COMPLIANT' || campaign.verdict === 'TIMEOUT_APPROVED';
  const isViolated = campaign.verdict === 'VIOLATED';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0c111e] border border-slate-700/80 rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3.5">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center border shadow-lg ${
                isCompliant
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40 shadow-emerald-500/10'
                  : isViolated
                  ? 'bg-rose-500/15 text-rose-400 border-rose-500/40 shadow-rose-500/10'
                  : 'bg-amber-500/15 text-amber-400 border-amber-500/40 shadow-amber-500/10'
              }`}
            >
              {isCompliant ? (
                <ShieldCheck className="w-6 h-6" />
              ) : isViolated ? (
                <ShieldAlert className="w-6 h-6" />
              ) : (
                <Clock className="w-6 h-6" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white">
                  GenLayer Consensus Audit Dossier
                </h3>
                <span className="text-xs font-mono text-indigo-400 font-bold px-2 py-0.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                  {campaign.campaign_id}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                On-Chain Subjective Verification rendered on GenVM (Studionet 61999)
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

        {/* Navigation Sub-Tabs */}
        <div className="flex items-center gap-2 px-6 py-2.5 border-b border-slate-800/80 bg-slate-950/40 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('verdict')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              activeTab === 'verdict'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Consensus Verdict &amp; Rationale
          </button>
          <button
            onClick={() => setActiveTab('evidence')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              activeTab === 'evidence'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Guidelines vs Live Deliverable
          </button>
          <button
            onClick={() => setActiveTab('consensus')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              activeTab === 'consensus'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Validator Node Telemetry
          </button>
        </div>

        {/* Content Container */}
        <div className="p-6 space-y-6 max-h-[72vh] overflow-y-auto">
          {activeTab === 'verdict' && (
            <>
              {/* Verdict Hero Banner */}
              <div
                className={`p-5 rounded-3xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 ${
                  isCompliant
                    ? 'bg-gradient-to-r from-emerald-500/10 via-slate-900/50 to-slate-900/80 border-emerald-500/30 text-emerald-300'
                    : isViolated
                    ? 'bg-gradient-to-r from-rose-500/10 via-slate-900/50 to-slate-900/80 border-rose-500/30 text-rose-300'
                    : 'bg-gradient-to-r from-amber-500/10 via-slate-900/50 to-slate-900/80 border-amber-500/30 text-amber-300'
                }`}
              >
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-bold opacity-75 block">
                    Decentralized Subjective Verdict
                  </span>
                  <div className="text-2xl font-black tracking-tight mt-1">
                    {campaign.verdict || 'AWAITING_REVIEW'}
                  </div>
                  <p className="text-xs text-slate-300 mt-1 max-w-sm">
                    {isCompliant
                      ? 'Creator fulfilled all mandatory criteria. Escrow funds unlocked.'
                      : isViolated
                      ? 'Deliverable failed compliance criteria. Funds refundable to sponsor.'
                      : 'Campaign deliverable pending AI Court adjudication.'}
                  </p>
                </div>

                {/* Circular / Box Score Badges */}
                <div className="flex items-center gap-3">
                  <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-center min-w-[90px]">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Compliance</span>
                    <div className="text-xl font-black font-mono text-white mt-0.5">
                      {campaign.compliance_score}%
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-center min-w-[90px]">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Confidence</span>
                    <div className="text-xl font-black font-mono text-indigo-400 mt-0.5">
                      {campaign.confidence}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Qualitative Rationale Dossier */}
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  AI Subjective Court Qualitative Evaluation
                </span>
                <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 text-xs text-slate-200 leading-relaxed font-sans shadow-inner">
                  {campaign.reason || 'No audit rationale recorded on-chain yet.'}
                </div>
              </div>

              {/* Involved Addresses */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Brand Sponsor</span>
                  <div className="text-xs font-mono text-slate-200 mt-1 font-semibold">
                    {campaign.brand}
                  </div>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Creator Address</span>
                  <div className="text-xs font-mono text-teal-300 mt-1 font-semibold">
                    {campaign.creator}
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'evidence' && (
            <div className="space-y-4">
              {/* Guidelines */}
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Sponsor Guidelines &amp; Criteria Tested
                </span>
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 whitespace-pre-wrap font-mono leading-relaxed shadow-inner">
                  {campaign.guidelines}
                </div>
              </div>

              {/* Deliverable URL */}
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Live Web Evidence (Rendered via gl.nondet.web.render)
                </span>
                {campaign.deliverable_url ? (
                  <a
                    href={campaign.deliverable_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/15 text-xs transition-colors"
                  >
                    <span className="font-mono truncate mr-2">{campaign.deliverable_url}</span>
                    <ExternalLink className="w-4 h-4 shrink-0" />
                  </a>
                ) : (
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-850 text-slate-500 text-xs italic">
                    Deliverable URL has not been submitted yet.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'consensus' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs leading-relaxed">
                <div className="font-bold mb-1 flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-purple-400" />
                  <span>GenLayer Subjective Consensus Architecture</span>
                </div>
                When `adjudicate` or `appeal` is triggered, the leader validator fetches the live web page inside `gl.nondet.web.render`. Independent node validators verify that the subjective consensus meets the quorum threshold before committing the final state on GenVM.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Network</span>
                  <span className="font-mono text-white mt-1 block">GenLayer Studionet (61999)</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Consensus Algorithm</span>
                  <span className="font-mono text-teal-300 mt-1 block">Subjective LLM Agreement</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Anti-Cancel Status</span>
                  <span className="font-mono text-emerald-400 mt-1 block">Non-Custodial Enforcement</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Dispute Mechanism</span>
                  <span className="font-mono text-indigo-400 mt-1 block">20% Staked Bond Appeal</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-2xl bg-slate-850 hover:bg-slate-800 text-white text-xs font-bold transition-all border border-slate-750"
          >
            Close Dossier
          </button>
        </div>
      </div>
    </div>
  );
};

