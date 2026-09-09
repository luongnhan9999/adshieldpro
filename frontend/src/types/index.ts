export type Platform = 'YOUTUBE' | 'X_TWITTER' | 'TIKTOK' | 'BLOG';

export enum CampaignStatus {
  OPEN = 0,
  IN_REVIEW = 1,
  RESOLVED_PAID = 2,
  RESOLVED_REFUNDED = 3,
  CANCELLED = 4,
  IN_APPEAL = 5,
}

export interface Campaign {
  campaign_id: string;
  brand: string;
  creator: string;
  bounty_amount: string; // in wei / native string
  appeal_bond: string;
  guidelines: string;
  platform: Platform | string;
  deliverable_url: string;
  status: CampaignStatus;
  verdict: string;
  reason: string;
  confidence: number;
  compliance_score: number;
  submitted_at: string;
  timeout_duration: string;
  created_at_block: string;
}

export interface ProtocolStats {
  total_campaigns: number;
  total_escrow_locked: string;
  total_campaigns_settled: number;
}
