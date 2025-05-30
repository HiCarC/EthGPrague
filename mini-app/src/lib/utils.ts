import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | number): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatPrice(price: string | number): string {
  const num = typeof price === "string" ? parseFloat(price) : price;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
}

export function formatWeiToWld(
  wei: string | bigint | number,
  decimals: number = 6
): string {
  try {
    const weiNumber = typeof wei === "string" ? BigInt(wei) : BigInt(wei);
    const wld = Number(weiNumber) / Math.pow(10, 18);
    return wld.toFixed(decimals);
  } catch (error) {
    console.error("Error formatting wei to WLD:", error, "Input:", wei);
    return "0.000000";
  }
}

export function parseWldToWei(wld: string): string {
  const wei = BigInt(Math.floor(parseFloat(wld) * Math.pow(10, 18)));
  return wei.toString();
}

export function getBookingStatusText(status: number): string {
  const statusMap = {
    0: "Pending",
    1: "Confirmed",
    2: "Checked In",
    3: "Checked Out",
    4: "Cancelled",
    5: "Refunded",
  };
  return statusMap[status as keyof typeof statusMap] || "Unknown";
}

export function getBookingStatusColor(status: number): string {
  const colorMap = {
    0: "bg-yellow-100 text-yellow-800",
    1: "bg-green-100 text-green-800",
    2: "bg-blue-100 text-blue-800",
    3: "bg-gray-100 text-gray-800",
    4: "bg-red-100 text-red-800",
    5: "bg-purple-100 text-purple-800",
  };
  return (
    colorMap[status as keyof typeof colorMap] || "bg-gray-100 text-gray-800"
  );
}

export function calculateNights(checkIn: Date, checkOut: Date): number {
  const timeDiff = checkOut.getTime() - checkIn.getTime();
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
}

export function isDateInPast(date: Date): boolean {
  return date < new Date();
}

export function truncateAddress(
  address: string | null | undefined,
  start = 6,
  end = 4
): string {
  try {
    if (
      !address ||
      typeof address !== "string" ||
      address === "undefined" ||
      address === "null"
    ) {
      return "0x...";
    }

    if (address.length <= start + end) {
      return address;
    }

    return `${address.slice(0, start)}...${address.slice(-end)}`;
  } catch (error) {
    console.error("Error truncating address:", error, "Input:", address);
    return "0x...";
  }
}
