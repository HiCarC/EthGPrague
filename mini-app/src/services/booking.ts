import { MiniKit } from "@worldcoin/minikit-js";
import { createPublicClient, http } from "viem";
import { defineChain } from "viem";
import HotelBookingABI from "@/abi/HotelBookingABI.json";

// Define World Chain Testnet
const worldchainTestnet = defineChain({
  id: 4801,
  name: "World Chain Testnet",
  network: "worldchain-testnet",
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: ["https://worldchain-sepolia.g.alchemy.com/public"],
    },
  },
  blockExplorers: {
    default: {
      name: "Worldscan",
      url: "https://worldscan.org",
    },
  },
  testnet: true,
});

// Replace with your deployed contract address
export const HOTEL_BOOKING_CONTRACT_ADDRESS =
  "0xe97576A27CBCdBAA108a82D95E00A505043C6424";

// Public client for reading contract data
export const publicClient = createPublicClient({
  chain: worldchainTestnet,
  transport: http("https://worldchain-sepolia.g.alchemy.com/public"),
});

export interface Property {
  id: bigint;
  owner: string;
  name: string;
  description: string;
  location: string;
  imageUrls: string[];
  pricePerNight: bigint;
  maxGuests: bigint;
  isActive: boolean;
  createdAt: bigint;
}

export interface Booking {
  id: bigint;
  propertyId: bigint;
  guest: string;
  checkInDate: bigint;
  checkOutDate: bigint;
  totalAmount: bigint;
  guestCount: bigint;
  status: number; // BookingStatus enum
  createdAt: bigint;
}

export class BookingService {
  // Property Management
  static async createProperty(
    name: string,
    description: string,
    location: string,
    imageUrls: string[],
    pricePerNightInEth: string,
    maxGuests: number
  ): Promise<any> {
    try {
      const priceInWei = BigInt(
        Math.floor(parseFloat(pricePerNightInEth) * Math.pow(10, 18))
      );

      const { finalPayload } = await MiniKit.commandsAsync.sendTransaction({
        transaction: [
          {
            address: HOTEL_BOOKING_CONTRACT_ADDRESS,
            abi: HotelBookingABI,
            functionName: "createProperty",
            args: [
              name,
              description,
              location,
              imageUrls,
              priceInWei.toString(),
              maxGuests,
            ],
          },
        ],
      });

      return finalPayload;
    } catch (error) {
      console.error("Error creating property:", error);
      throw error;
    }
  }

  static async updateProperty(
    propertyId: string,
    name: string,
    description: string,
    location: string,
    imageUrls: string[],
    pricePerNightInEth: string,
    maxGuests: number
  ): Promise<any> {
    try {
      const priceInWei = BigInt(
        Math.floor(parseFloat(pricePerNightInEth) * Math.pow(10, 18))
      );

      const { finalPayload } = await MiniKit.commandsAsync.sendTransaction({
        transaction: [
          {
            address: HOTEL_BOOKING_CONTRACT_ADDRESS,
            abi: HotelBookingABI,
            functionName: "updateProperty",
            args: [
              propertyId,
              name,
              description,
              location,
              imageUrls,
              priceInWei.toString(),
              maxGuests,
            ],
          },
        ],
      });

      return finalPayload;
    } catch (error) {
      console.error("Error updating property:", error);
      throw error;
    }
  }

  static async deactivateProperty(propertyId: string): Promise<any> {
    try {
      const { finalPayload } = await MiniKit.commandsAsync.sendTransaction({
        transaction: [
          {
            address: HOTEL_BOOKING_CONTRACT_ADDRESS,
            abi: HotelBookingABI,
            functionName: "deactivateProperty",
            args: [propertyId],
          },
        ],
      });

      return finalPayload;
    } catch (error) {
      console.error("Error deactivating property:", error);
      throw error;
    }
  }

  static async activateProperty(propertyId: string): Promise<any> {
    try {
      const { finalPayload } = await MiniKit.commandsAsync.sendTransaction({
        transaction: [
          {
            address: HOTEL_BOOKING_CONTRACT_ADDRESS,
            abi: HotelBookingABI,
            functionName: "activateProperty",
            args: [propertyId],
          },
        ],
      });

      return finalPayload;
    } catch (error) {
      console.error("Error activating property:", error);
      throw error;
    }
  }

  // Booking Management
  static async createBooking(
    propertyId: string,
    checkInDate: Date,
    checkOutDate: Date,
    guestCount: number,
    totalAmountInEth: string
  ): Promise<any> {
    try {
      const checkInTimestamp = Math.floor(checkInDate.getTime() / 1000);
      const checkOutTimestamp = Math.floor(checkOutDate.getTime() / 1000);
      const totalAmountInWei = BigInt(
        Math.floor(parseFloat(totalAmountInEth) * Math.pow(10, 18))
      );

      const { finalPayload } = await MiniKit.commandsAsync.sendTransaction({
        transaction: [
          {
            address: HOTEL_BOOKING_CONTRACT_ADDRESS,
            abi: HotelBookingABI,
            functionName: "createBooking",
            args: [propertyId, checkInTimestamp, checkOutTimestamp, guestCount],
            value: totalAmountInWei.toString(),
          },
        ],
      });

      return finalPayload;
    } catch (error) {
      console.error("Error creating booking:", error);
      throw error;
    }
  }

