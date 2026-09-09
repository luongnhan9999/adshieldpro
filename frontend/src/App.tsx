import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { ZeroBalanceBanner } from './components/ZeroBalanceBanner';
import { StatsBar } from './components/StatsBar';
import { CreateCampaign } from './components/CreateCampaign';
import { SubmitContent } from './components/SubmitContent';
import { CampaignCard } from './components/CampaignCard';
import { AuditModal } from './components/AuditModal';
import { Campaign, CampaignStatus, Platform, ProtocolStats } from './types';
import {
  ensureStudionetNetwork,
  genlayerClient,
  getStoredContractAddress,
  setStoredContractAddress,
  STUDIONET_CHAIN_ID,
} from './config/genlayer';
import { formatGen, toWei } from './utils/formatters';
import { Layers, Sparkles, RefreshCw, AlertCircle } from 'lucide-react';

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
  const [selectedTab, setSelectedTab] = useState<'ALL' | 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'IN_APPEAL'>('ALL');
  const [auditCampaign, setAuditCampaign] = useState<Campaign | null>(null);
  const [activeTabForm, setActiveTabForm] = useState<'create' | 'submit'>('create');
  const [targetSubmitId, setTargetSubmitId] = useState<string>('');
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Fetch balance for user
  const fetchBalance = useCallback(async (addr: string) => {
    if (typeof window === 'undefined' || !(window as any).ethereum) return;
    try {
      const balanceHex = await (window as any).ethereum.request({
        method: 'eth_getBalance',
        params: [addr, 'latest'],
      });
      const balGen = formatGen(BigInt(balanceHex));
      setBalance(balGen);
    } catch (e) {
      console.error('Failed to fetch balance:', e);
    }
  }, []);

  // Connect MetaMask
  const handleConnectWallet = async () => {
    if (typeof window === 'undefined' || !(window as any).ethereum) {
      alert('MetaMask is not installed. Please install MetaMask to use AdShield Pro.');
      return;
    }

    try {
      setGlobalError(null);
      await ensureStudionetNetwork();
      const accounts = await (window as any).ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts && accounts[0]) {
        setUserAddress(accounts[0]);
        await fetchBalance(accounts[0]);
      }

      const currentChainId = await (window as any).ethereum.request({
        method: 'eth_chainId',
      });
      setChainId(parseInt(currentChainId, 16));
    } catch (err: any) {
      console.error('Wallet connection error:', err);
      setGlobalError(err?.message || 'Failed to connect wallet.');
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
      // 1. Fetch Stats
      try {
        const rawStats = await genlayerClient.readContract({
          address: contractAddress as any,
          functionName: 'get_stats',
          args: [],
        });
        if (rawStats) {
          const parsed = JSON.parse(rawStats as string);
          setStats({
            total_campaigns: Number(parsed.total_campaigns || 0),
            total_escrow_locked: String(parsed.total_escrow_locked || '0'),
            total_campaigns_settled: Number(parsed.total_campaigns_settled || 0),
          });
        }
      } catch (e) {
        console.warn('Could not fetch stats:', e);
      }

      // 2. Fetch Campaign Count & Campaigns
      try {
        const rawCount = await genlayerClient.readContract({
          address: contractAddress as any,
          functionName: 'get_campaign_count',
          args: [],
        });

        const count = Number(rawCount || 0);
        const fetchedCampaigns: Campaign[] = [];

        for (let i = 0; i < count; i++) {
          try {
            const cid = await genlayerClient.readContract({
              address: contractAddress as any,
              functionName: 'get_campaign_id_by_index',
              args: [i],
            });

            if (cid) {
              const campRaw = await genlayerClient.readContract({
                address: contractAddress as any,
                functionName: 'get_campaign',
                args: [cid as string],
              });
              if (campRaw) {
                fetchedCampaigns.push(JSON.parse(campRaw as string));
              }
            }
          } catch (itemErr) {
            console.warn(`Failed reading campaign index ${i}:`, itemErr);
          }
        }

        // Sort latest first
        fetchedCampaigns.reverse();
        setCampaigns(fetchedCampaigns);
      } catch (countErr) {
        console.warn('Could not read campaign list:', countErr);
      }
    } catch (err: any) {
      console.error('Contract read failed:', err);
    } finally {
      setLoading(false);
    }
  }, [contractAddress]);

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

    const valueWei = toWei(bountyGen);
    setActionLoading('create');

    try {
      await ensureStudionetNetwork();

      // Write via genlayer-js / MetaMask provider
      const txHash = await (genlayerClient as any).writeContract({
        address: contractAddress as `0x${string}`,
        functionName: 'create_campaign',
        args: [guidelines, platform, timeoutSeconds],
        value: valueWei,
      });

      console.log('Campaign created tx:', txHash);
      if (userAddress) fetchBalance(userAddress);
      await fetchContractData();
    } finally {
      setActionLoading(null);
    }
  };

  // Submit Content
  const handleSubmitContent = async (campaignId: string, deliverableUrl: string) => {
    if (!contractAddress || contractAddress === '0x0000000000000000000000000000000000000000') {
      throw new Error('Contract address not configured.');
    }

    setActionLoading(campaignId);
    try {
      await ensureStudionetNetwork();
      await (genlayerClient as any).writeContract({
        address: contractAddress as `0x${string}`,
        functionName: 'submit_content',
        args: [campaignId, deliverableUrl],
      });
      await fetchContractData();
    } finally {
      setActionLoading(null);
    }
  };

  // Adjudicate
  const handleAdjudicate = async (campaignId: string) => {
    setActionLoading(campaignId);
    try {
      await ensureStudionetNetwork();
      await (genlayerClient as any).writeContract({
        address: contractAddress as `0x${string}`,
        functionName: 'adjudicate',
        args: [campaignId],
      });
      if (userAddress) fetchBalance(userAddress);
      await fetchContractData();
    } catch (e: any) {
      alert(`Adjudication error: ${e?.message || e}`);
    } finally {
      setActionLoading(null);
    }
  };

  // Claim Timeout
  const handleClaimTimeout = async (campaignId: string) => {
    setActionLoading(campaignId);
    try {
      await ensureStudionetNetwork();
      await (genlayerClient as any).writeContract({
        address: contractAddress as `0x${string}`,
        functionName: 'claim_timeout_payout',
        args: [campaignId],
      });
      if (userAddress) fetchBalance(userAddress);
      await fetchContractData();
    } catch (e: any) {
      alert(`Timeout payout error: ${e?.message || e}`);
    } finally {
      setActionLoading(null);
    }
  };

  // File Appeal
  const handleFileAppeal = async (campaignId: string, minBondWei: string) => {
    setActionLoading(campaignId);
    try {
      await ensureStudionetNetwork();
      await (genlayerClient as any).writeContract({
        address: contractAddress as `0x${string}`,
        functionName: 'file_dispute_appeal',
        args: [campaignId],
        value: BigInt(minBondWei),
      });
      if (userAddress) fetchBalance(userAddress);
      await fetchContractData();
    } catch (e: any) {
      alert(`Dispute appeal error: ${e?.message || e}`);
    } finally {
      setActionLoading(null);
    }
  };

  // Cancel Campaign
  const handleCancel = async (campaignId: string) => {
    if (!confirm('Are you sure you want to cancel this campaign? The escrow bounty will be refunded to your wallet.')) {
      return;
    }

    setActionLoading(campaignId);
    try {
      await ensureStudionetNetwork();
      await (genlayerClient as any).writeContract({
        address: contractAddress as `0x${string}`,
        functionName: 'cancel_campaign',
        args: [campaignId],
      });
      if (userAddress) fetchBalance(userAddress);
      await fetchContractData();
    } catch (e: any) {
      alert(`Cancel error: ${e?.message || e}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateContract = (addr: string) => {
    setStoredContractAddress(addr);
    setContractAddress(addr);
  };

  // Filter campaigns
  const filteredCampaigns = campaigns.filter((c) => {
    if (selectedTab === 'ALL') return true;
    if (selectedTab === 'OPEN') return c.status === CampaignStatus.OPEN;
    if (selectedTab === 'IN_REVIEW') return c.status === CampaignStatus.IN_REVIEW;
    if (selectedTab === 'RESOLVED') return c.status === CampaignStatus.RESOLVED_PAID || c.status === CampaignStatus.RESOLVED_REFUNDED;
    if (selectedTab === 'IN_APPEAL') return c.status === CampaignStatus.IN_APPEAL;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col">
      <Navbar
        userAddress={userAddress}
        balance={balance}
        chainId={chainId}
        contractAddress={contractAddress}
        onConnectWallet={handleConnectWallet}
        onUpdateContractAddress={handleUpdateContract}
      />

      <ZeroBalanceBanner balance={balance} userAddress={userAddress} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold border border-indigo-500/20">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Subjective Consensus on GenVM</span>
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Autonomous Creator Marketing Escrow
            </h1>
            <p className="text-sm text-slate-400 mt-2 max-w-2xl leading-relaxed">
              Brands lock marketing escrows; Creators deliver content. Decentralized LLM validators render on-chain consensus audits directly from live web evidence with Anti-Cancel Protection.
            </p>
          </div>

          <button
            onClick={fetchContractData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 text-xs font-semibold transition-all shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Protocol Data</span>
          </button>
        </div>

        {globalError && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{globalError}</span>
          </div>
        )}

        {/* Stats Section */}
        <StatsBar stats={stats} loading={loading} />

        {/* Interactive Forms Section */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => setActiveTabForm('create')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTabForm === 'create'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Brand: Create Escrow Campaign
            </button>
            <button
              onClick={() => setActiveTabForm('submit')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTabForm === 'submit'
                  ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/20'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Creator: Submit Deliverable URL
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" />
              <h2 className="text-xl font-bold text-white">
                Escrow Campaigns & Subjective Court
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-xs font-mono font-bold">
                {filteredCampaigns.length}
              </span>
            </div>

            {/* Filter tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto text-xs font-medium">
              {(['ALL', 'OPEN', 'IN_REVIEW', 'RESOLVED', 'IN_APPEAL'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSelectedTab(tab)}
                  className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                    selectedTab === tab
                      ? 'bg-slate-800 text-white font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Cards Grid */}
          {filteredCampaigns.length === 0 ? (
            <div className="p-12 text-center bg-[#101626]/50 border border-dashed border-slate-800 rounded-3xl">
              <p className="text-slate-400 text-sm font-medium">
                No campaigns found for this view.
              </p>
              <p className="text-slate-500 text-xs mt-1">
                Create a marketing campaign or switch filters to see active escrows.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCampaigns.map((camp) => (
                <CampaignCard
                  key={camp.campaign_id}
                  campaign={camp}
                  userAddress={userAddress}
                  onAdjudicate={handleAdjudicate}
                  onClaimTimeout={handleClaimTimeout}
                  onFileAppeal={handleFileAppeal}
                  onCancel={handleCancel}
                  onOpenAudit={(c) => setAuditCampaign(c)}
                  onSelectSubmit={(cid) => {
                    setTargetSubmitId(cid);
                    setActiveTabForm('submit');
                    window.scrollTo({ top: 400, behavior: 'smooth' });
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

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#080b12] py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>AdShield Pro — Autonomous Marketing Escrow Protocol</span>
          <span className="font-mono text-[11px] text-slate-400">
            Powered by GenLayer Studionet (Chain ID: 61999) &amp; GenVM
          </span>
        </div>
      </footer>
    </div>
  );
};
