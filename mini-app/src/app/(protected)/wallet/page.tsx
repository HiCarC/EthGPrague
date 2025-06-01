import { auth } from "@/auth";
import { WalletContent } from "@/components/WalletContent";
import { BottomNavigation } from "@/components/BottomNavigation";

export default async function WalletPage() {
  const session = await auth();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white px-4 py-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-gray-900">Wallet</h1>
        <p className="text-gray-600 text-sm mt-1">
          Manage your WLD tokens and transactions
        </p>
      </div>

      {/* Content */}
      <div className="px-4 py-6 pb-24">
        <WalletContent />
      </div>

      <BottomNavigation />
    </div>
  );
}
