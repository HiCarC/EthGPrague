import { auth } from "@/auth";
import { Page } from "@/components/PageLayout";
import { PropertyListings } from "@/components/PropertyListings";
import { BookingNavigation } from "@/components/BookingNavigation";
import { Marble, TopBar } from "@worldcoin/mini-apps-ui-kit-react";

export default async function Home() {
  const session = await auth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Page.Header className="p-0 bg-transparent">
        <div className="bg-white/80 backdrop-blur-sm border-b border-white/20 shadow-sm">
          <TopBar
            title="BookingWLD"
            endAdornment={
              <div className="flex items-center gap-3">
                <div className="text-right hidden xs:block">
                  <p className="text-sm font-semibold text-gray-900 capitalize leading-tight">
                    {session?.user.username}
                  </p>
                  <p className="text-xs text-gray-500">Welcome back</p>
                </div>
                <div className="relative">
                  <Marble
                    src={session?.user.profilePictureUrl}
                    className="w-10 h-10 sm:w-12 sm:h-12 ring-2 ring-white shadow-md"
                  />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
                </div>
              </div>
            }
            className="px-4 sm:px-6"
          />
        </div>
      </Page.Header>

      <Page.Main className="p-4 sm:p-6 space-y-6">
        {/* Welcome Section */}
        <div className="text-center py-6 sm:py-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-3">
            Welcome to BookingWLD
          </h1>
          <p className="text-gray-600 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Experience the future of property booking with blockchain-powered
            transparency and security
          </p>
        </div>

        {/* Property Listings */}
        <div className="max-w-7xl mx-auto">
          <PropertyListings />
        </div>
      </Page.Main>

      {/* Mobile-optimized bottom spacing */}
      <div className="h-20 sm:h-8"></div>
    </div>
  );
}
