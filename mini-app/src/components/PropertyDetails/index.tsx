"use client";

import { useState, useEffect, useMemo } from "react";
import { Property, BookingService } from "@/services/booking";
import { formatWeiToWld, truncateAddress } from "@/lib/utils";
import { BookingModal } from "@/components/BookingModal";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Users,
  Calendar,
  Star,
  Wifi,
  Car,
  Coffee,
  Home,
  AlertCircle,
  Heart,
  Share,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface PropertyDetailsProps {
  propertyId: string;
}

export const PropertyDetails = ({ propertyId }: PropertyDetailsProps) => {
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const pricePerNight = useMemo(
    () =>
      property && property.pricePerNight
        ? formatWeiToWld(property.pricePerNight)
        : "0",
    [property?.pricePerNight]
  );

  useEffect(() => {
    if (propertyId) {
      loadProperty();
    }
  }, [propertyId]);

  const loadProperty = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!propertyId || propertyId === "undefined") {
        throw new Error("Invalid property ID");
      }

      const fetchedProperty = await BookingService.getProperty(propertyId);

      if (!fetchedProperty) {
        throw new Error("Property not found");
      }

      setProperty(fetchedProperty);
    } catch (error: any) {
      console.error("Error loading property:", error);
      setError(error?.message || "Failed to load property details");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center py-12 px-4 max-w-md mx-auto">
          <AlertCircle size={48} className="mx-auto text-red-400 mb-4" />
          <div className="text-red-600 mb-4 font-medium text-lg">
            Error Loading Property
          </div>
          <div className="text-gray-600 mb-6">{error}</div>
          <Button
            onClick={loadProperty}
            className="bg-gray-900 text-white hover:bg-gray-800"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center py-12 px-4">
          <div className="text-gray-500 mb-4 text-lg">Property not found</div>
          <Button
            onClick={() => window.history.back()}
            className="bg-gray-900 text-white hover:bg-gray-800"
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  // Safely get property values with fallbacks
  const hasImages =
    property.imageUrls &&
    Array.isArray(property.imageUrls) &&
    property.imageUrls.length > 0;
  const maxGuests = property.maxGuests ? property.maxGuests.toString() : "1";
  const propertyName = property.name || "Unnamed Property";
  const propertyLocation = property.location || "Location not specified";
  const propertyDescription =
    property.description || "No description available";
  const propertyOwner = property.owner || "";

  const nextImage = () => {
    if (hasImages && property.imageUrls) {
      setCurrentImageIndex((prev) => (prev + 1) % property.imageUrls.length);
    }
  };

  const prevImage = () => {
    if (hasImages && property.imageUrls) {
      setCurrentImageIndex((prev) =>
        prev === 0 ? property.imageUrls.length - 1 : prev - 1
      );
    }
  };

  // Mock amenities for demonstration
  const amenities = [
    { icon: Wifi, name: "Free Wi-Fi" },
    { icon: Car, name: "Parking" },
    { icon: Coffee, name: "Kitchen" },
    { icon: Home, name: "Entire place" },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Image Gallery */}
      <div className="relative h-80 md:h-96 bg-gray-200 overflow-hidden">
        {hasImages && property.imageUrls ? (
          <>
            <img
              src={property.imageUrls[currentImageIndex] || ""}
              alt={propertyName}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
              }}
            />
            {property.imageUrls.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/90 text-gray-700 rounded-full p-2 hover:bg-white shadow-md transition-all"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/90 text-gray-700 rounded-full p-2 hover:bg-white shadow-md transition-all"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                  {property.imageUrls.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        index === currentImageIndex ? "bg-white" : "bg-white/50"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gradient-to-br from-gray-100 to-gray-200">
            <MapPin className="w-16 h-16" />
          </div>
        )}

        {/* Action Buttons */}
        <div className="absolute top-4 right-4 flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="bg-white/90 text-gray-700 hover:bg-white shadow-md rounded-full p-2"
          >
            <Share className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="bg-white/90 text-gray-700 hover:bg-white shadow-md rounded-full p-2"
          >
            <Heart className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-8">
        {/* Property Header */}
        <div>
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-2">
                {propertyName}
              </h1>
              <div className="flex items-center text-gray-600 mb-2">
                <MapPin className="w-4 h-4 mr-1" />
                <span className="text-sm">{propertyLocation}</span>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <Star className="w-4 h-4 fill-current text-gray-900 mr-1" />
                  <span className="font-medium text-gray-900">4.98</span>
                  <span className="ml-1">(128 reviews)</span>
                </div>
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-1" />
                  <span>Up to {maxGuests} guests</span>
                </div>
              </div>
            </div>
          </div>

          {/* Host Info */}
          <div className="border-t border-b border-gray-200 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  Hosted by {truncateAddress(propertyOwner)}
                </h3>
                <p className="text-gray-600 text-sm">
                  Blockchain verified host
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-lg">
                  {propertyOwner.slice(2, 4).toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Amenities */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            What this place offers
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {amenities.map((amenity, index) => {
              const IconComponent = amenity.icon;
              return (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg"
                >
                  <IconComponent className="w-5 h-5 text-gray-700" />
                  <span className="text-sm text-gray-700">{amenity.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Description */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            About this place
          </h2>
          <p className="text-gray-700 leading-relaxed">{propertyDescription}</p>
        </div>

        {/* Booking Card */}
        <div className="border border-gray-200 rounded-xl p-6 shadow-sm bg-white sticky bottom-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-semibold text-gray-900">
                  {pricePerNight} WLD
                </span>
                <span className="text-gray-600">per night</span>
              </div>
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Star className="w-3 h-3 fill-current text-gray-900" />
                <span className="font-medium text-gray-900">4.98</span>
                <span>• 128 reviews</span>
              </div>
            </div>
          </div>

          <Button
            onClick={() => setShowBookingModal(true)}
            className="w-full bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white py-3 font-medium text-base"
          >
            Reserve
          </Button>

          <p className="text-center text-gray-600 text-sm mt-3">
            You won't be charged yet
          </p>
        </div>
      </div>

      {/* Booking Modal */}
      {property && (
        <BookingModal
          isOpen={showBookingModal}
          onClose={() => setShowBookingModal(false)}
          property={property}
          onBookingCreated={() => {
            setShowBookingModal(false);
          }}
        />
      )}
    </div>
  );
};
