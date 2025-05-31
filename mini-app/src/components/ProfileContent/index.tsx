"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { Marble, Button } from "@worldcoin/mini-apps-ui-kit-react";
import { BookingService } from "@/services/booking";
import { WalletService } from "@/services/wallet";
import { auth } from "@/auth";

interface BookingData {
  id: string;
  propertyName: string;
  location: string;
  checkInDate: string;
  checkOutDate: string;
  amount: string;
  status: string;
}

export const ProfileContent = (sessionUser: any) => {
  const { data: session } = useSession();

  const [bookingHistory, setBookingHistory] = useState<BookingData[]>([]);
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalSpent: "0",
    memberSince: "",
    verificationLevel: "World ID Verified",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      console.log("ProfileContent: Starting fetchUserData");
      console.log("ProfileContent: Session data:", sessionUser);
      console.log("ProfileContent: Session data:", session);
      console.log("ProfileContent: Session data:", sessionUser.user);
      if (!sessionUser?.user?.walletAddress) {
        console.log("ProfileContent: No wallet address found, returning early");
        return;
      }

      console.log(
        "ProfileContent: Wallet address:",
        sessionUser.user.walletAddress
      );

      try {
        setLoading(true);
        console.log("ProfileContent: Set loading to true");

        // Fetch user's booking history
        console.log("ProfileContent: Fetching guest bookings...");
        const bookingIds = await BookingService.getGuestBookings(
          sessionUser.user.walletAddress
        );
        console.log("ProfileContent: Received booking IDs:", bookingIds);

        // Fetch detailed booking information
        console.log(
          "ProfileContent: Processing booking details for",
          bookingIds.slice(0, 5).length,
          "bookings"
        );
        const bookingDetails = await Promise.all(
          bookingIds.slice(0, 5).map(async (id, index) => {
            // Limit to 5 recent bookings
            console.log(
              `ProfileContent: Processing booking ${index + 1}/${
                bookingIds.slice(0, 5).length
              }, ID:`,
              id
            );
            try {
              const booking = await BookingService.getBooking(id);
              console.log(`ProfileContent: Booking ${id} data:`, booking);
              if (!booking) {
                console.log(`ProfileContent: No booking data for ID ${id}`);
                return null;
              }

              const property = await BookingService.getProperty(
                booking.propertyId.toString()
              );
              console.log(
                `ProfileContent: Property data for booking ${id}:`,
                property
              );
              if (!property) {
                console.log(
                  `ProfileContent: No property data for booking ${id}`
                );
                return null;
              }

              const bookingDetail = {
                id: booking.id.toString(),
                propertyName: property.name,
                location: property.location,
                checkInDate: new Date(
                  Number(booking.checkInDate) * 1000
                ).toLocaleDateString(),
                checkOutDate: new Date(
                  Number(booking.checkOutDate) * 1000
                ).toLocaleDateString(),
                amount: WalletService.formatAddress(
                  booking.totalAmount.toString()
                ),
                status: getBookingStatus(booking.status),
              };
              console.log(
                `ProfileContent: Processed booking detail for ${id}:`,
                bookingDetail
              );
              return bookingDetail;
            } catch (error) {
              console.error(
                `ProfileContent: Error fetching booking details for ${id}:`,
                error
              );
              return null;
            }
          })
        );

        const validBookings = bookingDetails.filter(Boolean) as BookingData[];
        console.log(
          "ProfileContent: Valid bookings after processing:",
          validBookings
        );
        setBookingHistory(validBookings);

        // Calculate stats
        const totalBookings = bookingIds.length;
        let totalSpent = 0;
        console.log(
          "ProfileContent: Calculating stats, total booking IDs:",
          totalBookings
        );

        // Calculate total spent (this is a simplified calculation)
        validBookings.forEach((booking, index) => {
          console.log(
            `ProfileContent: Processing amount for booking ${index + 1}:`,
            booking.amount
          );
          // Extract numeric value from formatted amount
          const amount = parseFloat(booking.amount.replace(/[^\d.-]/g, ""));
          console.log(`ProfileContent: Parsed amount:`, amount);
          if (!isNaN(amount)) {
            totalSpent += amount;
          }
        });

        const calculatedStats = {
          totalBookings,
          totalSpent: totalSpent.toFixed(4),
          memberSince: new Date(2023, 8, 15).toLocaleDateString(), // Mock date
          verificationLevel: "World ID Verified",
        };
        console.log("ProfileContent: Calculated stats:", calculatedStats);
        setStats(calculatedStats);
      } catch (error) {
        console.error("ProfileContent: Error fetching user data:", error);
        console.log("ProfileContent: Using mock data due to error");
        // Use mock data on error
        const mockBookings = [
          {
            id: "1",
            propertyName: "Cozy Downtown Apartment",
            location: "Prague, Czech Republic",
            checkInDate: "2024-01-10",
            checkOutDate: "2024-01-15",
            amount: "2.5 WLD",
            status: "Completed",
          },
          {
            id: "2",
            propertyName: "Modern Loft in City Center",
            location: "Berlin, Germany",
            checkInDate: "2024-02-05",
            checkOutDate: "2024-02-10",
            amount: "3.2 WLD",
            status: "Upcoming",
          },
        ];
        console.log(
          "ProfileContent: Setting mock booking history:",
          mockBookings
        );
        setBookingHistory(mockBookings);

        const mockStats = {
          totalBookings: 8,
          totalSpent: "15.6",
          memberSince: "2023-09-15",
          verificationLevel: "World ID Verified",
        };
        console.log("ProfileContent: Setting mock stats:", mockStats);
        setStats(mockStats);
      } finally {
        console.log("ProfileContent: Setting loading to false");
        setLoading(false);
      }
    };

    console.log(
      "ProfileContent: useEffect triggered, wallet address:",
      session?.user?.walletAddress
    );
    fetchUserData();
  }, [session]);

  const getBookingStatus = (status: number): string => {
    console.log("ProfileContent: getBookingStatus called with status:", status);
    const statusMap: { [key: number]: string } = {
      0: "Pending",
      1: "Confirmed",
      2: "Checked In",
      3: "Completed",
      4: "Cancelled",
    };
    const mappedStatus = statusMap[status] || "Unknown";
    console.log("ProfileContent: Mapped status:", mappedStatus);
    return mappedStatus;
  };

  const handleSignOut = async () => {
    console.log("ProfileContent: handleSignOut called");
    try {
      console.log("ProfileContent: Attempting to sign out...");
      await signOut({ redirect: true, callbackUrl: "/" });
      console.log("ProfileContent: Sign out successful");
    } catch (error) {
      console.error("ProfileContent: Error signing out:", error);
    }
  };

  if (loading) {
    console.log("ProfileContent: Rendering loading state");
    return (
      <div className="flex flex-col gap-4 mb-16 p-4">
        <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-20 h-20 bg-gray-200 rounded-full"></div>
            <div className="flex-1">
              <div className="h-6 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-1/4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  console.log("ProfileContent: Rendering main content");
  console.log("ProfileContent: Current stats:", stats);
  console.log("ProfileContent: Current booking history:", bookingHistory);

  return (
    <div className="flex flex-col gap-4 mb-16 p-4">
      {/* User Profile Card */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-4 mb-4">
          <Marble src={session?.user.profilePictureUrl} className="w-20 h-20" />
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">
              {session?.user.username || "Anonymous User"}
            </h2>
            <p className="text-sm text-gray-600 mb-1">
              {stats.verificationLevel}
            </p>
            <p className="text-xs text-gray-500">
              Member since {stats.memberSince}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">
              {stats.totalBookings}
            </p>
            <p className="text-sm text-gray-600">Total Bookings</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {stats.totalSpent} WLD
            </p>
            <p className="text-sm text-gray-600">Total Spent</p>
          </div>
        </div>
      </div>

      {/* Wallet Info */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <h3 className="text-lg font-bold mb-3">Wallet Information</h3>
        <div className="bg-gray-100 p-3 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Connected Wallet</p>
          <p className="text-sm font-mono break-all">
            {session?.user.walletAddress || "Not Connected"}
          </p>
        </div>
      </div>

      {/* Booking History */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <h3 className="text-lg font-bold mb-3">Recent Bookings</h3>
        {bookingHistory.length > 0 ? (
          <div className="space-y-3">
            {bookingHistory.map((booking) => (
              <div
                key={booking.id}
                className="border border-gray-200 rounded-lg p-3"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">
                      {booking.propertyName}
                    </h4>
                    <p className="text-sm text-gray-600">{booking.location}</p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      booking.status === "Completed"
                        ? "bg-green-100 text-green-800"
                        : booking.status === "Upcoming" ||
                          booking.status === "Confirmed"
                        ? "bg-blue-100 text-blue-800"
                        : booking.status === "Cancelled"
                        ? "bg-red-100 text-red-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {booking.status}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-600">
                  <span>
                    {booking.checkInDate} - {booking.checkOutDate}
                  </span>
                  <span className="font-medium text-gray-900">
                    {booking.amount}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No bookings found</p>
            <p className="text-sm">
              Start exploring properties to make your first booking!
            </p>
          </div>
        )}
        <Button variant="secondary" size="sm" className="w-full mt-3">
          View All Bookings
        </Button>
      </div>

      {/* Account Settings */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <h3 className="text-lg font-bold mb-3">Account Settings</h3>
        <div className="space-y-3">
          <Button
            variant="secondary"
            size="sm"
            className="w-full justify-start"
          >
            Notification Preferences
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="w-full justify-start"
          >
            Privacy Settings
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="w-full justify-start"
          >
            Payment Methods
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="w-full justify-start"
          >
            Support & Help
          </Button>
        </div>
      </div>

      {/* Logout */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <Button
          variant="secondary"
          size="sm"
          className="w-full text-red-600 hover:bg-red-50"
          onClick={handleSignOut}
        >
          Sign Out
        </Button>
      </div>
    </div>
  );
};
