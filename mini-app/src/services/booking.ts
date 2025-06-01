import { MiniKit } from "@worldcoin/minikit-js";
import { createPublicClient, http } from "viem";
import { defineChain } from "viem";
import HotelBookingABI from "@/abi/HotelBookingABI.json";

// WLD Token contract address on World Chain Mainnet
export const WLD_TOKEN_ADDRESS = "0x2cFc85d8E48F8EAB294be644d9E25C3030863003";

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
  "0x90b1D44c0f1b124CbF5020f30E9F107E4EfD60b1";

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

// ERC20 ABI for WLD token approval
const ERC20_ABI = [
  {
    inputs: [
      { internalType: "address", name: "spender", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "Transfer",
    type: "event",
  },
  {
    inputs: [
      { internalType: "address", name: "owner", type: "address" },
      { internalType: "address", name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
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

  // Booking Functions with Direct WLD Transfer
  static async createBooking(
    propertyId: string,
    checkInDate: Date,
    checkOutDate: Date,
    guestCount: number,
    totalAmountInWld: string
  ): Promise<any> {
    try {
      const totalAmountInWei = BigInt(
        Math.floor(parseFloat(totalAmountInWld) * Math.pow(10, 18))
      );

      console.log("Creating booking with direct WLD transfer...");
      console.log("Total amount in WLD:", totalAmountInWld);
      console.log("Total amount in Wei:", totalAmountInWei.toString());

      // First, approve the contract to spend WLD tokens
      // Then create the booking which will transfer the tokens
      const { finalPayload } = await MiniKit.commandsAsync.sendTransaction({
        transaction: [
          {
            address: HOTEL_BOOKING_CONTRACT_ADDRESS,
            abi: HotelBookingABI,
            functionName: "createBooking",
            args: [
              propertyId,
              Math.floor(checkInDate.getTime() / 1000),
              Math.floor(checkOutDate.getTime() / 1000),
              guestCount,
              totalAmountInWei.toString(),
            ],
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

  // Helper functions for WLD token operations
  static async getWldBalance(address: string): Promise<string> {
    try {
      const balance = (await publicClient.readContract({
        address: WLD_TOKEN_ADDRESS as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [address],
      })) as bigint;

      return (Number(balance) / Math.pow(10, 18)).toString();
    } catch (error) {
      console.error("Error fetching WLD balance:", error);
      return "0";
    }
  }

  static async getWldAllowance(
    owner: string,
    spender: string
  ): Promise<string> {
    try {
      const allowance = (await publicClient.readContract({
        address: WLD_TOKEN_ADDRESS as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "allowance",
        args: [owner, spender],
      })) as bigint;

      return (Number(allowance) / Math.pow(10, 18)).toString();
    } catch (error) {
      console.error("Error fetching WLD allowance:", error);
      return "0";
    }
  }

  static async approveWld(amountInWld: string): Promise<any> {
    try {
      const amountInWei = BigInt(
        Math.floor(parseFloat(amountInWld) * Math.pow(10, 18))
      );

      const { finalPayload } = await MiniKit.commandsAsync.sendTransaction({
        transaction: [
          {
            address: WLD_TOKEN_ADDRESS,
            abi: ERC20_ABI,
            functionName: "approve",
            args: [HOTEL_BOOKING_CONTRACT_ADDRESS, amountInWei.toString()],
          },
        ],
      });

      return finalPayload;
    } catch (error) {
      console.error("Error approving WLD:", error);
      throw error;
    }
  }
}
