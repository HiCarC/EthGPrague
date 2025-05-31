import { MiniKit } from "@worldcoin/minikit-js";
import { createPublicClient, http, formatEther, parseEther } from "viem";
import { defineChain } from "viem";

// Define World Chain Testnet
const worldchainTestnet = defineChain({
  id: 4801,
  name: "World Chain Testnet",
  network: "worldchain-testnet",
  nativeCurrency: {
    decimals: 18,
    name: "World Token",
    symbol: "WLD",
  },
  rpcUrls: {
    default: {
      http: ["https://worldchain-sepolia.g.alchemy.com/public"],
    },
  },
  blockExplorers: {
    default: {
      name: "Worldscan",
      url: "https://worldscan.org",
    },
  },
  testnet: true,
});

// Public client for reading blockchain data
export const publicClient = createPublicClient({
  chain: worldchainTestnet,
  transport: http("https://worldchain-sepolia.g.alchemy.com/public"),
});

export interface WalletBalance {
  eth: string;
  wld: string;
  usd: string;
}

export interface Transaction {
  id: string;
  hash: string;
  type: "send" | "receive";
  amount: string;
  token: string;
  to?: string;
  from?: string;
  date: string;
  status: "pending" | "completed" | "failed";
  description?: string;
}

export class WalletService {
  /**
   * Get wallet balance for WLD
   */
  static async getWLDBalance(address: string): Promise<string> {
    try {
      // This would need to be implemented to read WLD token balance
      // For now, return mock balance
      return "150.0";
    } catch (error) {
      console.error("Error fetching WLD balance:", error);
      return "0";
    }
  }

  /**
   * Get wallet balances (WLD focus)
   */
  static async getWalletBalances(address: string): Promise<WalletBalance> {
    try {
      const wldBalance = await this.getWLDBalance(address);

      // Mock ETH balance for gas fees
      const ethBalance = "0.1";

      // Mock USD conversion - replace with actual price API
      const wldPrice = 2.5; // Mock WLD price in USD
      const usdValue = (parseFloat(wldBalance) * wldPrice).toFixed(2);

      return {
        eth: ethBalance,
        wld: wldBalance,
        usd: usdValue,
      };
    } catch (error) {
      console.error("Error fetching wallet balances:", error);
      return {
        eth: "0",
        wld: "0",
        usd: "0",
      };
    }
  }

  /**
   * Get transaction history (mock for now)
   */
  static async getTransactionHistory(address: string): Promise<Transaction[]> {
    // In a real implementation, you would fetch from blockchain or indexer
    // For now, return mock data
    return [
      {
        id: "1",
        hash: "0x1234567890abcdef1234567890abcdef12345678",
        type: "receive",
        amount: "5.0",
        token: "WLD",
        from: "Property Booking Refund",
        date: new Date(Date.now() - 86400000).toISOString(),
        status: "completed",
        description: "Booking refund for cancelled reservation",
      },
      {
        id: "2",
        hash: "0xabcdef1234567890abcdef1234567890abcdef12",
        type: "send",
        amount: "15.5",
        token: "WLD",
        to: "Property Booking",
        date: new Date(Date.now() - 172800000).toISOString(),
        status: "completed",
        description: "Payment for property booking",
      },
      {
        id: "3",
        hash: "0x567890abcdef1234567890abcdef1234567890ab",
        type: "receive",
        amount: "25.0",
        token: "WLD",
        from: "Yield Rewards",
        date: new Date(Date.now() - 259200000).toISOString(),
        status: "completed",
        description: "Yield farming rewards",
      },
    ];
  }

  /**
   * Send WLD transaction using MiniKit
   */
  static async sendWLD(
    to: string,
    amount: string,
    description?: string
  ): Promise<any> {
    try {
      // This would need to implement WLD token transfer
      // For now, return mock response
      return { success: true, hash: "0x..." };
    } catch (error) {
      console.error("Error sending WLD:", error);
      throw error;
    }
  }

  /**
   * Get network information
   */
  static getNetworkInfo() {
    return {
      name: "World Chain Testnet",
      chainId: 4801,
      currency: "WLD",
      explorer: "https://worldscan.org",
      rpcUrl: "https://worldchain-sepolia.g.alchemy.com/public",
    };
  }

  /**
   * Format wallet address for display
   */
  static formatAddress(address: string): string {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  /**
   * Validate ethereum address
   */
  static isValidAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  /**
   * Get yield information (mock for now)
   */
  static async getYieldInfo(address: string) {
    // Mock yield data - replace with actual smart contract calls
    return {
      totalYieldEarned: "12.45",
      pendingYield: "2.31",
      yieldRate: "8.5", // APY percentage
      lastClaim: new Date(Date.now() - 604800000).toISOString(), // 7 days ago
      canClaim: true,
    };
  }

  /**
   * Claim yield rewards
   */
  static async claimYield(): Promise<any> {
    try {
      // Replace with actual yield contract interaction
      const { finalPayload } = await MiniKit.commandsAsync.sendTransaction({
        transaction: [
          {
            address: "0x1234567890123456789012345678901234567890", // Replace with yield contract
            abi: [],
            functionName: "claimYield",
            args: [],
          },
        ],
      });

      return finalPayload;
    } catch (error) {
      console.error("Error claiming yield:", error);
      throw error;
    }
  }
}
