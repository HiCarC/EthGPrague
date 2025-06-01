import { auth } from "@/auth";
import { ProfileContent } from "@/components/ProfileContent";
import { BottomNavigation } from "@/components/BottomNavigation";

export default async function ProfilePage() {
  const session = await auth();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white px-4 py-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-gray-900">Profile</h1>
        <p className="text-gray-600 text-sm mt-1">
          Manage your account and preferences
        </p>
      </div>

      {/* Content */}
      <div className="px-4 py-6 pb-24">{session && <ProfileContent />}</div>

      <BottomNavigation />
    </div>
  );
}
