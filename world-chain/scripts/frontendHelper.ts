import { ethers } from 'ethers';

export class WorldChainBookingSDK {
  private provider: ethers.Provider;
  private signer?: ethers.Signer;
  private factory: ethers.Contract;

  constructor(factoryAddress: string, provider: ethers.Provider, signer?: ethers.Signer) {
    this.provider = provider;
    this.signer = signer;
    this.factory = new ethers.Contract(factoryAddress, require('./abis/BookingPoolFactoryV2.json'), signer || provider);
  }

  // Easy-to-use methods for frontend
  async getAllProperties() {
    return await this.factory.getAllActiveProperties();
  }

  async getMyProperties(ownerAddress: string) {
    return await this.factory.getOwnerProperties(ownerAddress);
  }

  async getAllPools() {
    return await this.factory.getAllPools();
  }

  async createQuickBooking(
    propertyId: number,
    checkInDate: Date,
    checkOutDate: Date,
    participants: number,
    nights: number
  ) {
    if (!this.signer) throw new Error('Signer required for transactions');
    
    const bookingId = `BOOKING_${Date.now()}_${propertyId}`;
    
    return await this.factory.createBookingPoolForProperty(
      propertyId,
      bookingId,
      Math.floor(checkInDate.getTime() / 1000),
      Math.floor(checkOutDate.getTime() / 1000),
      participants,
      nights
    );
  }
} 