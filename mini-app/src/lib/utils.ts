import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format Wei to WLD (assuming 18 decimal places like Ethereum)
export function formatWeiToWld(weiAmount: bigint | string | number): string {
  const wei =
    typeof weiAmount === "bigint" ? weiAmount : BigInt(weiAmount.toString());
  const wld = Number(wei) / Math.pow(10, 18);
  return wld.toFixed(4);
}

// Truncate Ethereum address for display
export function truncateAddress(address: string): string {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Calculate nights between two dates
export function calculateNights(startDate: Date, endDate: Date): number {
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}
