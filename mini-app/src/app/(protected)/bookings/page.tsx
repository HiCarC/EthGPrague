"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { BookingService, Booking, Property } from "@/services/booking";
import { formatWeiToWld } from "@/lib/utils";
import { Button } from "@worldcoin/mini-apps-ui-kit-react";
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
        className="bg-white rounded-lg border border-gray-200 p-4 space-y-3"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isHost ? (
              <Building size={20} className="text-blue-600" />
            ) : (
              <User size={20} className="text-green-600" />
            )}
            <h3 className="font-semibold text-lg">
              {booking.property?.name || "Property"}
            </h3>
          </div>
          <div
            className={`px-2 py-1 rounded-full text-xs font-medium ${status.color} flex items-center gap-1`}
          >
            <StatusIcon size={12} />
            {status.label}
          </div>
        </div>

        {/* Property Details */}
        <div className="space-y-2">
          {booking.property?.location && (
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin size={16} />
              <span className="text-sm">{booking.property.location}</span>
            </div>
          )}

          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Calendar size={16} />
              <span>
                {formatDate(booking.checkInDate)} -{" "}
                {formatDate(booking.checkOutDate)}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Users size={16} />
              <span>{Number(booking.guestCount)} guests</span>
            </div>
          </div>
        </div>

        {/* Booking Details */}
        <div className="bg-gray-50 rounded-lg p-3 space-y-2">
          <div className="flex justify-between text-sm">
            <span>Duration:</span>
            <span className="font-medium">{nights} nights</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Total Amount:</span>
            <span className="font-semibold text-green-600">
              {totalAmount} WLD
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Booking ID:</span>
            <span className="font-mono text-xs">{booking.id.toString()}</span>
          </div>
        </div>

        {/* Actions for Host */}
        {isHost && booking.status === 0 && (
          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              onClick={() => handleBookingAction(booking, "confirm")}
              className="flex-1"
            >
              Confirm Booking
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleBookingAction(booking, "cancel")}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        )}

        {/* Check-in/Check-out Actions for Host */}
        {isHost && booking.status === 1 && (
          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              onClick={() => handleBookingAction(booking, "checkin")}
              className="flex-1"
            >
              Check In Guest
            </Button>
          </div>
        )}

        {/* Check-out Action for Host */}
        {isHost && booking.status === 3 && (
          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              onClick={() => handleBookingAction(booking, "checkout")}
              className="flex-1"
            >
              Check Out Guest
            </Button>
          </div>
        )}
      </div>
    );
  };

  if (!session) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <AlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            Authentication Required
          </h2>
          <p className="text-gray-500">Please log in to view your bookings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 pb-20">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">My Bookings</h1>
        <p className="text-gray-600">
          Manage your reservations and hosting activities
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
        <button
          onClick={() => setActiveTab("guest")}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === "guest"
              ? "bg-white text-blue-600 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <User size={16} />
            My Trips ({bookingsData.guestBookings.length})
          </div>
        </button>
        <button
          onClick={() => setActiveTab("host")}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === "host"
              ? "bg-white text-blue-600 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <Building size={16} />
            Hosting ({bookingsData.hostBookings.length})
          </div>
        </button>
      </div>

      {/* Loading State */}
      {bookingsData.loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading your bookings...</p>
        </div>
      )}

      {/* Bookings List */}
      {!bookingsData.loading && (
        <div className="space-y-4">
          {activeTab === "guest" && (
            <>
              {bookingsData.guestBookings.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    No trips yet
                  </h3>
                  <p className="text-gray-500">
                    Book your first property to see your trips here.
                  </p>
                </div>
              ) : (
                bookingsData.guestBookings.map((booking) =>
                  renderBookingCard(booking, false)
                )
              )}
            </>
          )}

          {activeTab === "host" && (
            <>
              {bookingsData.hostBookings.length === 0 ? (
                <div className="text-center py-8">
                  <Building size={48} className="mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    No bookings yet
                  </h3>
                  <p className="text-gray-500">
                    Once guests book your properties, they'll appear here.
                  </p>
                </div>
              ) : (
                <>
                  {bookingsData.hostBookings.length > 0 && (
                    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2 text-blue-800">
                        <AlertCircle size={16} />
                        <span className="text-sm font-medium">
                          Host Dashboard
                        </span>
                      </div>
                      <p className="text-sm text-blue-700 mt-1">
                        Manage guest bookings for your properties. Confirm
                        pending bookings and handle check-ins/check-outs.
                      </p>
                    </div>
                  )}
                  {bookingsData.hostBookings.map((booking) =>
                    renderBookingCard(booking, true)
                  )}
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
