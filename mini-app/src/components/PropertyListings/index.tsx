"use client";

import { useState, useEffect } from "react";
import { BookingService, Property } from "@/services/booking";
import { CreatePropertyModal } from "@/components/CreatePropertyModal";
import { BookingModal } from "@/components/BookingModal";
import { Button } from "@worldcoin/mini-apps-ui-kit-react";
import {
  Plus,
  Search,
  Filter,
  MapPin,
  Users,
  Calendar,
  Heart,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatWeiToWld, truncateAddress } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";

export const PropertyListings = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(
    null
  );
  const [showBookingModal, setShowBookingModal] = useState(false);

  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedProperties = await BookingService.getAllActiveProperties();
      console.log("fetchedProperties", fetchedProperties);
      setProperties(fetchedProperties);
    } catch (error) {
      console.error("Error loading properties:", error);
      setError("Failed to load properties. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const filteredProperties = properties.filter(
    (property) =>
      property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleBookNow = (property: Property) => {
    setSelectedProperty(property);
    setShowBookingModal(true);
  };

  const PropertyCard = ({ property }: { property: Property }) => {
    const hasImages = property.imageUrls && property.imageUrls.length > 0;
    const pricePerNight = formatWeiToWld(property.pricePerNight);

    return (
      <div className="flex-shrink-0 w-72">
        <Link href={`/property/${property.id.toString()}`}>
          <div className="relative">
            <div className="w-full h-48 rounded-xl overflow-hidden bg-gray-200">
              {hasImages ? (
                <img
                  src={property.imageUrls[0]}
                  alt={property.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gradient-to-br from-gray-100 to-gray-200">
                  <MapPin className="w-12 h-12" />
                </div>
              )}
            </div>
            <Button
              variant="secondary"
              size="sm"
              className="absolute top-3 left-3 bg-white/90 text-gray-700 hover:bg-white text-xs px-2 py-1"
            >
              Guest favourite
            </Button>
            <Button
              variant="tertiary"
              size="sm"
              className="absolute top-3 right-3 text-gray-700 hover:bg-white/20 p-2"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // Handle wishlist toggle
              }}
            >
              <Heart className="w-5 h-5" />
            </Button>
          </div>
        </Link>
        <div className="mt-3">
          <h3 className="font-medium text-gray-900 truncate">
            {property.name}
          </h3>
          <p className="text-sm text-gray-600 truncate">{property.location}</p>
          <div className="flex items-center mt-1">
            <span className="text-gray-900 font-medium">
              {pricePerNight} WLD
            </span>
            <span className="text-gray-600 text-sm ml-1">per night</span>
            <div className="flex items-center ml-auto">
              <Star className="w-4 h-4 fill-current text-gray-900" />
              <span className="text-sm text-gray-900 ml-1">4.98</span>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.preventDefault();
              handleBookNow(property);
            }}
            className="mt-2 w-full bg-gray-900 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            Book now
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Loading skeletons */}
        <div className="flex space-x-4 overflow-x-auto pb-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex-shrink-0 w-72">
              <div className="w-full h-48 rounded-xl bg-gray-200 animate-pulse"></div>
              <div className="mt-3 space-y-2">
                <div className="h-5 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">{error}</div>
        <Button
          onClick={loadProperties}
          className="bg-gray-900 text-white hover:bg-gray-800"
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter */}
      <div className="flex items-center w-full gap-3">
        <div className="flex relative w-8/12">
          <input
            type="text"
            placeholder="Search properties..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
        </div>
        {/* <Button
          variant="secondary"
          size="sm"
          className="flex items-center gap-2"
        >
          <Filter className="w-4 h-4" />
          Filter
        </Button> */}
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-gray-900  text-white hover:bg-gray-800 flex items-center gap-2"
          size="sm"
          variant="primary"
        >
          <span className="text-white flex ">
            <Plus className="w-4 h-4" />
            List New
          </span>
        </Button>
      </div>

      {/* Results summary */}
      {searchTerm && (
        <div className="flex items-center justify-between">
          <div className="text-gray-600">
            {filteredProperties.length} properties found
            {searchTerm && (
              <span className="ml-1">
                for "<span className="font-medium">{searchTerm}</span>"
              </span>
            )}
          </div>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="text-gray-900 hover:text-gray-700 text-sm underline"
            >
              Clear search
            </button>
          )}
        </div>
      )}

      {/* Properties horizontal scroll */}
      {filteredProperties.length === 0 ? (
        <div className="text-center py-16">
          <div className="max-w-md mx-auto">
            <MapPin size={48} className="mx-auto text-gray-300 mb-4" />
            <div className="text-gray-500 mb-4 text-lg">
              {searchTerm
                ? "No properties found matching your search."
                : "No properties available yet."}
            </div>
            {searchTerm ? (
              <div className="space-y-3">
                <p className="text-gray-400 text-sm">
                  Try adjusting your search terms or browse all properties.
                </p>
                <Button
                  onClick={() => setSearchTerm("")}
                  className="bg-gray-900 text-white hover:bg-gray-800"
                >
                  Show All Properties
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-gray-400 text-sm">
                  Be the first to list a property on our platform!
                </p>
                <Button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-gray-900 text-white hover:bg-gray-800"
                >
                  <Plus size={16} className="mr-2" />
                  List Your Property
                </Button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex space-x-4 overflow-x-auto pb-2">
          {filteredProperties.map((property) => (
            <PropertyCard key={property.id.toString()} property={property} />
          ))}
        </div>
      )}

      {/* Create Property Modal */}
      <CreatePropertyModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          loadProperties();
        }}
        onPropertyCreated={loadProperties}
      />

      {/* Booking Modal */}
      {selectedProperty && (
        <BookingModal
          isOpen={showBookingModal}
          onClose={() => {
            setShowBookingModal(false);
            setSelectedProperty(null);
          }}
          property={selectedProperty}
          onBookingCreated={() => {
            setShowBookingModal(false);
            setSelectedProperty(null);
            loadProperties();
          }}
        />
      )}
    </div>
  );
};
