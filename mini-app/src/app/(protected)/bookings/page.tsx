"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { BookingService, Booking, Property } from "@/services/booking";
import { formatWeiToWld } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { BottomNavigation } from "@/components/BottomNavigation";
import {
  Calendar,
  Users,
  MapPin,
  Clock,
  CreditCard,
  User,
  Building,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";

// Booking status enum values
const BOOKING_STATUS = {
  0: { label: "Pending", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  1: {
    label: "Confirmed",
    color: "bg-green-100 text-green-800",
    icon: CheckCircle,
  },
  2: { label: "Cancelled", color: "bg-red-100 text-red-800", icon: XCircle },
  3: {
    label: "Checked In",
    color: "bg-blue-100 text-blue-800",
    icon: CheckCircle,
  },
  4: {
    label: "Completed",
    color: "bg-gray-100 text-gray-800",
    icon: CheckCircle,
  },
};

interface BookingWithProperty extends Booking {
  property?: Property;
}

interface UserBookingsData {
  guestBookings: BookingWithProperty[];
  hostBookings: BookingWithProperty[];
  loading: boolean;
}

export default function BookingsPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<"guest" | "host">("guest");
  const [bookingsData, setBookingsData] = useState<UserBookingsData>({
    guestBookings: [],
    hostBookings: [],
    loading: true,
  });

  useEffect(() => {
    fetchUserBookings();
  }, [session]);

  const fetchUserBookings = async () => {
    console.log("fetchUserBookings", session);
    if (!session?.user?.walletAddress) return;

    setBookingsData((prev) => ({ ...prev, loading: true }));

    try {
      const userAddress = session.user.walletAddress;

      // Fetch bookings made by user as guest
      const guestBookingIds = await BookingService.getGuestBookings(
        userAddress
      );
      const guestBookings: BookingWithProperty[] = [];

      for (const bookingId of guestBookingIds) {
        const booking = await BookingService.getBooking(bookingId);
        if (booking) {
          const property = await BookingService.getProperty(
            booking.propertyId.toString()
          );
          guestBookings.push({ ...booking, property: property || undefined });
        }
      }

      // Fetch bookings for properties owned by user (host)
      const ownerPropertyIds = await BookingService.getOwnerProperties(
        userAddress
      );
      const hostBookings: BookingWithProperty[] = [];

      for (const propertyId of ownerPropertyIds) {
        const property = await BookingService.getProperty(propertyId);
        const bookingIds = await BookingService.getPropertyBookings(propertyId);

        for (const bookingId of bookingIds) {
          const booking = await BookingService.getBooking(bookingId);
          if (booking) {
            hostBookings.push({ ...booking, property: property || undefined });
          }
        }
      }

      setBookingsData({
        guestBookings: guestBookings.sort(
          (a, b) => Number(b.createdAt) - Number(a.createdAt)
        ),
        hostBookings: hostBookings.sort(
          (a, b) => Number(b.createdAt) - Number(a.createdAt)
        ),
        loading: false,
      });
    } catch (error) {
      console.error("Error fetching bookings:", error);
      setBookingsData((prev) => ({ ...prev, loading: false }));
    }
  };

  const formatDate = (timestamp: bigint) => {
    return new Date(Number(timestamp) * 1000).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const calculateNights = (checkIn: bigint, checkOut: bigint) => {
    const checkInDate = new Date(Number(checkIn) * 1000);
    const checkOutDate = new Date(Number(checkOut) * 1000);
    const diffTime = checkOutDate.getTime() - checkInDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleBookingAction = async (
    booking: Booking,
    action: "confirm" | "cancel" | "checkin" | "checkout"
  ) => {
    try {
      switch (action) {
        case "confirm":
          await BookingService.confirmBooking(booking.id.toString());
          break;
        case "cancel":
          await BookingService.cancelBooking(booking.id.toString());
          break;
        case "checkin":
          await BookingService.checkIn(booking.id.toString());
          break;
        case "checkout":
          await BookingService.checkOut(booking.id.toString());
          break;
      }
      // Refresh bookings after action
      fetchUserBookings();
    } catch (error) {
      console.error(`Error ${action} booking:`, error);
    }
  };

  const renderBookingCard = (
    booking: BookingWithProperty,
    isHost: boolean = false
  ) => {
    const status =
      BOOKING_STATUS[booking.status as keyof typeof BOOKING_STATUS];
    const StatusIcon = status.icon;
    const nights = calculateNights(booking.checkInDate, booking.checkOutDate);
    const totalAmount = formatWeiToWld(booking.totalAmount);

    return (
      <div
        key={booking.id.toString()}
        className="bg-white rounded-xl border border-gray-200 p-6 space-y-4 shadow-sm hover:shadow-md transition-shadow"
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-gray-900 mb-1">
              {booking.property?.name || "Property"}
            </h3>
            <div className="flex items-center text-gray-600 text-sm">
              <MapPin className="w-4 h-4 mr-1" />
              <span>
                {booking.property?.location || "Location not available"}
              </span>
            </div>
          </div>
          <div
            className={`px-3 py-1 rounded-full text-xs font-medium ${status.color} flex items-center gap-1`}
          >
            <StatusIcon className="w-3 h-3" />
            {status.label}
          </div>
        </div>

        {/* Property Image */}
        <div className="w-full h-32 rounded-lg overflow-hidden bg-gray-100">
          {booking.property?.imageUrls &&
          booking.property.imageUrls.length > 0 ? (
            <img
              src={booking.property.imageUrls[0]}
              alt={booking.property.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <Building className="w-8 h-8" />
            </div>
          )}
        </div>

        {/* Booking Details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="w-4 h-4" />
            <div>
              <div className="font-medium text-gray-900">Check-in</div>
              <div>{formatDate(booking.checkInDate)}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="w-4 h-4" />
            <div>
              <div className="font-medium text-gray-900">Check-out</div>
              <div>{formatDate(booking.checkOutDate)}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Users className="w-4 h-4" />
            <div>
              <div className="font-medium text-gray-900">Guests</div>
              <div>{booking.guestCount.toString()}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <CreditCard className="w-4 h-4" />
            <div>
              <div className="font-medium text-gray-900">Total</div>
              <div className="font-semibold text-gray-900">
                {totalAmount} WLD
              </div>
            </div>
          </div>
        </div>

        {/* Guest/Host Info */}
        <div className="pt-3 border-t border-gray-100">
          <div className="text-xs text-gray-500 mb-1">
            {isHost ? "Guest" : "Host"}
          </div>
          <div className="text-sm font-medium text-gray-900">
            {isHost
              ? `${booking.guest.slice(0, 6)}...${booking.guest.slice(-4)}`
              : `${booking.property?.owner.slice(
                  0,
                  6
                )}...${booking.property?.owner.slice(-4)}`}
          </div>
        </div>

        {/* Action Buttons */}
        {isHost && booking.status === 0 && (
          <div className="flex gap-3 pt-3">
            <Button
              onClick={() => handleBookingAction(booking, "confirm")}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              size="sm"
            >
              Confirm
            </Button>
            <Button
              onClick={() => handleBookingAction(booking, "cancel")}
              variant="outline"
              className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
              size="sm"
            >
              Decline
            </Button>
          </div>
        )}

        {booking.status === 1 && (
          <div className="flex gap-3 pt-3">
            <Button
              onClick={() => handleBookingAction(booking, "checkin")}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              size="sm"
            >
              Check In
            </Button>
            <Button
              onClick={() => handleBookingAction(booking, "cancel")}
              variant="outline"
              className="flex-1"
              size="sm"
            >
              Cancel
            </Button>
          </div>
        )}

        {booking.status === 3 && (
          <Button
            onClick={() => handleBookingAction(booking, "checkout")}
            className="w-full bg-gray-900 hover:bg-gray-800 text-white"
            size="sm"
          >
            Check Out
          </Button>
        )}
      </div>
    );
  };

  const currentBookings =
    activeTab === "guest"
      ? bookingsData.guestBookings
      : bookingsData.hostBookings;

  if (bookingsData.loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white px-4 py-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-gray-900">Trips</h1>
        <p className="text-gray-600 text-sm mt-1">
          Manage your bookings and hosting
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b">
        <div className="flex">
          <button
            onClick={() => setActiveTab("guest")}
            className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
              activeTab === "guest"
                ? "text-gray-900 border-b-2 border-gray-900"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Your trips ({bookingsData.guestBookings.length})
          </button>
          <button
            onClick={() => setActiveTab("host")}
            className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
              activeTab === "host"
                ? "text-gray-900 border-b-2 border-gray-900"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Hosting ({bookingsData.hostBookings.length})
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 pb-24">
        {currentBookings.length === 0 ? (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
              <div className="text-gray-500 mb-4 text-lg">
                {activeTab === "guest"
                  ? "No trips booked...yet!"
                  : "No bookings to manage...yet!"}
              </div>
              <p className="text-gray-400 text-sm mb-6">
                {activeTab === "guest"
                  ? "Time to dust off your bags and start planning your next adventure"
                  : "When you have bookings to manage, you'll find them here"}
              </p>
              <Button
                onClick={() => (window.location.href = "/home")}
                className="bg-gray-900 text-white hover:bg-gray-800"
              >
                {activeTab === "guest"
                  ? "Start searching"
                  : "List your property"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 max-w-2xl mx-auto">
            {currentBookings.map((booking) =>
              renderBookingCard(booking, activeTab === "host")
            )}
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
}
