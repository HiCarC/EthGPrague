"use client";

import { useState } from "react";
import { Property, BookingService } from "@/services/booking";
import { formatWeiToWld, calculateNights } from "@/lib/utils";
import { Button } from "@worldcoin/mini-apps-ui-kit-react";
import {
  X,
  Calendar,
  Users,
  CreditCard,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { tokenToDecimals } from "@worldcoin/minikit-js";
import { Tokens } from "@worldcoin/minikit-js";
import { MiniKit } from "@worldcoin/minikit-js";

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
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const pricePerNight = formatWeiToWld(property.pricePerNight);
  const nights =
    checkInDate && checkOutDate
      ? calculateNights(new Date(checkInDate), new Date(checkOutDate))
      : 0;
  const totalPrice = nights * parseFloat(pricePerNight);

  const validateDates = () => {
    if (!checkInDate || !checkOutDate) {
      return "Please select both check-in and check-out dates";
    }

    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (checkIn < today) {
      return "Check-in date cannot be in the past";
    }

    if (checkOut <= checkIn) {
      return "Check-out date must be after check-in date";
    }

    if (nights > 30) {
      return "Maximum stay is 30 nights";
    }

    return null;
  };

  const handleBooking = async () => {
    setError(null);
    setSuccess(false);

    // Validate inputs
    const dateError = validateDates();
    if (dateError) {
      setError(dateError);
      return;
    }

    if (guestCount < 1 || guestCount > Number(property.maxGuests)) {
      setError(`Guest count must be between 1 and ${property.maxGuests}`);
      return;
    }

    if (totalPrice <= 0) {
      setError("Invalid price calculation. Please check your dates.");
      return;
    }

    if (totalPrice > 100) {
      // Reasonable upper limit for safety
      setError(
        "Total amount seems too high. Please check your booking details."
      );
      return;
    }

    try {
      setLoading(true);

      console.log("Creating booking with:", {
        propertyId: property.id.toString(),
        checkInDate: new Date(checkInDate),
        checkOutDate: new Date(checkOutDate),
        guestCount,
        totalAmount: totalPrice.toString(),
      });
      const res = await fetch("/api/initiate-payment", {
        method: "POST",
      });
      const { id } = await res.json();

      const result = await MiniKit.commandsAsync.pay({
        reference: id,
        to: "0x0D42170A23E7b83c2d8E48Ad6BDa5e7273A1F771",
        tokens: [
          {
            symbol: Tokens.WLD,
            token_amount: tokenToDecimals(0.5, Tokens.WLD).toString(),
          },
        ],
        description: "Test example payment for minikit",
      });
      // console.log("result", result);
      await BookingService.createBooking(
        property.id.toString(),
        new Date(checkInDate),
        new Date(checkOutDate),
        guestCount,
        totalPrice.toString()
      );

      setSuccess(true);

      // Close modal after a short delay to show success message
      setTimeout(() => {
        onBookingCreated?.();
      }, 2000);
    } catch (error: any) {
      console.error("Error creating booking:", error);

      // Better error handling
      let errorMessage = "Failed to create booking. Please try again.";

      if (error?.message) {
        if (error.message.includes("insufficient funds")) {
          errorMessage =
            "Insufficient funds. Please ensure you have enough WLD.";
        } else if (error.message.includes("rejected")) {
          errorMessage = "Transaction was rejected. Please try again.";
        } else if (error.message.includes("network")) {
          errorMessage = "Network error. Please check your connection.";
        } else if (error.message.includes("hex string")) {
          errorMessage = "Transaction format error. Please try again.";
        } else if (error.message.includes("user denied")) {
          errorMessage = "Transaction was cancelled by user.";
        } else if (
          error.message.includes("invalid") ||
          error.message.includes("revert")
        ) {
          errorMessage =
            "Invalid transaction. Please check your booking details.";
        } else {
          errorMessage = error.message;
        }
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split("T")[0];
  const isValidBooking =
    checkInDate && checkOutDate && nights > 0 && !validateDates();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">Book {property.name}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
              <CheckCircle size={20} className="text-green-600 flex-shrink-0" />
              <div>
                <p className="text-green-800 font-medium">
                  Booking created successfully!
                </p>
                <p className="text-green-600 text-sm">
                  Your transaction is being processed.
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
              <AlertCircle size={20} className="text-red-600 flex-shrink-0" />
              <div>
                <p className="text-red-800 font-medium">Booking Failed</p>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Property info */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">{property.name}</span>
              <span className="text-blue-600 font-bold">
                {pricePerNight} WLD/night
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
              onChange={(e) => {
                setCheckInDate(e.target.value);
                setError(null);
              }}
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
              onChange={(e) => {
                setCheckOutDate(e.target.value);
                setError(null);
              }}
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
              onChange={(e) => {
                setGuestCount(parseInt(e.target.value));
                setError(null);
              }}
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
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <div className="flex justify-between text-sm mb-1">
                <span>
                  {pricePerNight} WLD × {nights} nights
                </span>
                <div className="text-right">
                  {(parseFloat(pricePerNight) * nights).toFixed(6)} WLD
                </div>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total:</span>
                <span>{totalPrice.toFixed(6)} WLD</span>
              </div>
            </div>
          )}

          {/* Book button */}
          <Button
            onClick={handleBooking}
            disabled={loading || !isValidBooking || success}
            variant="primary"
            size="lg"
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white">
                loading....
              </div>
            ) : success ? (
              <>
                <CheckCircle size={16} />
                Booking Created!
              </>
            ) : (
              <div className="flex items-center gap-2 bg-black p-4 rounded-lg">
                <CreditCard size={16} />
                Book Now - ${totalPrice.toFixed(6)} WLD
              </div>
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
