import { auth } from "@/auth";
import { Page } from "@/components/PageLayout";
import { PropertyListings } from "@/components/PropertyListings";
import { BottomNavigation } from "@/components/BottomNavigation";
import { Search, Home, Bell, Heart, Star, Diamond } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default async function HomePage() {
  const session = await auth();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="pb-20">
        {/* Search Header */}
        <div className="bg-white px-4 py-6 shadow-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Start your search"
              className="pl-10 py-3 text-base border-gray-200 rounded-full"
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="bg-white px-4 py-6 border-b">
          <div className="flex justify-around items-center">
            <div className="flex flex-col items-center space-y-2">
              <div className="p-3 bg-gray-100 rounded-lg">
                <Home className="w-6 h-6 text-gray-700" />
              </div>
              <span className="text-sm font-medium text-gray-900">Homes</span>
              <div className="w-8 h-0.5 bg-black rounded-full"></div>
            </div>

            <div className="flex flex-col items-center space-y-2 relative">
              <div className="p-3 bg-gray-100 rounded-lg">
                <div className="w-6 h-6 bg-gradient-to-b from-red-400 to-orange-500 rounded-full relative">
                  <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-2 h-3 bg-orange-600 rounded-sm"></div>
                </div>
              </div>
              <span className="text-sm text-gray-600">Experiences</span>
              <Badge className="absolute -top-1 -right-2 bg-blue-600 text-white text-xs px-2 py-0.5">
                NEW
              </Badge>
            </div>

            <div className="flex flex-col items-center space-y-2 relative">
              <div className="p-3 bg-gray-100 rounded-lg">
                <Bell className="w-6 h-6 text-gray-700" />
              </div>
              <span className="text-sm text-gray-600">Services</span>
              <Badge className="absolute -top-1 -right-2 bg-blue-600 text-white text-xs px-2 py-0.5">
                NEW
              </Badge>
            </div>
          </div>
        </div>

        {/* Continue Searching Section */}
        <div className="mx-4 my-6">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  Continue searching for homes
                </h3>
                <p className="text-gray-600 text-sm">
                  Powered by blockchain • {session?.user.username}
                </p>
              </div>
              <div className="ml-4">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <Home className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Property Listings Section */}
        <div className="px-4 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            Discover amazing properties
            <span className="ml-2 text-gray-400">›</span>
          </h2>

          <PropertyListings />
        </div>

        {/* Prices notification */}
        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-10">
          <div className="bg-white rounded-full px-4 py-3 shadow-lg border border-gray-200 flex items-center space-x-2">
            <Diamond className="w-5 h-5 text-pink-500" />
            <span className="text-sm font-medium text-gray-900">
              Prices include all fees
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}
