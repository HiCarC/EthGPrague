"use client";

import { useState, useEffect } from "react";
import { BookingService, Property } from "@/services/booking";
import { PropertyCard } from "@/components/PropertyCard";
import { CreatePropertyModal } from "@/components/CreatePropertyModal";
import { Button } from "@worldcoin/mini-apps-ui-kit-react";
import { Plus, Search, Filter, MapPin } from "lucide-react";

export const PropertyListings = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <div className="h-10 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
          <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse"></div>
        </div>

        {/* Properties grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-lg shadow-md overflow-hidden border"
            >
              <div className="h-48 bg-gray-200 animate-pulse"></div>
              <div className="p-4 space-y-3">
                <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                <div className="flex justify-between items-center">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3"></div>
                  <div className="h-8 bg-gray-200 rounded animate-pulse w-20"></div>
                </div>
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
        <Button onClick={loadProperties} variant="primary" size="lg">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Find Your Perfect Stay
          </h1>
          <p className="text-gray-600">
            Discover unique properties powered by blockchain technology
          </p>
        </div>

        {/* Search and actions */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="   w-full flex flex-row items-center ">
            <input
              type="text"
              placeholder="Search by name, location, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-4 h-5 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
            />
          </div>

          <div className="flex gap-2">
            <div
              onClick={() => setShowCreateModal(true)}
              className="w-full flex items-center justify-center gap-2 bg-black text-white p-3 rounded-lg cursor-pointer hover:bg-gray-800 disabled:bg-gray-400"
            >
              <Plus size={16} />
              List Property
            </div>
          </div>
        </div>
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
              className="text-blue-600 hover:text-blue-700 text-sm"
            >
              Clear search
            </button>
          )}
        </div>
      )}

      {/* Properties grid */}
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
                  variant="primary"
                  size="lg"
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
                  variant="primary"
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus size={16} className="mr-2" />
                  List Your Property
                </Button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.map((property) => (
            <PropertyCard
              key={property.id.toString()}
              property={property}
              onBookingUpdate={loadProperties}
            />
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
    </div>
  );
};
