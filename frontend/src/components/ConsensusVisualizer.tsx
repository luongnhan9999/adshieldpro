import React, { useState, useEffect } from 'react';
import {
  X,
  Cpu,
  Globe,
  Scale,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCcw,
  Sparkles,
  Server,
  Zap
} from 'lucide-react';

interface ConsensusVisualizerProps {
  isOpen: boolean;
  onClose: () => void;
  campaignId?: string;
}

interface ValidatorNode {
  id: number;
  name: string;
  avatar: string;
  vote: 'COMPLIANT' | 'VIOLATED' | 'PENDING';
  confidence: number;
  complianceScore: number;
  latencyMs: number;
  status: 'idle' | 'rendering' | 'evaluating' | 'voted';
}

const INITIAL_NODES: ValidatorNode[] = [
  { id: 1, name: 'Validator Alpha (Leader)', avatar: '🟣', vote: 'PENDING', confidence: 0, complianceScore: 0, latencyMs: 142, status: 'idle' },
  { id: 2, name: 'Validator Beta', avatar: '🔵', vote: 'PENDING', confidence: 0, complianceScore: 0, latencyMs: 168, status: 'idle' },
  { id: 3, name: 'Validator Gamma', avatar: '🟢', vote: 'PENDING', confidence: 0, complianceScore: 0, latencyMs: 155, status: 'idle' },
  { id: 4, name: 'Validator Delta', avatar: '🟡', vote: 'PENDING', confidence: 0, complianceScore: 0, latencyMs: 189, status: 'idle' },
  { id: 5, name: 'Validator Epsilon', avatar: '🟠', vote: 'PENDING', confidence: 0, complianceScore: 0, latencyMs: 174, status: 'idle' },
];

