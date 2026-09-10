import React from 'react';
import { Sparkles, Check, Hash, Link as LinkIcon, Clock, Shield } from 'lucide-react';

interface GuidelinesOptimizerProps {
  onAppendRule: (rule: string) => void;
}

export const GuidelinesOptimizer: React.FC<GuidelinesOptimizerProps> = ({ onAppendRule }) => {
  const OPTIMIZER_CHIPS = [
    {
      label: '+ Mandatory Backlink',
      rule: 'Must include live backlink to https://adshield.pro in the primary deliverable description.',
      icon: LinkIcon,
    },
    {
      label: '+ Required Hashtags',
      rule: 'Must feature hashtags #AdShield and #GenLayer in the post.',
      icon: Hash,
    },
    {
      label: '+ Segment Duration (60s+)',
      rule: 'Must contain a dedicated sponsor segment lasting at least 60 seconds.',
      icon: Clock,
    },
    {
      label: '+ Clear Product Talking Points',
      rule: 'Must explain GenVM non-deterministic web scraping and Anti-Cancel escrow protection.',
      icon: Shield,
    },
  ];

  return (
    <div className="mt-2.5 p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
      <div className="flex items-center gap-1.5 mb-2 text-indigo-300 text-xs font-bold">
        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
        <span>GenVM LLM Guidelines Assistant (1-Click Optimizers):</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {OPTIMIZER_CHIPS.map((chip, idx) => {
          const Icon = chip.icon;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => onAppendRule(chip.rule)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 text-[11px] font-medium transition-colors"
            >
              <Icon className="w-3 h-3 text-indigo-400" />
              <span>{chip.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
