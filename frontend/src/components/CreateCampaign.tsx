import React, { useState } from 'react';
import {
  PlusCircle,
  Loader2,
  Sparkles,
  AlertCircle,
  Video,
  Twitter,
  FileText,
  Clock,
  Shield,
  Coins,
  Check
} from 'lucide-react';
import { Platform } from '../types';
import { fireConfetti } from './Toast';
import { GuidelinesOptimizer } from './GuidelinesOptimizer';

interface CreateCampaignProps {
  onSuccess: () => void;
  onCreateCampaign: (guidelines: string, platform: Platform, timeoutSeconds: number, bountyGen: string) => Promise<void>;
  loading: boolean;
  userAddress: string | null;
}

interface CampaignPreset {
  id: string;
  name: string;
  platform: Platform;
  bounty: string;
  hours: string;
  guidelines: string;
  icon: any;
}

const PRESETS: CampaignPreset[] = [
  {
    id: 'yt',
    name: 'YouTube Dedicated Sponsor',
    platform: 'YOUTUBE',
    bounty: '1.5',
    hours: '48',
    guidelines: 'Include a 60-90s dedicated sponsor segment explaining AdShield Pro. Put official link https://adshield.pro in top 3 lines of video description and include #AdShield #GenLayer.',
    icon: Video,
  },
  {
    id: 'x',
    name: 'X / Twitter Viral Thread',
    platform: 'X_TWITTER',
    bounty: '0.8',
    hours: '24',
    guidelines: 'Post an engaging 3+ tweet thread explaining decentralized marketing escrows. Tag @GenLayer and link to https://adshield.pro with hashtag #Web3Marketing.',
    icon: Twitter,
  },
  {
    id: 'tiktok',
    name: 'TikTok Viral Showcase',
    platform: 'TIKTOK',
    bounty: '1.2',
    hours: '36',
    guidelines: 'Create a vertical 30-60s video highlighting AdShield Pro anti-cancel guarantee for creators. Link in bio or pinned comment, tag #AdShieldPro.',
    icon: Video,
  },
  {
    id: 'blog',
    name: 'Technical Blog / Review',
    platform: 'BLOG',
    bounty: '2.0',
    hours: '72',
    guidelines: 'Publish an in-depth review covering GenVM subjective consensus, live web rendering, and creator protection. Include backlink to https://adshield.pro.',
    icon: FileText,
  },
];

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
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  const applyPreset = (preset: CampaignPreset) => {
    setSelectedPreset(preset.id);
    setPlatform(preset.platform);
    setBountyGen(preset.bounty);
    setTimeoutHours(preset.hours);
    setGuidelines(preset.guidelines);
    setError(null);
  };

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
      fireConfetti();
      setGuidelines('');
      setBountyGen('1.0');
      setSelectedPreset(null);
      onSuccess();
    } catch (err: any) {
      console.error('Failed to create campaign:', err);
      setError(err?.message || 'Transaction rejected or failed.');
    }
  };

  const bountyNum = parseFloat(bountyGen) || 0;
  const appealBondGen = (bountyNum * 0.2).toFixed(3);

  return (
    <div className="glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6 pb-5 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                <PlusCircle className="w-5 h-5" />
              </span>
              <span>Deploy Autonomous Marketing Escrow</span>
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold">
              Brand Sponsor Portal
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
            Deposit GEN into GenVM non-custodial smart escrow. Subjective consensus validators autonomously inspect deliverables against your criteria.
          </p>
        </div>
      </div>

      {/* 1-Click Campaign Presets */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Fast Setup: 1-Click Campaign Presets</span>
          </span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          {PRESETS.map((p) => {
            const IconComponent = p.icon;
            const isSelected = selectedPreset === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => applyPreset(p)}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  isSelected
                    ? 'bg-indigo-600/20 border-indigo-500/60 shadow-lg shadow-indigo-600/20 text-white'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="p-1.5 rounded-lg bg-slate-800 text-indigo-300">
                    <IconComponent className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-mono font-bold text-indigo-300">
                    {p.bounty} GEN
                  </span>
                </div>
                <div className="text-xs font-bold truncate">{p.name}</div>
                <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-500" />
                  <span>{p.hours}h Review Window</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="mb-5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Platform */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Marketing Platform
            </label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value as Platform)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs font-medium text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors shadow-inner"
            >
              <option value="YOUTUBE">YouTube (Video / Shorts)</option>
              <option value="X_TWITTER">X / Twitter (Post / Thread)</option>
              <option value="TIKTOK">TikTok (Video)</option>
              <option value="BLOG">Blog / Technical Article</option>
            </select>
          </div>

          {/* Bounty amount */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider flex items-center justify-between">
              <span>Escrow Bounty (GEN)</span>
              <span className="text-[10px] font-mono text-indigo-400 font-bold">Locked in Contract</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={bountyGen}
                onChange={(e) => setBountyGen(e.target.value)}
                placeholder="e.g. 1.0"
                className="w-full pl-3.5 pr-14 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs font-mono font-bold text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors shadow-inner"
                required
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-400">
                GEN
              </span>
            </div>
          </div>

          {/* Timeout */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider flex items-center justify-between">
              <span>Review Window (Hours)</span>
              <span className="text-[10px] text-teal-400 font-bold">Auto-Payout</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                value={timeoutHours}
                onChange={(e) => setTimeoutHours(e.target.value)}
                placeholder="e.g. 48"
                className="w-full pl-3.5 pr-16 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs font-mono font-bold text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors shadow-inner"
                required
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400">
                Hours
              </span>
            </div>
          </div>
        </div>

        {/* Guidelines */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Advertising Guidelines & Compliance Rules
            </label>
            <span className="text-[11px] text-slate-400 font-mono">
              Evaluated by GenVM LLM Consensus
            </span>
          </div>
          <textarea
            rows={3}
            value={guidelines}
            onChange={(e) => setGuidelines(e.target.value)}
            placeholder="Specify required hashtags (e.g. #AdShield), mandatory links (https://...), key talking points, or promotional mentions that the GenLayer AI Court will inspect on-chain."
            className="w-full px-4 py-3 bg-slate-950 border border-slate-700/80 rounded-2xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors resize-none shadow-inner leading-relaxed"
            required
          />
          <GuidelinesOptimizer
            onAppendRule={(rule) => {
              setGuidelines((prev) => (prev ? `${prev.trim()} ${rule}` : rule));
            }}
          />
        </div>

        {/* Financial Escrow Breakdown Pill */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Coins className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Immediate Deposit</span>
              <span className="font-mono font-bold text-white text-xs">{bountyNum.toFixed(3)} GEN</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Appeal Stake Bond (20%)</span>
              <span className="font-mono font-bold text-teal-300 text-xs">{appealBondGen} GEN</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Creator Safety Window</span>
              <span className="font-mono font-bold text-purple-300 text-xs">{timeoutHours || '48'} Hours Auto-Payout</span>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>Anti-Cancel Lock prevents brand rug-pull once creator submits link</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-teal-500 hover:from-indigo-500 hover:to-teal-400 text-white text-xs font-bold shadow-xl shadow-indigo-600/25 transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Deploying Escrow on Studionet...</span>
              </>
            ) : (
              <>
                <PlusCircle className="w-4 h-4" />
                <span>Deploy Campaign &amp; Lock {bountyNum.toFixed(2)} GEN</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

