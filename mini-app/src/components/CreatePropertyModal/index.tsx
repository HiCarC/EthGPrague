"use client";

import { useState } from "react";
import { BookingService } from "@/services/booking";
import { Button } from "@worldcoin/mini-apps-ui-kit-react";
import { X, Plus, Trash2, Building, CheckCircle } from "lucide-react";

interface CreatePropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPropertyCreated: () => void;
}

export const CreatePropertyModal = ({
  isOpen,
  onClose,
  onPropertyCreated,
}: CreatePropertyModalProps) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    location: "",
    pricePerNight: "",
    maxGuests: 1,
  });
  const [imageUrls, setImageUrls] = useState<string[]>([""]);
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addImageUrl = () => {
    setImageUrls((prev) => [...prev, ""]);
  };

  const removeImageUrl = (index: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const updateImageUrl = (index: number, url: string) => {
    setImageUrls((prev) => prev.map((item, i) => (i === index ? url : item)));
  };

  const handleSubmit = async () => {
    if (
      !formData.name ||
      !formData.description ||
      !formData.location ||
      !formData.pricePerNight
    ) {
      alert("Please fill in all required fields");
      return;
    }

    if (parseFloat(formData.pricePerNight) <= 0) {
      alert("Price per night must be greater than 0");
      return;
    }

    try {
      setLoading(true);

      const validImageUrls = imageUrls.filter((url) => url.trim() !== "");

      await BookingService.createProperty(
        formData.name,
        formData.description,
        formData.location,
        validImageUrls,
        formData.pricePerNight,
        formData.maxGuests
      );

      // Show success state
      setLoading(false);
      setIsSuccess(true);

      // Wait 5 seconds before closing and fetching properties
      setTimeout(() => {
        // Reset form
        setFormData({
          name: "",
          description: "",
          location: "",
          pricePerNight: "",
          maxGuests: 1,
        });
        setImageUrls([""]);
        setIsSuccess(false);
        onClose();
        onPropertyCreated();
      }, 5000);
    } catch (error) {
      console.error("Error creating property:", error);
      alert("Failed to create property. Please try again.");
      setLoading(false);
    }
  };

  // Success state UI
  if (isSuccess) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-lg w-full p-8">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <CheckCircle size={64} className="text-green-500" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900">
              Property Created Successfully!
            </h2>
            <p className="text-gray-600">
              Your property has been listed on the blockchain and will be
              visible to all users.
            </p>
            <div className="flex flex-col items-center space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <p className="text-sm text-gray-500">
                Refreshing properties list...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Building size={20} />
            List Your Property
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full"
            disabled={loading}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Property name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Property Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="e.g., Cozy Downtown Apartment"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location *
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => handleInputChange("location", e.target.value)}
              placeholder="e.g., New York, NY"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Describe your property, amenities, and what makes it special..."
              rows={3}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            />
          </div>

          {/* Price and guests */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price per Night (WLD) *
              </label>
              <input
                type="number"
                step="0.001"
                min="0"
                value={formData.pricePerNight}
                onChange={(e) =>
                  handleInputChange("pricePerNight", e.target.value)
                }
                placeholder="0.01"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Guests
              </label>
              <select
                value={formData.maxGuests}
                onChange={(e) =>
                  handleInputChange("maxGuests", parseInt(e.target.value))
                }
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              >
                {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                  <option key={num} value={num}>
                    {num} {num === 1 ? "Guest" : "Guests"}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Image URLs */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Property Images (URLs)
            </label>
            <div className="space-y-2">
              {imageUrls.map((url, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => updateImageUrl(index, e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={loading}
                  />
                  {imageUrls.length > 1 && (
                    <button
                      onClick={() => removeImageUrl(index)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      disabled={loading}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={addImageUrl}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm"
                disabled={loading}
              >
                <Plus size={16} />
                Add another image
              </button>
            </div>
          </div>

          {/* Submit button */}
          <Button
            onClick={handleSubmit}
            disabled={loading}
            variant="primary"
            size="lg"
            className="w-full flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Creating Property...
              </>
            ) : (
              <>
                <Building size={16} />
                List Property
              </>
            )}
          </Button>

          <div className="text-xs text-gray-500 text-center">
            Your property will be listed on the blockchain and visible to all
            users
          </div>
        </div>
      </div>
    </div>
  );
};
