"use client";

import { useState, useEffect } from "react";
import { Property, BookingService } from "@/services/booking";
import { formatWeiToEth, truncateAddress } from "@/lib/utils";
import { BookingModal } from "@/components/BookingModal";
import { Button } from "@worldcoin/mini-apps-ui-kit-react";
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
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <AlertCircle size={48} className="mx-auto text-red-400 mb-4" />
          <div className="text-red-600 mb-4 font-medium">
            Error Loading Property
          </div>
          <div className="text-gray-600 mb-6">{error}</div>
          <Button onClick={loadProperty} variant="primary" size="lg">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 mb-4">Property not found</div>
        <Button
          onClick={() => window.history.back()}
          variant="primary"
          size="lg"
        >
          Go Back
        </Button>
      </div>
    );
  }

  // Safely get property values with fallbacks
  const pricePerNight = property.pricePerNight
    ? formatWeiToEth(property.pricePerNight)
    : "0";
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
    <div className="max-w-4xl mx-auto px-4 space-y-6">
      {/* Image Gallery */}
      <div className="relative h-64 md:h-96 bg-gray-200 rounded-lg overflow-hidden">
        {hasImages && property.imageUrls ? (
          <>
            <img
              src={property.imageUrls[currentImageIndex] || ""}
              alt={propertyName}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Handle broken images
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
              }}
            />
            {property.imageUrls.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-3 hover:bg-opacity-70 transition-all"
                >
                  ←
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-3 hover:bg-opacity-70 transition-all"
                >
                  →
                </button>
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                  {property.imageUrls.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-3 h-3 rounded-full transition-all ${
                        index === currentImageIndex
                          ? "bg-white"
                          : "bg-white bg-opacity-50"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            No Images Available
          </div>
        )}
      </div>

      {/* Property Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            {propertyName}
          </h1>
          <div className="flex items-center gap-4 text-gray-600 mb-3">
            <div className="flex items-center gap-1">
              <MapPin size={16} />
              <span>{propertyLocation}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users size={16} />
              <span>Up to {maxGuests} guests</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={16}
                  className="text-yellow-400 fill-current"
                />
              ))}
            </div>
            <span className="text-sm text-gray-600">(4.8 · 24 reviews)</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-blue-600">
            {pricePerNight} ETH
          </div>
          <div className="text-sm text-gray-500">per night</div>
        </div>
      </div>

      {/* Description */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-3">About this place</h2>
        <p className="text-gray-700 leading-relaxed">{propertyDescription}</p>
      </div>

      {/* Amenities */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">What this place offers</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {amenities.map((amenity, index) => (
            <div key={index} className="flex items-center gap-3">
              <amenity.icon size={20} className="text-gray-600" />
              <span className="text-gray-700">{amenity.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Host Information */}
      {propertyOwner && (
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Meet your host</h2>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
              {propertyOwner.length >= 4
                ? propertyOwner.slice(2, 4).toUpperCase()
                : "??"}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                Host: {truncateAddress(propertyOwner)}
              </h3>
              <p className="text-sm text-gray-600">Joined in 2024</p>
            </div>
          </div>
        </div>
      )}

      {/* Booking Section */}
      <div className="sticky bottom-0 bg-white border-t p-4 flex items-center justify-between shadow-lg">
        <div>
          <div className="text-lg font-bold text-blue-600">
            {pricePerNight} ETH
            <span className="text-sm font-normal text-gray-500">
              {" "}
              per night
            </span>
          </div>
        </div>
        <Button
          onClick={() => setShowBookingModal(true)}
          variant="primary"
          size="lg"
          className="flex items-center gap-2"
        >
          <Calendar size={16} />
          Book Now
        </Button>
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <BookingModal
          isOpen={showBookingModal}
          onClose={() => setShowBookingModal(false)}
          property={property}
          onBookingCreated={() => {
            setShowBookingModal(false);
            // You could add a success message or redirect here
          }}
        />
      )}
    </div>
  );
};
