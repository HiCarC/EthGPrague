import { auth } from "@/auth";
import { BottomNavigation } from "@/components/BottomNavigation";
import { MessageCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function MessagesPage() {
  const session = await auth();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white px-4 py-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-gray-900">Messages</h1>
        <p className="text-gray-600 text-sm mt-1">Chat with hosts and guests</p>
      </div>

      {/* Content */}
      <div className="px-4 py-6 pb-24">
        <div className="text-center py-16">
          <div className="max-w-md mx-auto">
            <MessageCircle size={48} className="mx-auto text-gray-300 mb-4" />
            <div className="text-gray-500 mb-4 text-lg">No messages yet</div>
            <p className="text-gray-400 text-sm mb-6">
              When you contact a host or guest, your messages will appear here
            </p>
            <Button
              onClick={() => (window.location.href = "/home")}
              className="bg-gray-900 text-white hover:bg-gray-800"
            >
              <Plus size={16} className="mr-2" />
              Start exploring
            </Button>
          </div>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}
