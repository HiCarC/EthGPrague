import pkg from "hardhat";
const { ethers } = pkg;

// Sample test properties data
const testProperties = [
  {
    name: "Luxury Downtown Loft",
    description:
      "Modern loft in the heart of the city with stunning skyline views. Features high ceilings, exposed brick walls, and premium amenities.",
    location: "New York, NY",
    imageUrls: [
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600",
      "https://images.unsplash.com/photo-1560449752-fb6ac6282556?w=600",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600",
    ],
    pricePerNight: "0.05", // 0.05 ETH per night
    maxGuests: 4,
  },
  {
    name: "Cozy Beach House",
    description:
      "Perfect beachfront getaway with private beach access. Wake up to ocean views and fall asleep to the sound of waves.",
    location: "Malibu, CA",
    imageUrls: [
      "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=600",
      "https://images.unsplash.com/photo-1520637836862-4d197d17c55a?w=600",
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600",
    ],
    pricePerNight: "0.08", // 0.08 ETH per night
    maxGuests: 6,
  },
  {
    name: "Mountain Retreat Cabin",
    description:
      "Rustic cabin nestled in the mountains. Perfect for hiking, skiing, and enjoying nature. Hot tub and fireplace included.",
    location: "Aspen, CO",
    imageUrls: [
      "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=600",
      "https://images.unsplash.com/photo-1520637736862-4d197d17c55a?w=600",
    ],
    pricePerNight: "0.03", // 0.03 ETH per night
    maxGuests: 8,
  },
  {
    name: "Historic Brownstone",
    description:
      "Charming historic brownstone in a quiet neighborhood. Features original hardwood floors and period details.",
    location: "Boston, MA",
    imageUrls: [
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600",
      "https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=600",
    ],
    pricePerNight: "0.04", // 0.04 ETH per night
    maxGuests: 3,
  },
  {
    name: "Modern Minimalist Studio",
    description:
      "Sleek and stylish studio apartment in the arts district. Perfect for creative professionals and digital nomads.",
    location: "Los Angeles, CA",
    imageUrls: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600",
      "https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=600",
    ],
    pricePerNight: "0.06", // 0.06 ETH per night
    maxGuests: 2,
  },
];

async function main() {
  console.log("🏨 Creating test properties on the blockchain...\n");

  // Get the contract address from environment or use placeholder
  const contractAddress =
    process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
    "0x90b1D44c0f1b124CbF5020f30E9F107E4EfD60b1";

  if (
    contractAddress === "YOUR_CONTRACT_ADDRESS_HERE" ||
    contractAddress === "0x1234567890123456789012345678901234567890"
  ) {
    console.log("❌ Please update the contract address first!");
    console.log(
      "Deploy the contract and update NEXT_PUBLIC_CONTRACT_ADDRESS in .env.local"
    );
    return;
  }

  // Get the contract ABI (you'll need to import this after compilation)
  const contractABI = [
    "function createProperty(string memory name, string memory description, string memory location, string[] memory imageUrls, uint256 pricePerNight, uint256 maxGuests) external returns (uint256)",
    "function getAllActiveProperties() external view returns (tuple(uint256 id, address owner, string name, string description, string location, string[] imageUrls, uint256 pricePerNight, uint256 maxGuests, bool isActive, uint256 createdAt)[])",
  ];

  // Get signer
  const [deployer] = await ethers.getSigners();
  console.log("Creating properties with account:", deployer.address);

  // Connect to the deployed contract
  const hotelBooking = new ethers.Contract(
    contractAddress,
    contractABI,
    deployer
  );

  console.log("Connected to HotelBooking contract at:", contractAddress);
  console.log("\n📝 Creating test properties...\n");

  for (let i = 0; i < testProperties.length; i++) {
    const property = testProperties[i];

    try {
      console.log(`${i + 1}. Creating "${property.name}"...`);

      // Convert price to wei
      const priceInWei = ethers.parseEther(property.pricePerNight);

      // Create the property
      const tx = await hotelBooking.createProperty(
        property.name,
        property.description,
        property.location,
        property.imageUrls,
        priceInWei,
        property.maxGuests
      );

      console.log(`   ⏳ Transaction sent: ${tx.hash}`);

      // Wait for confirmation
      const receipt = await tx.wait();
      console.log(
        `   ✅ Property created! Gas used: ${receipt.gasUsed.toString()}`
      );
    } catch (error) {
      console.error(
        `   ❌ Failed to create "${property.name}":`,
        error.message
      );
    }

    console.log(""); // Empty line for readability
  }

  // Get all properties to verify
  try {
    console.log("📋 Fetching all created properties...");
    const allProperties = await hotelBooking.getAllActiveProperties();
    console.log(`✅ Total properties created: ${allProperties.length}`);

    allProperties.forEach((prop, index) => {
      console.log(
        `${index + 1}. ${prop.name} - ${ethers.formatEther(
          prop.pricePerNight
        )} ETH/night`
      );
    });
  } catch (error) {
    console.error("❌ Failed to fetch properties:", error.message);
  }
}

main()
  .then(() => {
    console.log("\n🎉 Test data creation completed!");
    console.log("Your booking app now has sample properties to browse.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error creating test data:", error);
    process.exit(1);
  });
