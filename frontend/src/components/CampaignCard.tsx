import React, { useState, useEffect } from 'react';
import {
  ExternalLink,
  ShieldCheck,
  Scale,
  Clock,
  RotateCcw,
  Eye,
  Send,
  XCircle,
  Loader2,
  Video,
  Twitter,
  FileText,
  Lock,
  Sparkles,
  User,
  ShieldAlert
} from 'lucide-react';
import { Campaign } from '../types';
import { formatGen, truncateAddress, getStatusInfo } from '../utils/formatters';

interface CampaignCardProps {
  campaign: Campaign;
  userAddress: string | null;
  onAdjudicate: (campaignId: string) => Promise<void>;
  onClaimTimeout: (campaignId: string) => Promise<void>;
  onFileAppeal: (campaignId: string, minBondWei: string) => Promise<void>;
  onFinalizeSettlement?: (campaignId: string) => Promise<void>;
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
  onFinalizeSettlement,
  onCancel,
  onOpenAudit,
  onSelectSubmit,
  actionLoading,
}) => {
  const statusInfo = getStatusInfo(campaign.status);
  const isLoading = actionLoading === campaign.campaign_id;
  const normStatus = String(campaign.status).toUpperCase();

  const isBrand = userAddress && userAddress.toLowerCase() === campaign.brand.toLowerCase();
  const isCreator = userAddress && userAddress.toLowerCase() === campaign.creator.toLowerCase();

  // 20% appeal bond calculation
  const appealBondWei = (BigInt(campaign.bounty_amount || '0') / 5n).toString();
  const appealBondGen = formatGen(appealBondWei);

  // Time remaining calculation for IN_REVIEW
  const [timeLeft, setTimeLeft] = useState<string | null>(null);
  const [isTimeoutReached, setIsTimeoutReached] = useState(false);

  useEffect(() => {
    if (normStatus !== 'IN_REVIEW' && normStatus !== '1') {
      setTimeLeft(null);
      return;
    }

    const submittedSec = parseInt(campaign.submitted_at || '0', 10);
    const timeoutSec = parseInt(campaign.timeout_duration || '172800', 10);

    if (submittedSec === 0) {
      setTimeLeft(null);
      return;
    }

    const updateTimer = () => {
      const nowSec = Math.floor(Date.now() / 1000);
      const deadlineSec = submittedSec + timeoutSec;
      const diffSec = deadlineSec - nowSec;

      if (diffSec <= 0) {
        setIsTimeoutReached(true);
        setTimeLeft('Expired (Auto-Payout Eligible)');
      } else {
        setIsTimeoutReached(false);
        const hours = Math.floor(diffSec / 3600);
        const minutes = Math.floor((diffSec % 3600) / 60);
        const seconds = diffSec % 60;
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s left`);
      }
    };

    updateTimer();
    const timerId = setInterval(updateTimer, 1000);
    return () => clearInterval(timerId);
  }, [normStatus, campaign.submitted_at, campaign.timeout_duration]);

  // Cooling period calculation for AWAITING_PAYOUT
  const [coolingTimeLeft, setCoolingTimeLeft] = useState<string | null>(null);
  const [isCoolingFinished, setIsCoolingFinished] = useState(false);

  useEffect(() => {
    if (normStatus !== 'AWAITING_PAYOUT') {
      setCoolingTimeLeft(null);
      return;
    }

    const readyAtSec = parseInt(campaign.payout_ready_at || '0', 10);
    if (readyAtSec === 0) {
      setIsCoolingFinished(true);
      setCoolingTimeLeft('Cooling period elapsed (Settlement ready)');
      return;
    }

    const updateCoolingTimer = () => {
      const nowSec = Math.floor(Date.now() / 1000);
      const diffSec = readyAtSec - nowSec;
      if (diffSec <= 0) {
        setIsCoolingFinished(true);
        setCoolingTimeLeft('24h dispute window elapsed (Ready to settle)');
      } else {
        setIsCoolingFinished(false);
        const hours = Math.floor(diffSec / 3600);
        const minutes = Math.floor((diffSec % 3600) / 60);
        const seconds = diffSec % 60;
        setCoolingTimeLeft(`${hours}h ${minutes}m ${seconds}s dispute window remaining`);
      }
    };

    updateCoolingTimer();
    const interval = setInterval(updateCoolingTimer, 1000);
    return () => clearInterval(interval);
  }, [normStatus, campaign.payout_ready_at]);

  const renderPlatformIcon = (platform: string) => {
    switch (platform.toUpperCase()) {
      case 'YOUTUBE':
        return <Video className="w-3.5 h-3.5 text-red-400" />;
      case 'X_TWITTER':
        return <Twitter className="w-3.5 h-3.5 text-sky-400" />;
      case 'TIKTOK':
        return <Sparkles className="w-3.5 h-3.5 text-pink-400" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-teal-400" />;
    }
  };

  return (
    <div className="glass-panel-interactive rounded-3xl p-6 flex flex-col justify-between shadow-xl relative group">
      <div>
        {/* Top Header: ID, Platform, Status Badge */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-xl bg-slate-900 font-mono text-xs font-bold text-white border border-slate-700/80 shadow-inner">
              {campaign.campaign_id}
            </span>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] font-semibold text-slate-300">
              {renderPlatformIcon(campaign.platform)}
              <span>{campaign.platform}</span>
            </div>
          </div>

          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-bold border tracking-wider uppercase font-mono ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`}
          >
            {statusInfo.pulse && <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping" />}
            <span>{statusInfo.label}</span>
          </div>
        </div>

        {/* User Role & Permission Indicator */}
        {isBrand && (
          <div className="mb-4 px-3 py-2 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-[11px] font-bold flex items-center justify-between shadow-sm">
            <span className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-indigo-400" />
              <span>ROLE: BRAND SPONSOR</span>
            </span>
            <span className="text-[10px] font-mono bg-indigo-500/20 px-2 py-0.5 rounded-md text-indigo-200">
              Escrow Creator &amp; Review Right
            </span>
          </div>
        )}
        {isCreator && (
          <div className="mb-4 px-3 py-2 rounded-2xl bg-teal-500/15 border border-teal-500/30 text-teal-300 text-[11px] font-bold flex items-center justify-between shadow-sm">
            <span className="flex items-center gap-1.5">
              <Send className="w-3.5 h-3.5 text-teal-400" />
              <span>ROLE: PROTECTED CREATOR</span>
            </span>
            <span className="text-[10px] font-mono bg-teal-500/20 px-2 py-0.5 rounded-md text-teal-200">
              Anti-Cancel &amp; Auto-Payout Right
            </span>
          </div>
        )}
        {!isBrand && !isCreator && (
          <div className="mb-4 px-3 py-1.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-slate-400 text-[11px] flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-slate-500" />
              <span>ROLE: COMMUNITY / OBSERVER</span>
            </span>
            <span className="text-[10px] font-mono text-slate-500">GenVM Zero-Trust</span>
          </div>
        )}

        {/* Escrow Bounty Card Section */}
        <div className="mb-4 p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between shadow-inner">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Escrow Bounty
            </span>
            <div className="text-2xl font-extrabold font-mono text-white tracking-tight mt-0.5 flex items-baseline gap-1">
              <span>{formatGen(campaign.bounty_amount)}</span>
              <span className="text-indigo-400 text-xs font-sans font-bold">GEN</span>
            </div>
          </div>

          {(normStatus === 'IN_REVIEW' || normStatus === '1' || normStatus === 'AWAITING_PAYOUT') && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-300 text-[10px] font-mono font-bold" title="Brand cannot cancel or withdraw escrow once deliverable is submitted">
              <Lock className="w-3.5 h-3.5 text-teal-400" />
              <span>Anti-Cancel Active</span>
            </div>
          )}
        </div>

        {/* Review Countdown Banner (if IN_REVIEW) */}
        {(normStatus === 'IN_REVIEW' || normStatus === '1') && timeLeft && (
          <div className="mb-4 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between text-xs text-amber-300">
            <span className="flex items-center gap-1.5 text-[11px]">
              <Clock className="w-3.5 h-3.5 animate-spin" />
              <span>Review Window:</span>
            </span>
            <span className="font-mono font-bold text-[11px]">{timeLeft}</span>
          </div>
        )}

        {/* Requirements */}
        <div className="mb-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Advertising Guidelines
          </span>
          <p className="text-xs text-slate-300 line-clamp-2 font-mono bg-slate-950/80 p-3 rounded-2xl border border-slate-850 leading-relaxed shadow-inner">
            {campaign.guidelines}
          </p>
        </div>

        {/* Deliverable URL */}
        {campaign.deliverable_url && (
          <div className="mb-4 p-3 bg-slate-950/80 rounded-2xl border border-slate-850">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Live Deliverable Web Proof
            </span>
            <a
              href={campaign.deliverable_url}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 break-all font-mono hover:underline"
            >
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{campaign.deliverable_url}</span>
            </a>
          </div>
        )}

        {/* Brand & Creator Metadata */}
        <div className="grid grid-cols-2 gap-2 text-[11px] font-mono mb-4">
          <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-850">
            <span className="text-slate-400 block text-[9px] uppercase font-sans font-bold">Brand Sponsor</span>
            <span className="truncate block text-slate-200 font-semibold">{truncateAddress(campaign.brand)}</span>
          </div>
          <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-850">
            <span className="text-slate-400 block text-[9px] uppercase font-sans font-bold">Assigned Creator</span>
            <span className="truncate block text-teal-300 font-semibold">{truncateAddress(campaign.creator)}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 pt-2 border-t border-slate-800/80">
        {/* Status: OPEN */}
        {(normStatus === 'OPEN' || normStatus === '0') && (
          <div className="flex items-center gap-2">
            {isBrand ? (
              <button
                disabled
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl bg-slate-900/60 border border-slate-800 text-slate-500 text-xs font-semibold cursor-not-allowed"
                title="You are the Brand Sponsor of this campaign and cannot submit to your own bounty"
              >
                <span>Awaiting Creator Submission</span>
              </button>
            ) : (
              <button
                onClick={() => onSelectSubmit(campaign.campaign_id)}
                disabled={isLoading}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/30 text-teal-300 text-xs font-bold transition-all hover:shadow-lg hover:shadow-teal-500/10"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Deliverable (Locks Escrow)</span>
              </button>
            )}

            {isBrand && (
              <button
                onClick={() => onCancel(campaign.campaign_id)}
                disabled={isLoading}
                className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold transition-all shrink-0"
                title="Cancel campaign and refund 100% locked GEN to Brand wallet (only permitted before submission)"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Cancel &amp; Refund</span>
              </button>
            )}
          </div>
        )}

        {/* Status: IN_REVIEW */}
        {(normStatus === 'IN_REVIEW' || normStatus === '1') && (
          <div className="space-y-2">
            <button
              onClick={() => onAdjudicate(campaign.campaign_id)}
              disabled={isLoading}
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-teal-500 hover:from-indigo-500 hover:to-teal-400 text-white text-xs font-bold shadow-lg shadow-indigo-500/25 transition-all active:scale-[0.99] disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>GenVM Crawling Web Evidence &amp; Auditing...</span>
                </>
              ) : (
                <>
                  <Scale className="w-3.5 h-3.5" />
                  <span>Trigger GenVM AI Court Consensus</span>
                </>
              )}
            </button>

            {isCreator ? (
              <button
                onClick={() => onClaimTimeout(campaign.campaign_id)}
                disabled={isLoading || !isTimeoutReached}
                className={`w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-[11px] font-semibold transition-all ${
                  isTimeoutReached
                    ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-lg shadow-amber-500/20 animate-pulse'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-300 opacity-60 cursor-not-allowed'
                }`}
                title={isTimeoutReached ? 'Review window expired: Creator is entitled to 100% bounty' : 'Review window still active'}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Claim Auto-Payout {isTimeoutReached ? '(Ready)' : '(Window Active)'}</span>
              </button>
            ) : (
              <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-400 text-[10px] text-center font-mono">
                🔒 Auto-Payout upon review window expiry is exclusive to designated Creator
              </div>
            )}
          </div>
        )}

        {/* Status: AWAITING_PAYOUT (24h Insolvent Appeal Cooling-Off Window) */}
        {normStatus === 'AWAITING_PAYOUT' && (
          <div className="space-y-2">
            <div className="p-3 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 text-xs text-cyan-200">
              <div className="flex items-center justify-between font-bold text-white mb-1">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Verdict: {campaign.verdict}</span>
                </span>
                <span className="font-mono text-[11px] text-cyan-300">
                  Score: {campaign.compliance_score}/100
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                {isCoolingFinished
                  ? '24h dispute cooling window has elapsed. Funds are ready for final settlement!'
                  : 'Cooling-off dispute window active. Escrow is preserved in contract until settlement.'}
              </p>
              {coolingTimeLeft && (
                <div className="mt-1.5 font-mono text-[10px] text-cyan-400 font-bold">
                  ⏱️ {coolingTimeLeft}
                </div>
              )}
            </div>

            <button
              onClick={() => onOpenAudit(campaign)}
              className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-700/80 text-white text-xs font-bold transition-all shadow-sm"
            >
              <Eye className="w-3.5 h-3.5 text-indigo-400" />
              <span>View On-Chain Audit Dossier</span>
            </button>

            {isCoolingFinished ? (
              <button
                onClick={() => onFinalizeSettlement && onFinalizeSettlement(campaign.campaign_id)}
                disabled={isLoading}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-bold shadow-lg shadow-emerald-500/25 transition-all active:scale-[0.99]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Disbursing Escrow Funds...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Finalize Settlement &amp; Disburse Payout</span>
                  </>
                )}
              </button>
            ) : (
              (isBrand || isCreator) ? (
                <button
                  onClick={() => onFileAppeal(campaign.campaign_id, appealBondWei)}
                  disabled={isLoading}
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-200 text-xs font-bold transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-purple-400" />
                  <span>File Dispute (Stake {appealBondGen} GEN Bond)</span>
                </button>
              ) : (
                <div className="p-1.5 rounded-xl bg-slate-950/40 border border-slate-900 text-slate-500 text-[10px] text-center font-mono">
                  Dispute window active: Only Brand or Creator can file dispute
                </div>
              )
            )}
          </div>
        )}

        {/* Status: RESOLVED (PAID or REFUNDED) */}
        {(normStatus === 'RESOLVED_PAID' || normStatus === '2' || normStatus === 'RESOLVED_REFUNDED' || normStatus === '3') && (
          <div className="space-y-2">
            <button
              onClick={() => onOpenAudit(campaign)}
              className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-700/80 text-white text-xs font-bold transition-all shadow-sm"
            >
              <Eye className="w-3.5 h-3.5 text-indigo-400" />
              <span>View On-Chain Audit Dossier</span>
            </button>
          </div>
        )}

        {/* Status: DISPUTED or IN_APPEAL */}
        {(normStatus === 'DISPUTED' || normStatus === 'IN_APPEAL' || normStatus === '5') && (
          <div className="space-y-2">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-[11px] text-center font-medium">
              In Appeal Court: {formatGen(campaign.appeal_bond)} GEN Dispute Bond Locked.
            </div>
            <button
              onClick={() => onAdjudicate(campaign.campaign_id)}
              disabled={isLoading}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-purple-600/25"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>GenVM Appeal Jury Deliberating...</span>
                </>
              ) : (
                <>
                  <Scale className="w-3.5 h-3.5" />
                  <span>Execute GenVM Appeal Consensus</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
