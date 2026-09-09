import { CampaignStatus } from '../types';

export function formatGen(wei: string | number | bigint, decimals: number = 4): string {
  try {
    const b = BigInt(wei.toString());
    const divisor = 10n ** 18n;
    const whole = b / divisor;
    const remainder = b % divisor;
    
    if (remainder === 0n) {
      return whole.toString();
    }
    
    // Pad remainder to 18 digits
    let remStr = remainder.toString().padStart(18, '0');
    remStr = remStr.slice(0, decimals).replace(/0+$/, '');
    
    return remStr.length > 0 ? `${whole}.${remStr}` : whole.toString();
  } catch {
    return '0';
  }
}

export function toWei(gen: string | number): bigint {
  const parts = gen.toString().split('.');
  const whole = BigInt(parts[0] || '0');
  let fraction = parts[1] || '';
  if (fraction.length > 18) {
    fraction = fraction.slice(0, 18);
  }
  const fracBigInt = BigInt(fraction.padEnd(18, '0'));
  return whole * (10n ** 18n) + fracBigInt;
}

export function truncateAddress(addr: string): string {
  if (!addr || addr === '0x0000000000000000000000000000000000000000') {
    return 'Unclaimed (Open)';
  }
  if (addr.length < 10) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function getStatusInfo(status: CampaignStatus): {
  label: string;
  bg: string;
  text: string;
  border: string;
  pulse?: boolean;
} {
  switch (status) {
    case CampaignStatus.OPEN:
      return {
        label: 'OPEN FOR CREATOR',
        bg: 'bg-emerald-500/10',
        text: 'text-emerald-400',
        border: 'border-emerald-500/30',
        pulse: true,
      };
    case CampaignStatus.IN_REVIEW:
      return {
        label: 'IN REVIEW / COURT',
        bg: 'bg-amber-500/10',
        text: 'text-amber-400',
        border: 'border-amber-500/30',
        pulse: true,
      };
    case CampaignStatus.RESOLVED_PAID:
      return {
        label: 'PAID TO CREATOR',
        bg: 'bg-indigo-500/10',
        text: 'text-indigo-400',
        border: 'border-indigo-500/30',
      };
    case CampaignStatus.RESOLVED_REFUNDED:
      return {
        label: 'REFUNDED TO BRAND',
        bg: 'bg-rose-500/10',
        text: 'text-rose-400',
        border: 'border-rose-500/30',
      };
    case CampaignStatus.CANCELLED:
      return {
        label: 'CANCELLED',
        bg: 'bg-slate-500/10',
        text: 'text-slate-400',
        border: 'border-slate-500/30',
      };
    case CampaignStatus.IN_APPEAL:
      return {
        label: 'IN DISPUTE APPEAL',
        bg: 'bg-purple-500/10',
        text: 'text-purple-400',
        border: 'border-purple-500/30',
        pulse: true,
      };
    default:
      return {
        label: 'UNKNOWN',
        bg: 'bg-slate-500/10',
        text: 'text-slate-400',
        border: 'border-slate-500/30',
      };
  }
}
