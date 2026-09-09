import React, { useState } from 'react';
import { PlusCircle, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { Platform } from '../types';

interface CreateCampaignProps {
  onSuccess: () => void;
  onCreateCampaign: (guidelines: string, platform: Platform, timeoutSeconds: number, bountyGen: string) => Promise<void>;
  loading: boolean;
  userAddress: string | null;
}

export const CreateCampaign: React.FC<CreateCampaignProps> = ({
  onSuccess,
  onCreateCampaign,
  loading,
  userAddress,
}) => {
  const [guidelines, setGuidelines] = useState('');
  const [platform, setPlatform] = useState<Platform>('YOUTUBE');
  const [bountyGen, setBountyGen] = useState('1.0');
  const [timeoutHours, setTimeoutHours] = useState('48');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!userAddress) {
      setError('Please connect your MetaMask wallet first.');
      return;
    }

    if (!guidelines.trim()) {
      setError('Advertising guidelines cannot be empty.');
      return;
    }

    const bountyNum = parseFloat(bountyGen);
    if (isNaN(bountyNum) || bountyNum <= 0) {
      setError('Escrow budget must be greater than 0 GEN.');
      return;
    }

    const hours = parseInt(timeoutHours, 10);
    const timeoutSeconds = isNaN(hours) || hours <= 0 ? 86400 : hours * 3600;

    try {
      await onCreateCampaign(guidelines.trim(), platform, timeoutSeconds, bountyGen);
      setGuidelines('');
      setBountyGen('1.0');
      onSuccess();
    } catch (err: any) {
      console.error('Failed to create campaign:', err);
      setError(err?.message || 'Transaction rejected or failed.');
    }
  };

  const handleFillExample = () => {
    setGuidelines('Review AdShield Pro with affiliate link https://adshield.pro and include #AdShield and #GenLayer in video description.');
    setPlatform('YOUTUBE');
    setBountyGen('1.5');
    setTimeoutHours('48');
  };

  return (
    <div className="bg-[#101626]/95 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-indigo-400" />
            <span>Create Marketing Escrow Campaign</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Deposit marketing funds into GenLayer smart escrow. Verified autonomously by AI consensus.
          </p>
        </div>
        <button
          type="button"
          onClick={handleFillExample}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-medium transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Fill Example</span>
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Platform */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Platform
            </label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value as Platform)}
              className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
            >
              <option value="YOUTUBE">YouTube (Video / Shorts)</option>
              <option value="X_TWITTER">X / Twitter (Post / Thread)</option>
              <option value="TIKTOK">TikTok (Video)</option>
              <option value="BLOG">Blog / Article</option>
            </select>
          </div>

          {/* Bounty amount */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Escrow Bounty (GEN)
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={bountyGen}
              onChange={(e) => setBountyGen(e.target.value)}
              placeholder="e.g. 1.0"
              className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-sm font-mono text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
              required
            />
          </div>

          {/* Timeout */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Review Window (Hours)
            </label>
            <input
              type="number"
              min="1"
              value={timeoutHours}
              onChange={(e) => setTimeoutHours(e.target.value)}
              placeholder="e.g. 48"
              className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-sm font-mono text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
              required
            />
          </div>
        </div>

        {/* Guidelines */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
            Advertising Guidelines & Compliance Criteria
          </label>
          <textarea
            rows={3}
            value={guidelines}
            onChange={(e) => setGuidelines(e.target.value)}
            placeholder="Specify required hashtags (#AdShield), mandatory links (https://...), key talking points, or promotional mentions that the GenLayer AI Court will inspect on-chain."
            className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
            required
          />
        </div>

        {/* Submit */}
        <div className="pt-1 flex items-center justify-end">
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-teal-500 hover:from-indigo-500 hover:to-teal-400 text-white text-sm font-semibold shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Locking Escrow on Studionet...</span>
              </>
            ) : (
              <>
                <PlusCircle className="w-4 h-4" />
                <span>Deploy Campaign & Lock Escrow</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
