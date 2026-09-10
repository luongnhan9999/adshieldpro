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

export function getStatusInfo(rawStatus: string | number): {
  label: string;
  bg: string;
  text: string;
  border: string;
  pulse?: boolean;
} {
  const norm = String(rawStatus).toUpperCase();

  if (norm === 'OPEN' || norm === '0') {
    return {
      label: 'OPEN FOR CREATOR',
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      border: 'border-emerald-500/30',
      pulse: true,
    };
  }
  if (norm === 'IN_REVIEW' || norm === '1') {
    return {
      label: 'IN REVIEW / COURT',
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      border: 'border-amber-500/30',
      pulse: true,
    };
  }
  if (norm === 'AWAITING_PAYOUT') {
    return {
      label: 'AWAITING PAYOUT (24H COOLING)',
      bg: 'bg-cyan-500/10',
      text: 'text-cyan-400',
      border: 'border-cyan-500/30',
      pulse: true,
    };
  }
  if (norm === 'RESOLVED_PAID' || norm === '2') {
    return {
      label: 'PAID TO CREATOR',
      bg: 'bg-indigo-500/10',
      text: 'text-indigo-400',
      border: 'border-indigo-500/30',
    };
  }
  if (norm === 'RESOLVED_REFUNDED' || norm === '3') {
    return {
      label: 'REFUNDED TO BRAND',
      bg: 'bg-rose-500/10',
      text: 'text-rose-400',
      border: 'border-rose-500/30',
    };
  }
  if (norm === 'DISPUTED' || norm === 'IN_APPEAL' || norm === '5') {
    return {
      label: 'IN DISPUTE APPEAL',
      bg: 'bg-purple-500/10',
      text: 'text-purple-400',
      border: 'border-purple-500/30',
      pulse: true,
    };
  }
  if (norm === 'CANCELLED' || norm === '4') {
    return {
      label: 'CANCELLED',
      bg: 'bg-slate-500/10',
      text: 'text-slate-400',
      border: 'border-slate-500/30',
    };
  }

  return {
    label: norm,
    bg: 'bg-slate-500/10',
    text: 'text-slate-400',
    border: 'border-slate-500/30',
  };
}