  static async confirmBooking(bookingId: string): Promise<any> {
    try {
      const { finalPayload } = await MiniKit.commandsAsync.sendTransaction({
        transaction: [
          {
            address: HOTEL_BOOKING_CONTRACT_ADDRESS,
            abi: HotelBookingABI,
            functionName: "confirmBooking",
            args: [bookingId],
          },
        ],
      });

      return finalPayload;
    } catch (error) {
      console.error("Error confirming booking:", error);
      throw error;
    }
  }

  static async cancelBooking(bookingId: string): Promise<any> {
    try {
      const { finalPayload } = await MiniKit.commandsAsync.sendTransaction({
        transaction: [
          {
            address: HOTEL_BOOKING_CONTRACT_ADDRESS,
            abi: HotelBookingABI,
            functionName: "cancelBooking",
            args: [bookingId],
          },
        ],
      });

      return finalPayload;
    } catch (error) {
      console.error("Error cancelling booking:", error);
      throw error;
    }
  }

  static async checkIn(bookingId: string): Promise<any> {
    try {
      const { finalPayload } = await MiniKit.commandsAsync.sendTransaction({
        transaction: [
          {
            address: HOTEL_BOOKING_CONTRACT_ADDRESS,
            abi: HotelBookingABI,
            functionName: "checkIn",
            args: [bookingId],
          },
        ],
      });

      return finalPayload;
    } catch (error) {
      console.error("Error checking in:", error);
      throw error;
    }
  }

  static async checkOut(bookingId: string): Promise<any> {
    try {
      const { finalPayload } = await MiniKit.commandsAsync.sendTransaction({
        transaction: [
          {
            address: HOTEL_BOOKING_CONTRACT_ADDRESS,
            abi: HotelBookingABI,
            functionName: "checkOut",
            args: [bookingId],
          },
        ],
      });

      return finalPayload;
    } catch (error) {
      console.error("Error checking out:", error);
      throw error;
    }
  }

  // Read Functions
  static async getAllActiveProperties(): Promise<Property[]> {
    try {
      const properties = (await publicClient.readContract({
        address: HOTEL_BOOKING_CONTRACT_ADDRESS as `0x${string}`,
        abi: HotelBookingABI,
        functionName: "getAllActiveProperties",
      })) as Property[];

      return properties;
    } catch (error) {
      console.error("Error fetching properties:", error);
      return [];
    }
  }

  static async getProperty(propertyId: string): Promise<Property | null> {
    try {
      const property = (await publicClient.readContract({
        address: HOTEL_BOOKING_CONTRACT_ADDRESS as `0x${string}`,
        abi: HotelBookingABI,
        functionName: "getProperty",
        args: [propertyId],
      })) as Property;

      return property;
    } catch (error) {
      console.error("Error fetching property:", error);
      return null;
    }
  }

  static async getOwnerProperties(ownerAddress: string): Promise<string[]> {
    try {
      const propertyIds = (await publicClient.readContract({
        address: HOTEL_BOOKING_CONTRACT_ADDRESS as `0x${string}`,
        abi: HotelBookingABI,
        functionName: "getOwnerProperties",
        args: [ownerAddress],
      })) as bigint[];

      return propertyIds.map((id) => id.toString());
    } catch (error) {
      console.error("Error fetching owner properties:", error);
      return [];
    }
  }

  static async getGuestBookings(guestAddress: string): Promise<string[]> {
    try {
      const bookingIds = (await publicClient.readContract({
        address: HOTEL_BOOKING_CONTRACT_ADDRESS as `0x${string}`,
        abi: HotelBookingABI,
        functionName: "getGuestBookings",
        args: [guestAddress],
      })) as bigint[];

      return bookingIds.map((id) => id.toString());
    } catch (error) {
      console.error("Error fetching guest bookings:", error);
      return [];
    }
  }

  static async getBooking(bookingId: string): Promise<Booking | null> {
    try {
      const booking = (await publicClient.readContract({
        address: HOTEL_BOOKING_CONTRACT_ADDRESS as `0x${string}`,
        abi: HotelBookingABI,
        functionName: "getBooking",
        args: [bookingId],
      })) as Booking;

      return booking;
    } catch (error) {
      console.error("Error fetching booking:", error);
      return null;
    }
  }

  static async getPropertyBookings(propertyId: string): Promise<string[]> {
    try {
      const bookingIds = (await publicClient.readContract({
        address: HOTEL_BOOKING_CONTRACT_ADDRESS as `0x${string}`,
        abi: HotelBookingABI,
        functionName: "getPropertyBookings",
        args: [propertyId],
      })) as bigint[];

      return bookingIds.map((id) => id.toString());
    } catch (error) {
      console.error("Error fetching property bookings:", error);
      return [];
    }
  }

  static async isPropertyBooked(
    propertyId: string,
    checkInDate: Date,
    checkOutDate: Date
  ): Promise<boolean> {
    try {
      const checkInTimestamp = Math.floor(checkInDate.getTime() / 1000);
      const checkOutTimestamp = Math.floor(checkOutDate.getTime() / 1000);

      const isBooked = (await publicClient.readContract({
        address: HOTEL_BOOKING_CONTRACT_ADDRESS as `0x${string}`,
        abi: HotelBookingABI,
        functionName: "isPropertyBooked",
        args: [propertyId, checkInTimestamp, checkOutTimestamp],
      })) as boolean;

      return isBooked;
    } catch (error) {
      console.error("Error checking property availability:", error);
      return true; // Default to booked if error occurs
    }
  }
}
