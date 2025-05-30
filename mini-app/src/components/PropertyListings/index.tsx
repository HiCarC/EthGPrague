"use client";

import { useState, useEffect } from "react";
import { BookingService, Property } from "@/services/booking";
import { PropertyCard } from "@/components/PropertyCard";
import { CreatePropertyModal } from "@/components/CreatePropertyModal";
import { Button } from "@worldcoin/mini-apps-ui-kit-react";
import { Plus, Search } from "lucide-react";

export const PropertyListings = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    try {
      setLoading(true);
      const fetchedProperties = await BookingService.getAllActiveProperties();
      setProperties(fetchedProperties);
    } catch (error) {
      console.error("Error loading properties:", error);
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
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with search and create button */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Search properties..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          variant="primary"
          size="sm"
          className="flex items-center gap-2"
        >
          <Plus size={16} />
          List Property
        </Button>
      </div>

      {/* Properties grid */}
      {filteredProperties.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">
            {searchTerm
              ? "No properties found matching your search."
              : "No properties available yet."}
          </div>
          {!searchTerm && (
            <Button
              onClick={() => setShowCreateModal(true)}
              variant="primary"
              size="lg"
            >
              Be the first to list a property!
            </Button>
          )}
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
        onClose={() => setShowCreateModal(false)}
        onPropertyCreated={loadProperties}
      />
    </div>
  );
};
