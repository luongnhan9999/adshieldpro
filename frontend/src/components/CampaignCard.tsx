import React from 'react';
import {
  ExternalLink,
  ShieldCheck,
  Scale,
  Clock,
  RotateCcw,
  AlertCircle,
  Eye,
  Send,
  XCircle,
  Loader2,
  Video,
  Twitter,
  FileText
} from 'lucide-react';
import { Campaign, CampaignStatus } from '../types';
import { formatGen, truncateAddress, getStatusInfo } from '../utils/formatters';

interface CampaignCardProps {
  campaign: Campaign;
  userAddress: string | null;
  onAdjudicate: (campaignId: string) => Promise<void>;
  onClaimTimeout: (campaignId: string) => Promise<void>;
  onFileAppeal: (campaignId: string, minBondWei: string) => Promise<void>;
  onCancel: (campaignId: string) => Promise<void>;
  onOpenAudit: (campaign: Campaign) => void;
  onSelectSubmit: (campaignId: string) => void;
  actionLoading: string | null;
}

export const CampaignCard: React.FC<CampaignCardProps> = ({
  campaign,
  userAddress,
  onAdjudicate,
  onClaimTimeout,
  onFileAppeal,
  onCancel,
  onOpenAudit,
  onSelectSubmit,
  actionLoading,
}) => {
  const statusInfo = getStatusInfo(campaign.status);
  const isLoading = actionLoading === campaign.campaign_id;

  const isBrand = userAddress && userAddress.toLowerCase() === campaign.brand.toLowerCase();
  const isCreator = userAddress && userAddress.toLowerCase() === campaign.creator.toLowerCase();

  // 20% appeal bond calculation
  const appealBondWei = (BigInt(campaign.bounty_amount || '0') / 5n).toString();
  const appealBondGen = formatGen(appealBondWei);

  const renderPlatformIcon = (platform: string) => {
    switch (platform.toUpperCase()) {
      case 'YOUTUBE':
        return <Video className="w-3.5 h-3.5 text-red-400" />;
      case 'X_TWITTER':
        return <Twitter className="w-3.5 h-3.5 text-sky-400" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-teal-400" />;
    }
  };

  return (
    <div className="bg-[#101626]/90 border border-slate-800 rounded-3xl p-6 hover:border-slate-700/80 transition-all flex flex-col justify-between shadow-lg hover:shadow-xl">
      <div>
        {/* Top bar: ID, Platform, Status */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-slate-800 font-mono text-xs font-bold text-white border border-slate-700">
              {campaign.campaign_id}
            </span>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300">
              {renderPlatformIcon(campaign.platform)}
              <span>{campaign.platform}</span>
            </div>
          </div>

          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-semibold tracking-wide ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`}>
            {statusInfo.pulse && <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping" />}
            <span>{statusInfo.label}</span>
          </div>
        </div>

        {/* Bounty */}
        <div className="mb-4">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Escrow Bounty
          </span>
          <div className="text-2xl font-extrabold font-mono text-white tracking-tight mt-0.5">
            {formatGen(campaign.bounty_amount)} <span className="text-indigo-400 text-sm font-sans font-semibold">GEN</span>
          </div>
        </div>

        {/* Guidelines */}
        <div className="mb-4">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Requirements
          </span>
          <p className="text-xs text-slate-300 line-clamp-2 font-mono bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/60">
            {campaign.guidelines}
          </p>
        </div>

        {/* Deliverable link */}
        {campaign.deliverable_url && (
          <div className="mb-4">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Deliverable URL
            </span>
            <a
              href={campaign.deliverable_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-2.5 rounded-xl bg-teal-500/5 border border-teal-500/20 text-teal-300 hover:bg-teal-500/10 text-xs transition-colors"
            >
              <span className="font-mono truncate mr-2">{campaign.deliverable_url}</span>
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
            </a>
          </div>
        )}

        {/* Metadata grid */}
        <div className="grid grid-cols-2 gap-2 text-[11px] font-mono mb-5 pt-3 border-t border-slate-800/60 text-slate-400">
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-sans">Brand</span>
            <span className="truncate block text-slate-300">{truncateAddress(campaign.brand)}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-sans">Creator</span>
            <span className="truncate block text-teal-300">{truncateAddress(campaign.creator)}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 pt-2 border-t border-slate-800/80">
        {/* Status: OPEN */}
        {campaign.status === CampaignStatus.OPEN && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onSelectSubmit(campaign.campaign_id)}
              disabled={isLoading}
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 text-teal-300 text-xs font-semibold transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit Content</span>
            </button>
            {isBrand && (
              <button
                onClick={() => onCancel(campaign.campaign_id)}
                disabled={isLoading}
                className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold transition-colors"
                title="Cancel & Refund"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>
            )}
          </div>
        )}

        {/* Status: IN_REVIEW */}
        {campaign.status === CampaignStatus.IN_REVIEW && (
          <div className="space-y-2">
            <button
              onClick={() => onAdjudicate(campaign.campaign_id)}
              disabled={isLoading}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-teal-500 hover:from-indigo-500 hover:to-teal-400 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all active:scale-[0.99] disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Consensus Adjudication Running...</span>
                </>
              ) : (
                <>
                  <Scale className="w-3.5 h-3.5" />
                  <span>Trigger AI Subjective Court</span>
                </>
              )}
            </button>

            <button
              onClick={() => onClaimTimeout(campaign.campaign_id)}
              disabled={isLoading}
              className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[11px] font-semibold transition-colors"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Claim Auto-Payout (If Timeout Passed)</span>
            </button>
          </div>
        )}

        {/* Status: RESOLVED (PAID or REFUNDED) */}
        {(campaign.status === CampaignStatus.RESOLVED_PAID || campaign.status === CampaignStatus.RESOLVED_REFUNDED) && (
          <div className="space-y-2">
            <button
              onClick={() => onOpenAudit(campaign)}
              className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-xs font-semibold transition-colors"
            >
              <Eye className="w-3.5 h-3.5 text-indigo-400" />
              <span>Inspect AI Consensus Verdict</span>
            </button>

            <button
              onClick={() => onFileAppeal(campaign.campaign_id, appealBondWei)}
              disabled={isLoading}
              className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 text-[11px] font-semibold transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Appeal Dispute (Stake {appealBondGen} GEN Bond)</span>
            </button>
          </div>
        )}

        {/* Status: IN_APPEAL */}
        {campaign.status === CampaignStatus.IN_APPEAL && (
          <div className="space-y-2">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-[11px] text-center font-medium">
              Stake Active: {formatGen(campaign.appeal_bond)} GEN Bond Locked.
            </div>
            <button
              onClick={() => onAdjudicate(campaign.campaign_id)}
              disabled={isLoading}
              className="w-full inline-flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-colors"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Re-Adjudicating Appeal...</span>
                </>
              ) : (
                <>
                  <Scale className="w-3.5 h-3.5" />
                  <span>Re-Run Multi-Validator Consensus</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
