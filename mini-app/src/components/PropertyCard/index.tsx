"use client";

import { useState } from "react";
import Link from "next/link";
import { Property } from "@/services/booking";
import { formatWeiToEth, truncateAddress } from "@/lib/utils";
import { BookingModal } from "@/components/BookingModal";
import { Button } from "@worldcoin/mini-apps-ui-kit-react";
import { MapPin, Users, Calendar } from "lucide-react";

interface PropertyCardProps {
  property: Property;
  onBookingUpdate?: () => void;
}

export const PropertyCard = ({
  property,
  onBookingUpdate,
}: PropertyCardProps) => {
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const pricePerNight = formatWeiToEth(property.pricePerNight);
  const hasImages = property.imageUrls && property.imageUrls.length > 0;

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (hasImages) {
      setCurrentImageIndex((prev) => (prev + 1) % property.imageUrls.length);
    }
  };

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (hasImages) {
      setCurrentImageIndex((prev) =>
        prev === 0 ? property.imageUrls.length - 1 : prev - 1
      );
    }
  };

  const handleBookNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowBookingModal(true);
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1">
      {/* Image carousel - clickable */}
      <Link href={`/property/${property.id.toString()}`}>
        <div className="relative h-48 bg-gray-200 cursor-pointer">
          {hasImages ? (
            <>
              <img
                src={property.imageUrls[currentImageIndex]}
                alt={property.name}
                className="w-full h-full object-cover"
              />
              {property.imageUrls.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-1 hover:bg-opacity-70 transition-all z-10"
                  >
                    ←
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-1 hover:bg-opacity-70 transition-all z-10"
                  >
                    →
                  </button>
                  <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
                    {property.imageUrls.map((_, index) => (
                      <div
                        key={index}
                        className={`w-2 h-2 rounded-full ${
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
              No Image Available
            </div>
          )}
        </div>
      </Link>

      {/* Property details */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <Link href={`/property/${property.id.toString()}`}>
            <h3 className="text-lg font-semibold text-gray-900 truncate hover:text-blue-600 transition-colors cursor-pointer">
              {property.name}
            </h3>
          </Link>
          <div className="text-right">
            <div className="text-lg font-bold text-blue-600">
              {pricePerNight} ETH
            </div>
            <div className="text-sm text-gray-500">per night</div>
          </div>
        </div>

        <div className="flex items-center gap-1 text-gray-600 mb-2">
          <MapPin size={14} />
          <span className="text-sm truncate">{property.location}</span>
        </div>

        <div className="flex items-center gap-1 text-gray-600 mb-3">
          <Users size={14} />
          <span className="text-sm">
            Up to {property.maxGuests.toString()} guests
          </span>
        </div>

        <p className="text-gray-700 text-sm mb-4 line-clamp-2">
          {property.description}
        </p>

        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">
            Owner: {truncateAddress(property.owner)}
          </div>
          <Button
            onClick={handleBookNow}
            variant="primary"
            size="sm"
            className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            <Calendar size={14} />
            Book Now
          </Button>
        </div>
      </div>

      {/* Booking Modal */}
      <BookingModal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        property={property}
        onBookingCreated={() => {
          setShowBookingModal(false);
          onBookingUpdate?.();
        }}
      />
    </div>
  );
};
