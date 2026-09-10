import React from 'react';
import { Lock, FileCheck2, Award, Cpu, TrendingUp, ShieldCheck, Zap } from 'lucide-react';
import { ProtocolStats } from '../types';
import { formatGen } from '../utils/formatters';

interface StatsBarProps {
  stats: ProtocolStats;
  loading: boolean;
}

export const StatsBar: React.FC<StatsBarProps> = ({ stats, loading }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* Stat 1: Total Escrow Locked */}
      <div className="glass-panel-interactive rounded-3xl p-5 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 rounded-full blur-2xl group-hover:bg-indigo-600/20 transition-all pointer-events-none" />
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-indigo-400" />
            <span>Escrow Locked</span>
          </span>
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 text-[10px] font-mono border border-indigo-500/20">
            <TrendingUp className="w-3 h-3 text-indigo-400" />
            <span>Non-Custodial</span>
          </span>
        </div>
        <div className="mt-4">
          <div className="text-3xl font-extrabold font-mono tracking-tight text-white flex items-baseline gap-1.5">
            <span>{loading ? '...' : formatGen(stats.total_escrow_locked)}</span>
            <span className="text-sm font-sans font-bold text-indigo-400">GEN</span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            <p className="text-[11px] text-slate-400">
              Autonomous smart lock on GenVM
            </p>
          </div>
        </div>
      </div>

      {/* Stat 2: Total Campaigns */}
      <div className="glass-panel-interactive rounded-3xl p-5 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-teal-600/10 rounded-full blur-2xl group-hover:bg-teal-600/20 transition-all pointer-events-none" />
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <FileCheck2 className="w-3.5 h-3.5 text-teal-400" />
            <span>Total Escrows</span>
          </span>
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-300 text-[10px] font-mono border border-teal-500/20">
            <span>Live Web3</span>
          </span>
        </div>
        <div className="mt-4">
          <div className="text-3xl font-extrabold font-mono tracking-tight text-white">
            {loading ? '...' : stats.total_campaigns}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-2 h-2 rounded-full bg-teal-400" />
            <p className="text-[11px] text-slate-400">
              YouTube, X/Twitter, TikTok & Blogs
            </p>
          </div>
        </div>
      </div>

      {/* Stat 3: Settled Campaigns */}
      <div className="glass-panel-interactive rounded-3xl p-5 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-600/10 rounded-full blur-2xl group-hover:bg-emerald-600/20 transition-all pointer-events-none" />
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-emerald-400" />
            <span>Settled Campaigns</span>
          </span>
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 text-[10px] font-mono border border-emerald-500/20">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>Anti-Cancel</span>
          </span>
        </div>
        <div className="mt-4">
          <div className="text-3xl font-extrabold font-mono tracking-tight text-white">
            {loading ? '...' : stats.total_campaigns_settled}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <p className="text-[11px] text-slate-400">
              Instant creator payouts & fair refunds
            </p>
          </div>
        </div>
      </div>

      {/* Stat 4: Consensus Engine */}
      <div className="glass-panel-interactive rounded-3xl p-5 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/10 rounded-full blur-2xl group-hover:bg-purple-600/20 transition-all pointer-events-none" />
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-purple-400" />
            <span>Consensus Engine</span>
          </span>
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 text-[10px] font-mono border border-purple-500/20">
            <Zap className="w-3 h-3 text-purple-400" />
            <span>LLM Court</span>
          </span>
        </div>
        <div className="mt-4">
          <div className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <span>GenVM Non-Det</span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
            <p className="text-[11px] text-slate-400">
              Live web render &amp; subjective voting
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
