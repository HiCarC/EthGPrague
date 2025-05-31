"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@worldcoin/mini-apps-ui-kit-react";
import {
  WalletService,
  type WalletBalance,
  type Transaction,
} from "@/services/wallet";
import { Copy, ExternalLink, RefreshCw, AlertCircle } from "lucide-react";

export const WalletContent = () => {
  const { data: session } = useSession();
  const [balances, setBalances] = useState<WalletBalance>({
    eth: "0",
    wld: "0",
    usd: "0",
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [yieldInfo, setYieldInfo] = useState({
    totalYieldEarned: "0",
    pendingYield: "0",
    canClaim: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchWalletData = async () => {
    if (!session?.user?.walletAddress) return;

    try {
      setError(null);
      console.log("Fetching wallet data for:", session.user.walletAddress);

      // Fetch all wallet data in parallel
      const [balanceData, transactionData, yieldData] = await Promise.all([
        WalletService.getWalletBalances(session.user.walletAddress),
        WalletService.getTransactionHistory(session.user.walletAddress),
        WalletService.getYieldInfo(session.user.walletAddress),
      ]);

      setBalances(balanceData);
      setTransactions(transactionData);
      setYieldInfo(yieldData);
    } catch (error) {
      console.error("Error fetching wallet data:", error);
      setError("Failed to load wallet data. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchWalletData();
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
    }
  };

  const handleClaimYield = async () => {
    try {
      await WalletService.claimYield();
      // Refresh yield info after claiming
      if (session?.user?.walletAddress) {
        const updatedYieldInfo = await WalletService.getYieldInfo(
          session.user.walletAddress
        );
        setYieldInfo(updatedYieldInfo);

        // Also refresh balances as they might have changed
        const updatedBalances = await WalletService.getWalletBalances(
          session.user.walletAddress
        );
        setBalances(updatedBalances);
      }
    } catch (error) {
      console.error("Error claiming yield:", error);
      alert("Failed to claim yield. Please try again.");
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, [session?.user?.walletAddress]);

  if (loading) {
    return (
      <div className="flex flex-col gap-4 mb-16 p-4">
        <div className="bg-white rounded-lg shadow-md p-4 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-6 bg-gray-200 rounded w-2/3"></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-lg shadow-md p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-6 bg-gray-200 rounded w-3/4"></div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-6 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-4 mb-16 p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle size={20} />
            <span className="font-medium">Error loading wallet data</span>
          </div>
          <p className="text-red-600 mt-1">{error}</p>
          <Button
            onClick={handleRefresh}
            variant="secondary"
            size="sm"
            className="mt-3"
            disabled={refreshing}
          >
            {refreshing ? (
              <>
                <RefreshCw size={16} className="animate-spin mr-2" />
                Retrying...
              </>
            ) : (
              "Try Again"
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 mb-16 p-4">
      {/* Header with refresh button */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Your Wallet</h1>
        <Button
          onClick={handleRefresh}
          variant="secondary"
          size="sm"
          disabled={refreshing}
          className="flex items-center gap-2"
        >
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          {refreshing ? "Updating..." : "Refresh"}
        </Button>
      </div>

      {/* Wallet Address */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <h2 className="text-lg font-bold mb-2">Wallet Address</h2>
        <div className="bg-gray-100 p-3 rounded-lg flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm text-gray-600 mb-1">Address</p>
            <p className="text-sm font-mono break-all">
              {session?.user.walletAddress || "Not Connected"}
            </p>
          </div>
          <div className="flex gap-2 ml-2">
            <button
              onClick={() => copyToClipboard(session?.user.walletAddress || "")}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              title="Copy address"
            >
              <Copy size={16} />
            </button>
            <a
              href={`https://worldscan.org/address/${session?.user.walletAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              title="View on explorer"
            >
              <ExternalLink size={16} />
            </a>
          </div>
        </div>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow-md p-4 text-center">
          <p className="text-sm text-gray-600 mb-1">ETH Balance</p>
          <p className="text-xl font-bold text-blue-600">
            {parseFloat(balances.eth).toFixed(6)}
          </p>
          <p className="text-sm text-gray-500">ETH</p>
          <p className="text-xs text-gray-400 mt-1">For gas fees</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 text-center">
          <p className="text-sm text-gray-600 mb-1">WLD Balance</p>
          <p className="text-2xl font-bold text-gray-900">
            {parseFloat(balances.wld).toFixed(4)}
          </p>
          <p className="text-sm text-gray-500">WLD</p>
          <p className="text-xs text-gray-400 mt-1">
            ≈ ${parseFloat(balances.usd).toFixed(2)} USD
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <h2 className="text-lg font-bold mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="secondary" size="sm" disabled>
            Send
          </Button>
          <Button variant="secondary" size="sm" disabled>
            Receive
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">
          Send/Receive features coming soon
        </p>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <h2 className="text-lg font-bold mb-3">Recent Transactions</h2>
        <div className="space-y-3">
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No transactions found</p>
              <p className="text-sm">
                Your transaction history will appear here
              </p>
            </div>
          ) : (
            transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium capitalize">
                      {tx.type}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        tx.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : tx.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {tx.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">
                    {tx.description ||
                      (tx.type === "send"
                        ? `To: ${WalletService.formatAddress(tx.to || "")}`
                        : `From: ${WalletService.formatAddress(
                            tx.from || ""
                          )}`)}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs text-gray-500">
                      {new Date(tx.date).toLocaleDateString()}
                    </p>
                    {tx.hash && (
                      <a
                        href={`https://worldscan.org/tx/${tx.hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-500 hover:underline flex items-center gap-1"
                      >
                        View <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                </div>
                <p
                  className={`text-sm font-medium ${
                    tx.type === "receive" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {tx.type === "receive" ? "+" : "-"}
                  {tx.amount} {tx.token}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Yield Information */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <h2 className="text-lg font-bold mb-3">Yield Earnings</h2>
        <div className="bg-gradient-to-r from-purple-100 to-blue-100 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-700">Total Yield Earned</span>
            <span className="text-base text-gray-900 font-medium">
              {yieldInfo.totalYieldEarned} WLD
            </span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-700">Pending Yield</span>
            <span className="text-base text-gray-900 font-medium">
              {yieldInfo.pendingYield} WLD
            </span>
          </div>
          <Button
            variant="primary"
            size="sm"
            className="w-full mt-2"
            onClick={handleClaimYield}
            disabled={
              !yieldInfo.canClaim || parseFloat(yieldInfo.pendingYield) <= 0
            }
          >
            {yieldInfo.canClaim ? "Claim Yield" : "No Yield Available"}
          </Button>
          <p className="text-xs text-gray-600 mt-2 text-center">
            Yield is calculated based on your WLD balance (8.5% APY)
          </p>
        </div>
      </div>

      {/* Network Info */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <h2 className="text-lg font-bold mb-3">Network Information</h2>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Network</span>
            <span className="text-sm font-medium">World Chain</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Chain ID</span>
            <span className="text-sm font-medium">480</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Currency</span>
            <span className="text-sm font-medium">WLD</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Explorer</span>
            <a
              href="https://worldscan.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-500 hover:underline flex items-center gap-1"
            >
              worldscan.org <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </div>

      {/* Data freshness indicator */}
      <div className="text-xs text-gray-500 text-center">
        Data refreshed: {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
};
