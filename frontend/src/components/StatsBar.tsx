import React from 'react';
import { Lock, FileCheck2, Award, Cpu } from 'lucide-react';
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
      <div className="bg-[#101626]/90 border border-slate-800 rounded-2xl p-5 hover:border-slate-700/80 transition-all shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Total Escrow Locked
          </span>
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Lock className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold font-mono tracking-tight text-white">
            {loading ? '...' : `${formatGen(stats.total_escrow_locked)} GEN`}
          </div>
          <p className="text-[11px] text-indigo-300/80 mt-1">
            Protected in non-custodial smart contracts
          </p>
        </div>
      </div>

      {/* Stat 2: Total Campaigns */}
      <div className="bg-[#101626]/90 border border-slate-800 rounded-2xl p-5 hover:border-slate-700/80 transition-all shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Total Campaigns
          </span>
          <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
            <FileCheck2 className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold font-mono tracking-tight text-white">
            {loading ? '...' : stats.total_campaigns}
          </div>
          <p className="text-[11px] text-teal-300/80 mt-1">
            Across YouTube, X/Twitter, TikTok & Blogs
          </p>
        </div>
      </div>

      {/* Stat 3: Settled Campaigns */}
      <div className="bg-[#101626]/90 border border-slate-800 rounded-2xl p-5 hover:border-slate-700/80 transition-all shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Settled Campaigns
          </span>
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Award className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold font-mono tracking-tight text-white">
            {loading ? '...' : stats.total_campaigns_settled}
          </div>
          <p className="text-[11px] text-emerald-300/80 mt-1">
            Autonomous payouts & verified refunds
          </p>
        </div>
      </div>

      {/* Stat 4: Consensus Engine */}
      <div className="bg-[#101626]/90 border border-slate-800 rounded-2xl p-5 hover:border-slate-700/80 transition-all shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Consensus Engine
          </span>
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Cpu className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold tracking-tight text-white">
            GenVM + LLM
          </div>
          <p className="text-[11px] text-purple-300/80 mt-1">
            Decentralized Subjective Consensus Court
          </p>
        </div>
      </div>
    </div>
  );
};