export const ConsensusVisualizer: React.FC<ConsensusVisualizerProps> = ({ isOpen, onClose, campaignId = 'ad-1' }) => {
  if (!isOpen) return null;

  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [nodes, setNodes] = useState<ValidatorNode[]>(INITIAL_NODES);
  const [consensusResult, setConsensusResult] = useState<{
    quorumReached: boolean;
    finalVerdict: string;
    avgConfidence: number;
    avgCompliance: number;
  } | null>(null);

  const resetSimulation = () => {
    setIsRunning(false);
    setCurrentStep(0);
    setNodes(INITIAL_NODES);
    setConsensusResult(null);
  };

  const startSimulation = () => {
    resetSimulation();
    setIsRunning(true);
  };

  useEffect(() => {
    if (!isRunning) return;

    // Step 1: Non-det web render
    const t1 = setTimeout(() => {
      setCurrentStep(1);
      setNodes((prev) =>
        prev.map((n) => ({ ...n, status: 'rendering' }))
      );
    }, 800);

    // Step 2: Nodes evaluating LLM criteria
    const t2 = setTimeout(() => {
      setCurrentStep(2);
      setNodes((prev) =>
        prev.map((n) => ({ ...n, status: 'evaluating' }))
      );
    }, 2200);

    // Step 3: Progressive voting by nodes
    const t3 = setTimeout(() => {
      setCurrentStep(3);
      setNodes([
        { id: 1, name: 'Validator Alpha (Leader)', avatar: '🟣', vote: 'COMPLIANT', confidence: 96, complianceScore: 94, latencyMs: 142, status: 'voted' },
        { id: 2, name: 'Validator Beta', avatar: '🔵', vote: 'COMPLIANT', confidence: 94, complianceScore: 92, latencyMs: 168, status: 'voted' },
        { id: 3, name: 'Validator Gamma', avatar: '🟢', vote: 'COMPLIANT', confidence: 98, complianceScore: 95, latencyMs: 155, status: 'voted' },
        { id: 4, name: 'Validator Delta', avatar: '🟡', vote: 'COMPLIANT', confidence: 91, complianceScore: 89, latencyMs: 189, status: 'voted' },
        { id: 5, name: 'Validator Epsilon', avatar: '🟠', vote: 'COMPLIANT', confidence: 95, complianceScore: 93, latencyMs: 174, status: 'voted' },
      ]);
    }, 3800);

    // Step 4: Final Consensus Committed
    const t4 = setTimeout(() => {
      setCurrentStep(4);
      setConsensusResult({
        quorumReached: true,
        finalVerdict: 'COMPLIANT',
        avgConfidence: 95,
        avgCompliance: 93,
      });
      setIsRunning(false);
    }, 5000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [isRunning]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0b101d] border border-slate-700/80 rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white">
                  GenVM Subjective Consensus Visualizer
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 text-[10px] font-mono font-bold">
                  Studionet 61999
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Multi-Node LLM Agreement Protocol for Campaign [{campaignId}]
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

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Simulation Control Bar */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Consensus Telemetry Engine
              </span>
              <p className="text-xs text-slate-200 mt-0.5">
                Simulate how GenLayer validators run non-deterministic web fetches &amp; subjective voting.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={startSimulation}
                disabled={isRunning}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-purple-600/20 disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{isRunning ? 'Consensus In Progress...' : 'Start Consensus Audit'}</span>
              </button>

              <button
                onClick={resetSimulation}
                disabled={isRunning}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-white border border-slate-800 transition-colors"
                title="Reset Simulation"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Workflow Pipeline Steps */}
          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            <div className={`p-3 rounded-2xl border transition-all ${currentStep >= 1 ? 'bg-indigo-600/15 border-indigo-500/40 text-indigo-300' : 'bg-slate-950/50 border-slate-800 text-slate-500'}`}>
              <div className="font-bold mb-1 flex items-center justify-center gap-1">
                <Globe className="w-3.5 h-3.5" />
                <span>1. Web Render</span>
              </div>
              <span className="text-[10px] opacity-75 font-mono">gl.nondet.web</span>
            </div>

            <div className={`p-3 rounded-2xl border transition-all ${currentStep >= 2 ? 'bg-purple-600/15 border-purple-500/40 text-purple-300' : 'bg-slate-950/50 border-slate-800 text-slate-500'}`}>
              <div className="font-bold mb-1 flex items-center justify-center gap-1">
                <Cpu className="w-3.5 h-3.5" />
                <span>2. LLM Inspection</span>
              </div>
              <span className="text-[10px] opacity-75 font-mono">5x Parallel LLM</span>
            </div>

            <div className={`p-3 rounded-2xl border transition-all ${currentStep >= 3 ? 'bg-teal-600/15 border-teal-500/40 text-teal-300' : 'bg-slate-950/50 border-slate-800 text-slate-500'}`}>
              <div className="font-bold mb-1 flex items-center justify-center gap-1">
                <Scale className="w-3.5 h-3.5" />
                <span>3. Subjective Vote</span>
              </div>
              <span className="text-[10px] opacity-75 font-mono">Quorum &gt; 66%</span>
            </div>

            <div className={`p-3 rounded-2xl border transition-all ${currentStep >= 4 ? 'bg-emerald-600/15 border-emerald-500/40 text-emerald-300' : 'bg-slate-950/50 border-slate-800 text-slate-500'}`}>
              <div className="font-bold mb-1 flex items-center justify-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>4. Escrow Settled</span>
              </div>
              <span className="text-[10px] opacity-75 font-mono">Payout Committed</span>
            </div>
          </div>

          {/* Node Grid */}
          <div className="space-y-2.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Active Decentralized Validator Cluster (5 Nodes)
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {nodes.map((node) => {
                const isVoted = node.status === 'voted';
                const isEvaluating = node.status === 'evaluating';
                const isRendering = node.status === 'rendering';

                return (
                  <div
                    key={node.id}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      isVoted
                        ? 'bg-slate-950/90 border-emerald-500/30'
                        : isEvaluating
                        ? 'bg-purple-950/20 border-purple-500/40 animate-pulse'
                        : isRendering
                        ? 'bg-indigo-950/20 border-indigo-500/40'
                        : 'bg-slate-950/40 border-slate-850'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{node.avatar}</span>
                        <span className="text-xs font-bold text-white">{node.name}</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        {node.latencyMs}ms
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/80">
                      <span className="text-[10px] text-slate-400 uppercase font-mono">
                        {node.status.toUpperCase()}
                      </span>
                      {isVoted ? (
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold">
                            {node.vote} ({node.confidence}%)
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-[10px] font-mono">
                          {isEvaluating ? 'Running LLM Prompt...' : isRendering ? 'Parsing HTML...' : 'Standby'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Final Result Card */}
          {consensusResult && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-slate-950 to-indigo-500/10 border border-emerald-500/30 text-emerald-300 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span className="text-xs font-black tracking-wide uppercase text-white">
                    Consensus Reached (5/5 Validators Agreed)
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-xs font-bold border border-emerald-500/30">
                  {consensusResult.finalVerdict}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Deterministic state change successfully committed to GenVM. Average Compliance: <strong>{consensusResult.avgCompliance}%</strong>, Confidence: <strong>{consensusResult.avgConfidence}%</strong>. Escrow payout unlocked for creator!
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Zap className="w-3.5 h-3.5 text-purple-400" />
            <span>GenLayer Virtual Machine Consensus Architecture</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all"
          >
            Close Visualizer
          </button>
        </div>
      </div>
    </div>
  );
};
