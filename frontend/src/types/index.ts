export type Platform = 'YOUTUBE' | 'X_TWITTER' | 'TIKTOK' | 'BLOG';

export type CampaignStatusType =
  | 'OPEN'
  | 'IN_REVIEW'
  | 'AWAITING_PAYOUT'
  | 'RESOLVED_PAID'
  | 'RESOLVED_REFUNDED'
  | 'DISPUTED'
  | 'CANCELLED'
  | number;

export const CampaignStatus = {
  OPEN: 'OPEN',
  IN_REVIEW: 'IN_REVIEW',
  AWAITING_PAYOUT: 'AWAITING_PAYOUT',
  RESOLVED_PAID: 'RESOLVED_PAID',
  RESOLVED_REFUNDED: 'RESOLVED_REFUNDED',
  DISPUTED: 'DISPUTED',
  CANCELLED: 'CANCELLED',
  // Backwards compatibility numeric keys
  0: 'OPEN',
  1: 'IN_REVIEW',
  2: 'RESOLVED_PAID',
  3: 'RESOLVED_REFUNDED',
  4: 'CANCELLED',
  5: 'DISPUTED',
} as const;

export interface Campaign {
  campaign_id: string;
  brand: string;
  creator: string;
  bounty_amount: string; // in wei / native string
  appeal_bond: string;
  guidelines: string;
  platform: Platform | string;
  deliverable_url: string;
  status: string | number;
  verdict: string;
  reason: string;
  confidence: number;
  compliance_score: number;
  submitted_at: string;
  timeout_duration: string;
  payout_ready_at?: string;
  disputed_at?: string;
  created_at_block?: string;
}

export interface ProtocolStats {
  total_campaigns: number;
  total_escrow_locked: string;
  total_campaigns_settled: number;
}
