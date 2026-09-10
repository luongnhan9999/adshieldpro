import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { ZeroBalanceBanner } from './components/ZeroBalanceBanner';
import { StatsBar } from './components/StatsBar';
import { CreateCampaign } from './components/CreateCampaign';
import { SubmitContent } from './components/SubmitContent';
import { CampaignCard } from './components/CampaignCard';
import { AuditModal } from './components/AuditModal';
import { BilateralCourtModal } from './components/BilateralCourtModal';
import { ToastContainer, ToastMessage, fireConfetti } from './components/Toast';
import { Campaign, CampaignStatus, Platform, ProtocolStats } from './types';
import {
  ensureStudionetNetwork,
  fetchStudionetBalance,
  getStoredContractAddress,
  readContractStudionet,
  sendContractTransaction,
  setStoredContractAddress,
  STUDIONET_CHAIN_ID,
} from './config/genlayer';
import { formatGen, toWei } from './utils/formatters';
import {
  Layers,
  Sparkles,
  RefreshCw,
  AlertCircle,
  Search,
  Filter,
  Shield,
  Scale,
  Send,
  PlusCircle,
  Video,
  Twitter,
  FileText,
  SlidersHorizontal,
  Flame,
  Clock,
  Cpu
} from 'lucide-react';

export const App: React.FC = () => {
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>('0');
  const [chainId, setChainId] = useState<number | null>(null);
  const [contractAddress, setContractAddress] = useState<string>(getStoredContractAddress());

  const [stats, setStats] = useState<ProtocolStats>({
    total_campaigns: 0,
    total_escrow_locked: '0',
    total_campaigns_settled: 0,
  });

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Filters & Portal Views
  const [activePortal, setActivePortal] = useState<'ALL' | 'BRAND' | 'CREATOR' | 'COURT'>('ALL');
  const [selectedStatusTab, setSelectedStatusTab] = useState<'ALL' | 'OPEN' | 'IN_REVIEW' | 'AWAITING_PAYOUT' | 'RESOLVED' | 'DISPUTED'>('ALL');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'NEWEST' | 'BOUNTY_HIGH' | 'BOUNTY_LOW'>('NEWEST');

  const [auditCampaign, setAuditCampaign] = useState<Campaign | null>(null);
  const [activeTabForm, setActiveTabForm] = useState<'create' | 'submit'>('create');
  const [targetSubmitId, setTargetSubmitId] = useState<string>('');
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Bilateral Court Charter Modal
  const [showBilateralCharter, setShowBilateralCharter] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error' | 'warning' | 'info', title: string, description?: string) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, type, title, description }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 6000);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Fetch balance for user (authoritative Studionet RPC + MetaMask fallback)
  const fetchBalance = useCallback(async (addr: string) => {
    if (!addr) return;
    try {
      // 1. Direct fetch from Studionet RPC to guarantee 100% accurate real-time balance
      const studioWei = await fetchStudionetBalance(addr);
      if (studioWei > 0n) {
        setBalance(formatGen(studioWei));
        return;
      }

      // 2. Fallback to MetaMask provider
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        const balanceHex = await (window as any).ethereum.request({
          method: 'eth_getBalance',
          params: [addr, 'latest'],
        });
        const balGen = formatGen(BigInt(balanceHex || '0'));
        setBalance(balGen);
      }
    } catch (e) {
      console.error('Failed to fetch balance:', e);
    }
  }, []);

  // Switch network to Studionet
  const handleSwitchNetwork = async () => {
    try {
      await ensureStudionetNetwork();
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        const currentChainId = await (window as any).ethereum.request({ method: 'eth_chainId' });
        setChainId(parseInt(currentChainId, 16));
        if (userAddress) await fetchBalance(userAddress);
        addToast('success', 'Network Synchronized', 'Connected to GenLayer Studionet (Chain ID 61999)');
      }
    } catch (err: any) {
      console.error('Network switch failed:', err);
      addToast('error', 'Network Switch Failed', err?.message || 'Please switch network manually in MetaMask.');
    }
  };

  // Connect MetaMask
  const handleConnectWallet = async () => {
    if (typeof window === 'undefined' || !(window as any).ethereum) {
      addToast('error', 'MetaMask Required', 'Please install MetaMask to interact with AdShield Pro.');
      return;
    }

    try {
      setGlobalError(null);
      try {
        await ensureStudionetNetwork();
      } catch (netErr) {
        console.warn('Network prompt deferred:', netErr);
      }

      const accounts = await (window as any).ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts && accounts[0]) {
        setUserAddress(accounts[0]);
        await fetchBalance(accounts[0]);
        addToast('success', 'Wallet Connected', `Connected as ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`);
      }

      const currentChainId = await (window as any).ethereum.request({
        method: 'eth_chainId',
      });
      setChainId(parseInt(currentChainId, 16));
    } catch (err: any) {
      console.error('Wallet connection error:', err);
      setGlobalError(err?.message || 'Failed to connect wallet.');
      addToast('error', 'Connection Failed', err?.message || 'User rejected request.');
    }
  };

  // Listen to account/chain changes
  useEffect(() => {
    if (typeof window === 'undefined' || !(window as any).ethereum) return;

    const ethereum = (window as any).ethereum;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length > 0) {
        setUserAddress(accounts[0]);
        fetchBalance(accounts[0]);
      } else {
        setUserAddress(null);
        setBalance('0');
      }
    };

    const handleChainChanged = (newChainId: string) => {
      setChainId(parseInt(newChainId, 16));
      if (userAddress) fetchBalance(userAddress);
    };

    ethereum.on('accountsChanged', handleAccountsChanged);
    ethereum.on('chainChanged', handleChainChanged);

    // Initial check
    ethereum.request({ method: 'eth_accounts' }).then((accs: string[]) => {
      if (accs.length > 0) {
        setUserAddress(accs[0]);
        fetchBalance(accs[0]);
      }
    });

    ethereum.request({ method: 'eth_chainId' }).then((cid: string) => {
      setChainId(parseInt(cid, 16));
    });

    return () => {
      ethereum.removeListener('accountsChanged', handleAccountsChanged);
      ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, [fetchBalance, userAddress]);

  // Load contract data from Studionet
  const fetchContractData = useCallback(async () => {
    if (!contractAddress || contractAddress === '0x0000000000000000000000000000000000000000') {
      return;
    }

    setLoading(true);
    setGlobalError(null);
    try {
      // 1. Fetch Stats via native GenLayer gen_call
      try {
        const rawStats = await readContractStudionet({
          address: contractAddress,
          functionName: 'get_stats',
          args: [],
          from: userAddress || undefined,
        });
        if (rawStats) {
          const parsed = typeof rawStats === 'string' ? JSON.parse(rawStats) : rawStats;
          setStats({
            total_campaigns: Number(parsed.total_campaigns || 0),
            total_escrow_locked: String(parsed.total_escrow_locked || '0'),
            total_campaigns_settled: Number(parsed.total_campaigns_settled || 0),
          });
        }
      } catch (e) {
        console.warn('Could not fetch stats via readContractStudionet:', e);
      }

      // 2. Fetch Campaigns via Authoritative Global Public View get_all_campaigns
      try {
        let fetchedCampaigns: Campaign[] = [];
        try {
          const rawAll = await readContractStudionet({
            address: contractAddress,
            functionName: 'get_all_campaigns',
            args: [],
            from: userAddress || undefined,
          });
          if (rawAll) {
            fetchedCampaigns = typeof rawAll === 'string' ? JSON.parse(rawAll) : rawAll;
          }
        } catch (allErr) {
          console.warn('get_all_campaigns not available, falling back to index iteration:', allErr);
          const rawCount = await readContractStudionet({
            address: contractAddress,
            functionName: 'get_campaign_count',
            args: [],
            from: userAddress || undefined,
          });

          const count = Number(rawCount || 0);
          for (let i = 0; i < count; i++) {
            try {
              const cid = await readContractStudionet({
                address: contractAddress,
                functionName: 'get_campaign_id_by_index',
                args: [i],
                from: userAddress || undefined,
              });

              if (cid) {
                const campRaw = await readContractStudionet({
                  address: contractAddress,
                  functionName: 'get_campaign',
                  args: [cid as string],
                  from: userAddress || undefined,
                });
                if (campRaw) {
                  fetchedCampaigns.push(typeof campRaw === 'string' ? JSON.parse(campRaw) : campRaw);
                }
              }
            } catch (itemErr) {
              console.warn(`Failed reading campaign index ${i}:`, itemErr);
            }
          }
        }

        if (Array.isArray(fetchedCampaigns)) {
          fetchedCampaigns.reverse();
          setCampaigns(fetchedCampaigns);
        }
      } catch (countErr) {
        console.warn('Could not read campaign list:', countErr);
      }
    } catch (err: any) {
      console.error('Contract read failed:', err);
    } finally {
      setLoading(false);
    }
  }, [contractAddress, userAddress]);

  useEffect(() => {
    fetchContractData();
  }, [fetchContractData]);

  // Create Campaign
  const handleCreateCampaign = async (
    guidelines: string,
    platform: Platform,
    timeoutSeconds: number,
    bountyGen: string
  ) => {
    if (!contractAddress || contractAddress === '0x0000000000000000000000000000000000000000') {
      throw new Error('Please configure a valid deployed contract address first (click Settings in top bar).');
    }
    if (!userAddress) {
      throw new Error('Please connect your MetaMask wallet first.');
    }

    const valueWei = toWei(bountyGen);
    setActionLoading('create');

    try {
      await ensureStudionetNetwork();

      await sendContractTransaction({
        address: contractAddress,
        functionName: 'create_campaign',
        args: [guidelines, platform, timeoutSeconds],
        from: userAddress,
        value: valueWei,
      });

      addToast('success', 'Escrow Deployed & Locked!', `${bountyGen} GEN deposited on-chain.`);
      if (userAddress) fetchBalance(userAddress);
      await fetchContractData();
    } catch (err: any) {
      addToast('error', 'Deployment Failed', err?.message || 'Transaction error.');
      throw err;
    } finally {
      setActionLoading(null);
    }
  };

  // Submit Content
  const handleSubmitContent = async (campaignId: string, deliverableUrl: string) => {
    if (!contractAddress || contractAddress === '0x0000000000000000000000000000000000000000') {
      throw new Error('Contract address not configured.');
    }
    if (!userAddress) {
      throw new Error('Please connect your MetaMask wallet first.');
    }

    setActionLoading(campaignId);
    try {
      await ensureStudionetNetwork();
      await sendContractTransaction({
        address: contractAddress,
        functionName: 'submit_content',
        args: [campaignId, deliverableUrl],
        from: userAddress,
      });
      addToast('success', 'Deliverable Submitted!', `Anti-Cancel Lock activated for ${campaignId}. Escrow secured.`);
      await fetchContractData();
    } catch (err: any) {
      addToast('error', 'Submission Failed', err?.message || 'Transaction error.');
      throw err;
    } finally {
      setActionLoading(null);
    }
  };

  // Adjudicate
  const handleAdjudicate = async (campaignId: string) => {
    if (!contractAddress) return;
    if (!userAddress) {
      addToast('error', 'Wallet Required', 'Please connect your wallet.');
      return;
    }

    setActionLoading(campaignId);
    try {
      await ensureStudionetNetwork();
      addToast('info', 'AI Court Initiated', `GenVM consensus evaluation running for ${campaignId}...`);
      await sendContractTransaction({
        address: contractAddress,
        functionName: 'adjudicate',
        args: [campaignId],
        from: userAddress,
      });
      fireConfetti();
      addToast('success', 'Adjudication Complete', `Consensus verdict rendered for ${campaignId}.`);
      if (userAddress) fetchBalance(userAddress);
      await fetchContractData();
    } catch (e: any) {
      addToast('error', 'Adjudication Failed', e?.message || String(e));
    } finally {
      setActionLoading(null);
    }
  };

  // Claim Timeout
  const handleClaimTimeout = async (campaignId: string) => {
    if (!contractAddress) return;
    if (!userAddress) {
      addToast('error', 'Wallet Required', 'Please connect your wallet.');
      return;
    }

    setActionLoading(campaignId);
    try {
      await ensureStudionetNetwork();
      await sendContractTransaction({
        address: contractAddress,
        functionName: 'claim_timeout_payout',
        args: [campaignId],
        from: userAddress,
      });
      fireConfetti();
      addToast('success', 'Auto-Payout Claimed!', `Bounty transferred directly to creator wallet.`);
      if (userAddress) fetchBalance(userAddress);
      await fetchContractData();
    } catch (e: any) {
      addToast('error', 'Claim Failed', e?.message || String(e));
    } finally {
      setActionLoading(null);
    }
  };

  // File Appeal
  const handleFileAppeal = async (campaignId: string, minBondWei: string) => {
    if (!contractAddress) return;
    if (!userAddress) {
      addToast('error', 'Wallet Required', 'Please connect your wallet.');
      return;
    }

    setActionLoading(campaignId);
    try {
      await ensureStudionetNetwork();
      await sendContractTransaction({
        address: contractAddress,
        functionName: 'file_dispute_appeal',
        args: [campaignId],
        from: userAddress,
        value: BigInt(minBondWei),
      });
      addToast('warning', 'Appeal Staked!', `20% bond locked. Multi-validator consensus re-review initiated.`);
      if (userAddress) fetchBalance(userAddress);
      await fetchContractData();
    } catch (e: any) {
      addToast('error', 'Appeal Failed', e?.message || String(e));
    } finally {
      setActionLoading(null);
    }
  };

  // Finalize Settlement (after 24h cooling-off window)
  const handleFinalizeSettlement = async (campaignId: string) => {
    if (!contractAddress) return;
    if (!userAddress) {
      addToast('error', 'Wallet Required', 'Please connect your wallet.');
      return;
    }

    setActionLoading(campaignId);
    try {
      await ensureStudionetNetwork();
      await sendContractTransaction({
        address: contractAddress,
        functionName: 'finalize_settlement',
        args: [campaignId],
        from: userAddress,
      });
      fireConfetti();
      addToast('success', 'Settlement Finalized!', `Escrow released and transferred according to court consensus.`);
      if (userAddress) fetchBalance(userAddress);
      await fetchContractData();
    } catch (e: any) {
      addToast('error', 'Finalization Failed', e?.message || String(e));
    } finally {
      setActionLoading(null);
    }
  };

  // Cancel Campaign
  const handleCancel = async (campaignId: string) => {
    if (!contractAddress) return;
    if (!userAddress) {
      addToast('error', 'Wallet Required', 'Please connect your wallet.');
      return;
    }

    if (!confirm('Are you sure you want to cancel this campaign? The escrow bounty will be refunded to your wallet.')) {
      return;
    }

    setActionLoading(campaignId);
    try {
      await ensureStudionetNetwork();
      await sendContractTransaction({
        address: contractAddress,
        functionName: 'cancel_campaign',
        args: [campaignId],
        from: userAddress,
      });
      addToast('info', 'Campaign Cancelled', `Escrow bounty refunded to brand.`);
      if (userAddress) fetchBalance(userAddress);
      await fetchContractData();
    } catch (e: any) {
      addToast('error', 'Cancellation Failed', e?.message || String(e));
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateContract = (addr: string) => {
    setStoredContractAddress(addr);
    setContractAddress(addr);
    addToast('info', 'Contract Updated', `Active contract updated to ${addr.slice(0, 6)}...${addr.slice(-4)}`);
  };

  // Advanced Multi-Filtering and Sorting (100% Real On-Chain)
  const filteredAndSortedCampaigns = useMemo(() => {
    return campaigns
      .filter((c) => {
        // Portal Mode filter
        const norm = String(c.status).toUpperCase();
        if (activePortal === 'BRAND' && userAddress) {
          if (c.brand.toLowerCase() !== userAddress.toLowerCase()) return false;
        } else if (activePortal === 'CREATOR' && userAddress) {
          if (norm !== 'OPEN' && norm !== '0' && c.creator.toLowerCase() !== userAddress.toLowerCase()) return false;
        } else if (activePortal === 'COURT') {
          if (norm !== 'IN_REVIEW' && norm !== '1' && norm !== 'AWAITING_PAYOUT' && norm !== 'DISPUTED' && norm !== 'IN_APPEAL' && !c.verdict) return false;
        }

        // Status filter
        if (selectedStatusTab === 'OPEN' && norm !== 'OPEN' && norm !== '0') return false;
        if (selectedStatusTab === 'IN_REVIEW' && norm !== 'IN_REVIEW' && norm !== '1') return false;
        if (selectedStatusTab === 'AWAITING_PAYOUT' && norm !== 'AWAITING_PAYOUT') return false;
        if (
          selectedStatusTab === 'RESOLVED' &&
          norm !== 'RESOLVED_PAID' &&
          norm !== 'RESOLVED_REFUNDED' &&
          norm !== '2' &&
          norm !== '3'
        )
          return false;
        if (selectedStatusTab === 'DISPUTED' && norm !== 'DISPUTED' && norm !== 'IN_APPEAL' && norm !== '5') return false;

        // Platform filter
        if (selectedPlatform !== 'ALL' && c.platform.toUpperCase() !== selectedPlatform) return false;

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchId = c.campaign_id.toLowerCase().includes(q);
          const matchBrand = c.brand.toLowerCase().includes(q);
          const matchCreator = c.creator.toLowerCase().includes(q);
          const matchGuidelines = c.guidelines.toLowerCase().includes(q);
          if (!matchId && !matchBrand && !matchCreator && !matchGuidelines) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'BOUNTY_HIGH') {
          return BigInt(b.bounty_amount || '0') > BigInt(a.bounty_amount || '0') ? 1 : -1;
        }
        if (sortBy === 'BOUNTY_LOW') {
          return BigInt(a.bounty_amount || '0') > BigInt(b.bounty_amount || '0') ? 1 : -1;
        }
        return 0; // Default is order returned by fetch (newest first)
      });
  }, [campaigns, activePortal, selectedStatusTab, selectedPlatform, searchQuery, sortBy, userAddress]);

  return (
    <div className="min-h-screen bg-[#050811] text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      <Navbar
        userAddress={userAddress}
        balance={balance}
        chainId={chainId}
        contractAddress={contractAddress}
        onConnectWallet={handleConnectWallet}
        onSwitchNetwork={handleSwitchNetwork}
        onUpdateContractAddress={handleUpdateContract}
      />

      <ZeroBalanceBanner balance={balance} userAddress={userAddress} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* VIP Hero Section */}
        <div className="mb-10 relative overflow-hidden rounded-3xl p-8 sm:p-10 border border-slate-800/90 bg-gradient-to-br from-slate-950 via-[#0a0f1e] to-slate-950 shadow-2xl">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-indigo-600/15 via-teal-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/15 text-indigo-300 text-xs font-bold border border-indigo-500/30">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>GenLayer Studionet • Chain ID 61999</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/15 text-teal-300 text-xs font-bold border border-teal-500/30 font-mono">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Anti-Cancel Lock Active</span>
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
                Autonomous Creator Escrow &amp; <span className="text-gradient-vip">Subjective Court</span>
              </h1>

              <p className="text-sm sm:text-base text-slate-300 mt-3 leading-relaxed">
                Decentralized marketing agreements powered by GenVM. Brands lock bounties, creators submit live content, and decentralized LLM validators render consensus audits directly from live web evidence.
              </p>

              <div className="flex flex-wrap items-center gap-4 mt-6 text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>Non-Custodial Escrow</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-400" />
                  <span>Zero-Mock On-Chain Consensus</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span>48h Auto-Payout Guarantee</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0 w-full lg:w-auto">
              <button
                onClick={() => setShowBilateralCharter(true)}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-teal-500 hover:from-indigo-500 hover:to-teal-400 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/25 border border-teal-400/30"
              >
                <Scale className="w-4 h-4 text-teal-200" />
                <span>Bilateral Protection Court Charter</span>
              </button>

              <button
                onClick={fetchContractData}
                disabled={loading}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-900/90 hover:bg-slate-850 text-slate-200 hover:text-white border border-slate-700/80 text-xs font-bold transition-all shadow-lg hover:shadow-indigo-500/10"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${loading ? 'animate-spin' : ''}`} />
                <span>{loading ? 'Syncing Node...' : 'Sync Protocol State'}</span>
              </button>
            </div>
          </div>
        </div>

        {globalError && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{globalError}</span>
          </div>
        )}

        {/* Stats Section */}
        <StatsBar stats={stats} loading={loading} />

        {/* Role Portal Switcher */}
        <div className="mb-6 p-1.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-wrap items-center justify-between gap-2 shadow-lg">
          <div className="flex items-center gap-1.5 overflow-x-auto p-1">
            <button
              onClick={() => setActivePortal('ALL')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activePortal === 'ALL'
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>All Protocol Activity</span>
            </button>

            <button
              onClick={() => {
                setActivePortal('BRAND');
                setActiveTabForm('create');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activePortal === 'BRAND'
                  ? 'bg-gradient-to-r from-indigo-600 to-teal-500 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Brand Sponsor Portal</span>
            </button>

            <button
              onClick={() => {
                setActivePortal('CREATOR');
                setActiveTabForm('submit');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activePortal === 'CREATOR'
                  ? 'bg-gradient-to-r from-teal-600 to-emerald-500 text-white shadow-md shadow-teal-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Creator Bounty Hub</span>
            </button>

            <button
              onClick={() => setActivePortal('COURT')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activePortal === 'COURT'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>AI Consensus Court</span>
            </button>
          </div>

          <div className="flex items-center gap-2 px-3 py-1 text-xs text-slate-400 font-mono">
            <span>Showing:</span>
            <span className="font-bold text-white">{filteredAndSortedCampaigns.length} Escrows</span>
          </div>
        </div>

        {/* Interactive Forms Section */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => setActiveTabForm('create')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTabForm === 'create'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'bg-slate-900/90 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Brand: Create Escrow Campaign</span>
            </button>
            <button
              onClick={() => setActiveTabForm('submit')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTabForm === 'submit'
                  ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/20'
                  : 'bg-slate-900/90 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Creator: Submit Deliverable URL</span>
            </button>
          </div>

          {activeTabForm === 'create' ? (
            <CreateCampaign
              onSuccess={fetchContractData}
              onCreateCampaign={handleCreateCampaign}
              loading={actionLoading === 'create'}
              userAddress={userAddress}
            />
          ) : (
            <SubmitContent
              onSuccess={fetchContractData}
              onSubmitContent={handleSubmitContent}
              loading={actionLoading !== null}
              userAddress={userAddress}
              defaultCampaignId={targetSubmitId}
            />
          )}
        </div>

        {/* Campaign Explorer Section */}
        <div>
          {campaigns.length === 0 && !loading && (
            <div className="mb-5 p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3 text-indigo-200">
                <Shield className="w-5 h-5 text-teal-400 shrink-0" />
                <div>
                  <div className="font-bold text-white">Live On-Chain Protocol (Zero-Mock Production)</div>
                  <div className="text-slate-300 text-[11px] mt-0.5">
                    No active escrow campaigns found on this smart contract yet or syncing from Studionet RPC. Connect your wallet and create your first campaign to lock real GEN on GenLayer!
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setActiveTabForm('create');
                  window.scrollTo({ top: 380, behavior: 'smooth' });
                }}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shrink-0 transition-colors shadow-md shadow-indigo-600/30 flex items-center gap-1.5"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Create New Escrow</span>
              </button>
            </div>
          )}

          {/* Filter Bar: Search, Status, Platform, Sort */}
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                    <span>Escrow Registry &amp; Consensus Court</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-indigo-300 text-xs font-mono font-bold">
                      {filteredAndSortedCampaigns.length}
                    </span>
                  </h2>
                </div>
              </div>

              {/* Search input */}
              <div className="relative w-full sm:w-80">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search ID, guidelines, address..."
                  className="w-full pl-9 pr-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors shadow-inner"
                />
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Filter Pills & Sorters */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              {/* Status pills */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-950 border border-slate-800/80 rounded-xl overflow-x-auto text-xs font-medium">
                {(['ALL', 'OPEN', 'IN_REVIEW', 'AWAITING_PAYOUT', 'RESOLVED', 'DISPUTED'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setSelectedStatusTab(tab)}
                    className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap text-xs ${
                      selectedStatusTab === tab
                        ? 'bg-slate-850 text-white font-bold shadow-sm border border-slate-700/60'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {tab.replace('_', ' ')}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                {/* Platform filter */}
                <select
                  value={selectedPlatform}
                  onChange={(e) => setSelectedPlatform(e.target.value)}
                  className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 focus:outline-none focus:border-indigo-500"
                >
                  <option value="ALL">All Platforms</option>
                  <option value="YOUTUBE">YouTube</option>
                  <option value="X_TWITTER">X / Twitter</option>
                  <option value="TIKTOK">TikTok</option>
                  <option value="BLOG">Blog / Article</option>
                </select>

                {/* Sort selector */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 focus:outline-none focus:border-indigo-500"
                >
                  <option value="NEWEST">Newest First</option>
                  <option value="BOUNTY_HIGH">Bounty: High to Low</option>
                  <option value="BOUNTY_LOW">Bounty: Low to High</option>
                </select>
              </div>
            </div>
          </div>

          {/* Cards Grid */}
          {filteredAndSortedCampaigns.length === 0 ? (
            <div className="p-16 text-center glass-panel rounded-3xl border border-dashed border-slate-800">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-3">
                <Layers className="w-6 h-6" />
              </div>
              <p className="text-slate-300 text-sm font-bold">
                No matching escrow campaigns found.
              </p>
              <p className="text-slate-500 text-xs mt-1 max-w-sm mx-auto">
                Deploy an escrow campaign, submit a deliverable, or clear your search filters to explore.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAndSortedCampaigns.map((camp) => (
                <CampaignCard
                  key={camp.campaign_id}
                  campaign={camp}
                  userAddress={userAddress}
                  onAdjudicate={handleAdjudicate}
                  onClaimTimeout={handleClaimTimeout}
                  onFileAppeal={handleFileAppeal}
                  onFinalizeSettlement={handleFinalizeSettlement}
                  onCancel={handleCancel}
                  onOpenAudit={(c) => setAuditCampaign(c)}
                  onSelectSubmit={(cid) => {
                    setTargetSubmitId(cid);
                    setActiveTabForm('submit');
                    window.scrollTo({ top: 380, behavior: 'smooth' });
                  }}
                  actionLoading={actionLoading}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Audit Modal */}
      <AuditModal
        campaign={auditCampaign}
        isOpen={auditCampaign !== null}
        onClose={() => setAuditCampaign(null)}
      />

      {/* GenVM Bilateral Protection Court Modal */}
      <BilateralCourtModal
        isOpen={showBilateralCharter}
        onClose={() => setShowBilateralCharter(false)}
      />

      {/* Toast Notification Center */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#060912] py-8 text-center text-xs text-slate-500 mt-16">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">AdShield Pro</span>
            <span>— Autonomous Creator Marketing Escrow Protocol</span>
          </div>
          <span className="font-mono text-[11px] text-slate-400">
            Powered by GenLayer Studionet (Chain ID: 61999) &amp; GenVM Non-Deterministic Web Consensus
          </span>
        </div>
      </footer>
    </div>
  );
};

