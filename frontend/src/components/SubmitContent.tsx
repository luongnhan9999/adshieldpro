import React, { useState, useMemo } from 'react';
import {
  Send,
  Loader2,
  Link2,
  ShieldCheck,
  AlertCircle,
  Video,
  Twitter,
  Globe,
  Lock,
  Sparkles
} from 'lucide-react';
import { fireConfetti } from './Toast';

interface SubmitContentProps {
  onSuccess: () => void;
  onSubmitContent: (campaignId: string, deliverableUrl: string) => Promise<void>;
  loading: boolean;
  userAddress: string | null;
  defaultCampaignId?: string;
}

export const SubmitContent: React.FC<SubmitContentProps> = ({
  onSuccess,
  onSubmitContent,
  loading,
  userAddress,
  defaultCampaignId = '',
}) => {
  const [campaignId, setCampaignId] = useState(defaultCampaignId);
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Auto-detect platform type from URL
  const detectedPlatform = useMemo(() => {
    const lower = url.toLowerCase();
    if (lower.includes('youtube.com') || lower.includes('youtu.be')) {
      return { name: 'YouTube Video/Shorts', icon: Video, color: 'text-red-400 bg-red-500/10 border-red-500/30' };
    }
    if (lower.includes('twitter.com') || lower.includes('x.com')) {
      return { name: 'X / Twitter Post', icon: Twitter, color: 'text-sky-400 bg-sky-500/10 border-sky-500/30' };
    }
    if (lower.includes('tiktok.com')) {
      return { name: 'TikTok Clip', icon: Video, color: 'text-pink-400 bg-pink-500/10 border-pink-500/30' };
    }
    if (url.startsWith('http')) {
      return { name: 'Live Web Page / Article', icon: Globe, color: 'text-teal-400 bg-teal-500/10 border-teal-500/30' };
    }
    return null;
  }, [url]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!userAddress) {
      setError('Please connect your MetaMask wallet first.');
      return;
    }

    if (!campaignId.trim()) {
      setError('Please provide a valid Campaign ID (e.g. ad-1).');
      return;
    }

    if (!url.trim().startsWith('http')) {
      setError('Please enter a valid live HTTP/HTTPS deliverable URL.');
      return;
    }

    try {
      await onSubmitContent(campaignId.trim(), url.trim());
      fireConfetti();
      setUrl('');
      onSuccess();
    } catch (err: any) {
      console.error('Failed to submit content:', err);
      setError(err?.message || 'Submission failed.');
    }
  };

  return (
    <div className="glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-teal-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6 pb-5 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-teal-600/20 text-teal-400 border border-teal-500/30">
                <Send className="w-5 h-5" />
              </span>
              <span>Creator Deliverable Submission Portal</span>
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20 text-[10px] font-mono font-bold">
              Creator Bounty Hub
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
            Submit your published marketing deliverable. Triggers GenVM on-chain non-deterministic web extraction and locks the escrow against brand cancellation.
          </p>
        </div>
      </div>

      {/* Anti-Cancel Lock Guarantee Explainer */}
      <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-teal-500/10 via-slate-900/60 to-indigo-500/10 border border-teal-500/20 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center shrink-0">
          <Lock className="w-5 h-5 text-teal-400" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
            <span>Guaranteed Anti-Cancel Escrow Protection</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[9px] font-mono">ACTIVE</span>
          </h4>
          <p className="text-[11px] text-slate-300 mt-0.5 leading-normal">
            Once submitted, the Brand cannot cancel or withdraw funds. If the brand does not approve or trigger subjective review within the timeout window, you can claim 100% of the bounty automatically.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Target Campaign ID
            </label>
            <input
              type="text"
              value={campaignId}
              onChange={(e) => setCampaignId(e.target.value)}
              placeholder="e.g. ad-1"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs font-mono font-bold text-slate-100 focus:outline-none focus:border-teal-500 transition-colors shadow-inner"
              required
            />
          </div>

          <div className="sm:col-span-2">
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Live Deliverable URL (Post / Video / Thread)
              </label>
              {detectedPlatform && (
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-mono font-semibold ${detectedPlatform.color}`}>
                  <detectedPlatform.icon className="w-3 h-3" />
                  <span>{detectedPlatform.name}</span>
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=... or https://x.com/.../status/..."
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors shadow-inner"
                required
              />
              <Link2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            <span>Escrow lock is non-custodial and verified on GenLayer Studionet</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white text-xs font-bold shadow-xl shadow-teal-500/25 transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Locking Escrow &amp; Submitting Deliverable...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Submit Deliverable &amp; Lock Bounty</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

