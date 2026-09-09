import React, { useState } from 'react';
import { Send, Loader2, Link2, ShieldCheck, AlertCircle } from 'lucide-react';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!userAddress) {
      setError('Please connect your MetaMask wallet first.');
      return;
    }

    if (!campaignId.trim()) {
      setError('Please provide a valid Campaign ID (e.g., ad-1).');
      return;
    }

    if (!url.trim().startsWith('http')) {
      setError('Please enter a valid live HTTP/HTTPS deliverable URL.');
      return;
    }

    try {
      await onSubmitContent(campaignId.trim(), url.trim());
      setUrl('');
      onSuccess();
    } catch (err: any) {
      console.error('Failed to submit content:', err);
      setError(err?.message || 'Submission failed.');
    }
  };

  return (
    <div className="bg-[#101626]/95 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl">
      <div className="mb-5">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Send className="w-5 h-5 text-teal-400" />
          <span>Creator Content Submission</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Submit your live published work. Locks the escrow with Anti-Cancel Protection and initiates AI subjective review.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Campaign ID
            </label>
            <input
              type="text"
              value={campaignId}
              onChange={(e) => setCampaignId(e.target.value)}
              placeholder="e.g. ad-1"
              className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-sm font-mono text-slate-100 focus:outline-none focus:border-teal-500 transition-colors"
              required
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Deliverable URL (Live Post / Video / Thread)
            </label>
            <div className="relative">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=... or https://x.com/.../status/..."
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
                required
              />
              <Link2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Anti-Cancel Lock immediately activates upon submission</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white text-sm font-semibold shadow-lg shadow-teal-500/20 transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Submitting Deliverable on-chain...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Submit Deliverable & Lock Escrow</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
