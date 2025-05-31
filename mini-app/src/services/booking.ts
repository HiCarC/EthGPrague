import { MiniKit } from "@worldcoin/minikit-js";
import { createPublicClient, http } from "viem";
import { defineChain } from "viem";
import HotelBookingPermit2ABI from "@/abi/HotelBookingPermit2ABI.json";
import { useWaitForTransactionReceipt } from "@worldcoin/minikit-react";

// WLD Token contract address on World Chain Mainnet
export const WLD_TOKEN_ADDRESS = "0x2cFc85d8E48F8EAB294be644d9E25C3030863003";

// Permit2 contract address on World Chain Mainnet
export const PERMIT2_ADDRESS = "0xF0882554ee924278806d708396F1a7975b732522";

// Define World Chain Testnet
const worldchainTestnet = defineChain({
  id: 4801,
  name: "World Chain Testnet",
  network: "worldchain-testnet",
  nativeCurrency: {
    decimals: 18,
    name: "World Token",
    symbol: "WLD",
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
const worldchainMainnet = defineChain({
  id: 480,
  name: "World Chain Mainnet",
  network: "worldchain-mainnet",
  nativeCurrency: {
    decimals: 18,
    name: "World Token",
    symbol: "WLD",
  },

  rpcUrls: {
    default: {
      http: ["https://worldchain-mainnet.g.alchemy.com/public"],
    },
  },
  blockExplorers: {
    default: {
      name: "Worldscan",
      url: "https://worldscan.org",
    },
  },
});

// Replace with your deployed contract address
export const HOTEL_BOOKING_CONTRACT_ADDRESS =
  "0x52295055E09Cb7252dBAce63AD2A261bdF5f5dC8";

// Public client for reading contract data
export const publicClient = createPublicClient({
  chain: worldchainMainnet,
  transport: http("https://worldchain-mainnet.g.alchemy.com/public"),
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

// Permit2 ABI for signature transfers
const PERMIT2_ABI = [
  {
    inputs: [
      {
        components: [
          { internalType: "address", name: "token", type: "address" },
          { internalType: "uint256", name: "amount", type: "uint256" },
        ],
        internalType: "struct IPermit2.TokenPermissions",
        name: "permitted",
        type: "tuple",
      },
      { internalType: "address", name: "spender", type: "address" },
      { internalType: "uint256", name: "nonce", type: "uint256" },
      { internalType: "uint256", name: "deadline", type: "uint256" },
    ],
    name: "signatureTransfer",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

export class BookingService {
  // Property Management
  static async createProperty(
    name: string,
    description: string,
    location: string,
    imageUrls: string[],
    pricePerNightInWld: string,
    maxGuests: number
  ): Promise<any> {
    try {
      const priceInWei = BigInt(
        Math.floor(parseFloat(pricePerNightInWld) * Math.pow(10, 18))
      );

      const { finalPayload } = await MiniKit.commandsAsync.sendTransaction({
        transaction: [
          {
            address: HOTEL_BOOKING_CONTRACT_ADDRESS,
            abi: HotelBookingPermit2ABI,
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
    pricePerNightInWld: string,
    maxGuests: number
  ): Promise<any> {
    try {
      const priceInWei = BigInt(
        Math.floor(parseFloat(pricePerNightInWld) * Math.pow(10, 18))
      );

      const { finalPayload } = await MiniKit.commandsAsync.sendTransaction({
        transaction: [
          {
            address: HOTEL_BOOKING_CONTRACT_ADDRESS,
            abi: HotelBookingPermit2ABI,
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
            abi: HotelBookingPermit2ABI,
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
            abi: HotelBookingPermit2ABI,
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

  // Booking Functions with Permit2
  static async createBooking(
    propertyId: string,
    checkInDate: Date,
    checkOutDate: Date,
    guestCount: number,
    totalAmountInWld: string
  ): Promise<any> {
    try {
      const totalAmountInWei = BigInt((0.5 * 10 ** 18).toString());

      console.log("Creating booking with Permit2...");
      console.log("Total amount in WLD:", totalAmountInWld);
      console.log("Total amount in Wei:", totalAmountInWei.toString());

      // Create permit for Permit2 signature transfer
      const currentTime = Math.floor(Date.now() / 1000);
      const deadline = currentTime + 30 * 60; // 30 minutes from now
      const nonce = Math.floor(Math.random() * 1000000); // Random nonce

      console.log("Permit parameters:", {
        amount: (0.5 * 10 ** 18).toString(),
        nonce: nonce.toString(),
        deadline: deadline.toString(),
      });

      const { finalPayload } = await MiniKit.commandsAsync.sendTransaction({
        transaction: [
          {
            address: HOTEL_BOOKING_CONTRACT_ADDRESS,
            abi: HotelBookingPermit2ABI,
            functionName: "createBookingWithPermit2",
            args: [
              propertyId,
              Math.floor(checkInDate.getTime() / 1000),
              Math.floor(checkOutDate.getTime() / 1000),
              guestCount,
              (0.5 * 10 ** 18).toString(),
              [
                (0.5 * 10 ** 18).toString(),
                nonce.toString(), // nonce
                deadline.toString(), // deadline
              ],
              "PERMIT2_SIGNATURE_PLACEHOLDER_0", // This will be replaced with the actual signature
            ],
          },
        ],
        permit2: [
          {
            permitted: {
              token: WLD_TOKEN_ADDRESS,
              amount: totalAmountInWei.toString(),
            },
            spender: HOTEL_BOOKING_CONTRACT_ADDRESS,
            nonce: nonce.toString(),
            deadline: deadline.toString(),
          },
        ],
      });

      console.log("Booking created successfully:", finalPayload);
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
            abi: HotelBookingPermit2ABI,
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
            abi: HotelBookingPermit2ABI,
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
            abi: HotelBookingPermit2ABI,
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
            abi: HotelBookingPermit2ABI,
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
        abi: HotelBookingPermit2ABI,
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
        abi: HotelBookingPermit2ABI,
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
        abi: HotelBookingPermit2ABI,
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
        abi: HotelBookingPermit2ABI,
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
        abi: HotelBookingPermit2ABI,
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
        abi: HotelBookingPermit2ABI,
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
        abi: HotelBookingPermit2ABI,
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
