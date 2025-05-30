"use client";

import { useState } from "react";
import { Property, BookingService } from "@/services/booking";
import { formatWeiToEth, calculateNights } from "@/lib/utils";
import { Button } from "@worldcoin/mini-apps-ui-kit-react";
import { X, Calendar, Users, CreditCard } from "lucide-react";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: Property;
  onBookingCreated?: () => void;
}

export const BookingModal = ({
  isOpen,
  onClose,
  property,
  onBookingCreated,
}: BookingModalProps) => {
  const [checkInDate, setCheckInDate] = useState("");
  const [checkOutDate, setCheckOutDate] = useState("");
  const [guestCount, setGuestCount] = useState(1);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const pricePerNight = formatWeiToEth(property.pricePerNight);
  const nights =
    checkInDate && checkOutDate
      ? calculateNights(new Date(checkInDate), new Date(checkOutDate))
      : 0;
  const totalPrice = nights * parseFloat(pricePerNight);

  const handleBooking = async () => {
    if (!checkInDate || !checkOutDate || guestCount < 1) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);

      await BookingService.createBooking(
        property.id.toString(),
        new Date(checkInDate),
        new Date(checkOutDate),
        guestCount,
        totalPrice.toString()
      );

      alert("Booking created successfully!");
      onBookingCreated?.();
    } catch (error) {
      console.error("Error creating booking:", error);
      alert("Failed to create booking. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">Book {property.name}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Property info */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">{property.name}</span>
              <span className="text-blue-600 font-bold">
                {pricePerNight} ETH/night
              </span>
            </div>
            <div className="text-sm text-gray-600">{property.location}</div>
            <div className="text-sm text-gray-600">
              Max {property.maxGuests.toString()} guests
            </div>
          </div>

          {/* Check-in date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar size={16} className="inline mr-1" />
              Check-in Date
            </label>
            <input
              type="date"
              value={checkInDate}
              onChange={(e) => setCheckInDate(e.target.value)}
              min={today}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Check-out date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar size={16} className="inline mr-1" />
              Check-out Date
            </label>
            <input
              type="date"
              value={checkOutDate}
              onChange={(e) => setCheckOutDate(e.target.value)}
              min={checkInDate || today}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Guest count */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Users size={16} className="inline mr-1" />
              Number of Guests
            </label>
            <select
              value={guestCount}
              onChange={(e) => setGuestCount(parseInt(e.target.value))}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {Array.from(
                { length: Number(property.maxGuests) },
                (_, i) => i + 1
              ).map((num) => (
                <option key={num} value={num}>
                  {num} {num === 1 ? "Guest" : "Guests"}
                </option>
              ))}
            </select>
          </div>

          {/* Price breakdown */}
          {nights > 0 && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex justify-between text-sm mb-1">
                <span>
                  {pricePerNight} ETH × {nights} nights
                </span>
                <span>
                  {(parseFloat(pricePerNight) * nights).toFixed(6)} ETH
                </span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total</span>
                <span className="text-blue-600">
                  {totalPrice.toFixed(6)} ETH
                </span>
              </div>
            </div>
          )}

          {/* Book button */}
          <Button
            onClick={handleBooking}
            disabled={loading || !checkInDate || !checkOutDate || nights <= 0}
            variant="primary"
            size="lg"
            className="w-full flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <>
                <CreditCard size={16} />
                Book Now - {totalPrice.toFixed(6)} ETH
              </>
            )}
          </Button>

          <div className="text-xs text-gray-500 text-center">
            Payment will be processed through your World App wallet
          </div>
        </div>
      </div>
    </div>
  );
};
