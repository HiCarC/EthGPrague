import { MiniKit } from "@worldcoin/minikit-js";
import { createPublicClient, http } from "viem";
import { defineChain } from "viem";
import HotelBookingABI from "@/abi/HotelBookingABI.json";
import Permit2 from "@/abi/Permit2.json";
import { useWaitForTransactionReceipt } from "@worldcoin/minikit-react";
import { useState } from "react";

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
const [transactionId, setTransactionId] = useState<string>("");
// Replace with your deployed contract address
export const HOTEL_BOOKING_CONTRACT_ADDRESS =
  "0xe97576A27CBCdBAA108a82D95E00A505043C6424";

// Public client for reading contract data
export const publicClient = createPublicClient({
  chain: worldchainTestnet,
  transport: http("https://worldchain-sepolia.g.alchemy.com/public"),
});

// Constants for Permit2
const PERMIT2_ADDRESS = "0x000000000022D473030F116dDEE9F6B43aC78BA3"; // Canonical Permit2 address
const WETH_ADDRESS = "0x4200000000000000000000000000000000000006"; // WETH address on World Chain

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

export interface Permit2Transfer {
  permitted: {
    token: string;
    amount: string;
  };
  nonce: string;
  deadline: string;
}

export interface TransferDetails {
  to: string;
  requestedAmount: string;
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
      console.log("Error creating property:", error);
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
    totalAmountInEth: string,
    recipientAddress: string // Address to receive the payment (hotel owner or booking contract)
  ): Promise<any> {
    try {
      const checkInTimestamp = Math.floor(checkInDate.getTime() / 1000);
      const checkOutTimestamp = Math.floor(checkOutDate.getTime() / 1000);
      const totalAmountInWei = BigInt(
        Math.floor(parseFloat(totalAmountInEth) * Math.pow(10, 18))
      );

      // Permit2 setup - valid for 30 minutes
      const permitTransfer = {
        permitted: {
          token: WETH_ADDRESS, // Using WETH for the payment token
          amount: totalAmountInWei.toString(),
        },
        nonce: Date.now().toString(),
        deadline: Math.floor((Date.now() + 30 * 60 * 1000) / 1000).toString(), // 30 minutes from now
      };

      const transferDetails = {
        to: recipientAddress,
        requestedAmount: totalAmountInWei.toString(),
      };

      console.log("Permit2 Transaction details:", {
        propertyId,
        checkInTimestamp,
        checkOutTimestamp,
        guestCount,
        totalAmountInEth,
        totalAmountInWei: totalAmountInWei.toString(),
        permitTransfer,
        transferDetails,
      });

      const { isLoading: isConfirming, isSuccess: isConfirmed } =
        useWaitForTransactionReceipt({
          client: publicClient,
          appConfig: {
            app_id: "1234567890",
          },
          transactionId: transactionId,
        });

      const { finalPayload } = await MiniKit.commandsAsync.sendTransaction({
        transaction: [
          {
            address: PERMIT2_ADDRESS,
            abi: Permit2,
            functionName: "signatureTransfer",
            args: [
              [
                [
                  permitTransfer.permitted.token,
                  permitTransfer.permitted.amount,
                ],
                permitTransfer.nonce,
                permitTransfer.deadline,
              ],
              [transferDetails.to, transferDetails.requestedAmount],
              "PERMIT2_SIGNATURE_PLACEHOLDER_0", // This will be automatically replaced with the correct signature
            ],
          },
          {
            address: HOTEL_BOOKING_CONTRACT_ADDRESS,
            abi: HotelBookingABI,
            functionName: "createBooking",
            args: [propertyId, checkInTimestamp, checkOutTimestamp, guestCount],
            // Remove the value field since we're using Permit2 for payment
          },
        ],
        permit2: [
          {
            ...permitTransfer,
            spender: HOTEL_BOOKING_CONTRACT_ADDRESS, // The contract that will spend the tokens
          },
        ],
      });

      return finalPayload;
    } catch (error) {
      console.error("Error creating booking with Permit2:", error);
      throw error;
    }
  }

  // Alternative method for direct ETH payments (fallback)
  static async createBookingWithETH(
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

      // Convert value to hex string format that MiniKit expects
      const valueHex = `0x${totalAmountInWei.toString(16)}`;

      console.log("Direct ETH Transaction details:", {
        propertyId,
        checkInTimestamp,
        checkOutTimestamp,
        guestCount,
        totalAmountInEth,
        totalAmountInWei: totalAmountInWei.toString(),
        valueHex,
      });

      const { finalPayload } = await MiniKit.commandsAsync.sendTransaction({
        transaction: [
          {
            address: HOTEL_BOOKING_CONTRACT_ADDRESS,
            abi: HotelBookingABI,
            functionName: "createBooking",
            args: [propertyId, checkInTimestamp, checkOutTimestamp, guestCount],
            value: valueHex,
          },
        ],
      });

      return finalPayload;
    } catch (error) {
      console.error("Error creating booking with ETH:", error);
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
