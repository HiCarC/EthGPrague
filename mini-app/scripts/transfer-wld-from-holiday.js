import pkg from "hardhat";
const { ethers } = pkg;

async function main() {
  console.log("🎄 Transferring WLD from Holiday contract...\n");

  // Contract addresses
  const HOLIDAY_CONTRACT = "0x90b1D44c0f1b124CbF5020f30E9F107E4EfD60b1";
  const DESTINATION_ADDRESS = "0xc32436ad125a48bf568d3f0623550f160bbc72d7";
  const WLD_TOKEN_ADDRESS = "0x2cFc85d8E48F8EAB294be644d9E25C3030863003";

  // Verify environment setup
  if (!process.env.PRIVATE_KEY) {
    console.error("❌ PRIVATE_KEY not found in environment variables");
    process.exit(1);
  }

  // Get network info
  const network = await ethers.provider.getNetwork();
  console.log(
    `📡 Connected to network: ${network.name} (Chain ID: ${network.chainId})`
  );

  if (network.chainId !== 480n) {
    console.error("❌ Not connected to World Chain Mainnet (Chain ID: 480)");
    process.exit(1);
  }

  // Get the signer
  const [signer] = await ethers.getSigners();
  console.log("🔑 Using account:", signer.address);

  const balance = await signer.provider.getBalance(signer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH\n");

  try {
    // WLD Token ABI for checking balance
    const wldAbi = [
      "function balanceOf(address account) external view returns (uint256)",
      "function transfer(address to, uint256 amount) external returns (bool)",
      "function decimals() external view returns (uint8)",
    ];

    const wldToken = new ethers.Contract(WLD_TOKEN_ADDRESS, wldAbi, signer);

    // Check WLD balance in Holiday contract
    console.log("🔍 Checking WLD balance in Holiday contract...");
    const wldBalance = await wldToken.balanceOf(HOLIDAY_CONTRACT);
    const decimals = await wldToken.decimals();
    const formattedBalance = ethers.formatUnits(wldBalance, decimals);

    console.log(`📍 Holiday Contract: ${HOLIDAY_CONTRACT}`);
    console.log(`💰 WLD Balance: ${formattedBalance} WLD`);
    console.log(`📍 Destination: ${DESTINATION_ADDRESS}\n`);

    if (wldBalance === 0n) {
      console.log("ℹ️  No WLD tokens found in the Holiday contract.");
      return;
    }

    // Try to get the Holiday contract code to understand its structure
    console.log("🔍 Analyzing Holiday contract...");
    const contractCode = await ethers.provider.getCode(HOLIDAY_CONTRACT);

    if (contractCode === "0x") {
      console.error("❌ No contract found at the specified address");
      return;
    }

    console.log("✅ Contract found at address");

    // Common contract ABIs to try
    const commonWithdrawMethods = [
      // Emergency withdraw (common in many contracts)
      "function emergencyWithdraw() external",
      "function emergencyWithdraw(address token) external",
      "function emergencyWithdraw(address token, address to) external",

      // Withdraw WLD
      "function withdrawWLD() external",
      "function withdrawWLD(address to) external",
      "function withdrawWLD(uint256 amount) external",
      "function withdrawWLD(uint256 amount, address to) external",

      // Generic withdraw
      "function withdraw() external",
      "function withdraw(address token) external",
      "function withdraw(address token, uint256 amount) external",
      "function withdraw(address token, uint256 amount, address to) external",

      // Transfer functions
      "function transferWLD(address to, uint256 amount) external",
      "function transferTokens(address token, address to, uint256 amount) external",

      // Owner functions
      "function owner() external view returns (address)",
      "function platformOwner() external view returns (address)",
    ];

    // Try to create contract instance and call appropriate function
    let success = false;

    for (const methodSignature of commonWithdrawMethods) {
      try {
        console.log(`🔄 Trying method: ${methodSignature.split("(")[0]}...`);

        const holidayContract = new ethers.Contract(
          HOLIDAY_CONTRACT,
          [methodSignature],
          signer
        );

        let tx;
        const methodName = methodSignature.split("(")[0].split(" ")[1];

        // Try different parameter combinations based on the method signature
        if (methodSignature.includes("emergencyWithdraw()")) {
          tx = await holidayContract.emergencyWithdraw();
        } else if (
          methodSignature.includes("emergencyWithdraw(address token)")
        ) {
          tx = await holidayContract.emergencyWithdraw(WLD_TOKEN_ADDRESS);
        } else if (
          methodSignature.includes(
            "emergencyWithdraw(address token, address to)"
          )
        ) {
          tx = await holidayContract.emergencyWithdraw(
            WLD_TOKEN_ADDRESS,
            DESTINATION_ADDRESS
          );
        } else if (methodSignature.includes("withdrawWLD()")) {
          tx = await holidayContract.withdrawWLD();
        } else if (methodSignature.includes("withdrawWLD(address to)")) {
          tx = await holidayContract.withdrawWLD(DESTINATION_ADDRESS);
        } else if (methodSignature.includes("withdrawWLD(uint256 amount)")) {
          tx = await holidayContract.withdrawWLD(wldBalance);
        } else if (
          methodSignature.includes("withdrawWLD(uint256 amount, address to)")
        ) {
          tx = await holidayContract.withdrawWLD(
            wldBalance,
            DESTINATION_ADDRESS
          );
        } else if (methodSignature.includes("withdraw()")) {
          tx = await holidayContract.withdraw();
        } else if (methodSignature.includes("withdraw(address token)")) {
          tx = await holidayContract.withdraw(WLD_TOKEN_ADDRESS);
        } else if (
          methodSignature.includes("withdraw(address token, uint256 amount)")
        ) {
          tx = await holidayContract.withdraw(WLD_TOKEN_ADDRESS, wldBalance);
        } else if (
          methodSignature.includes(
            "withdraw(address token, uint256 amount, address to)"
          )
        ) {
          tx = await holidayContract.withdraw(
            WLD_TOKEN_ADDRESS,
            wldBalance,
            DESTINATION_ADDRESS
          );
        } else if (
          methodSignature.includes("transferWLD(address to, uint256 amount)")
        ) {
          tx = await holidayContract.transferWLD(
            DESTINATION_ADDRESS,
            wldBalance
          );
        } else if (
          methodSignature.includes(
            "transferTokens(address token, address to, uint256 amount)"
          )
        ) {
          tx = await holidayContract.transferTokens(
            WLD_TOKEN_ADDRESS,
            DESTINATION_ADDRESS,
            wldBalance
          );
        } else {
          continue; // Skip view functions for now
        }

        console.log("⏳ Transaction submitted, waiting for confirmation...");
        const receipt = await tx.wait();

        console.log("✅ Transaction successful!");
        console.log(`🔗 Transaction hash: ${receipt.hash}`);

        // Check new balances
        const newContractBalance = await wldToken.balanceOf(HOLIDAY_CONTRACT);
        const destinationBalance = await wldToken.balanceOf(
          DESTINATION_ADDRESS
        );

        console.log(`\n📊 Updated Balances:`);
        console.log(
          `   Holiday Contract: ${ethers.formatUnits(
            newContractBalance,
            decimals
          )} WLD`
        );
        console.log(
          `   Destination: ${ethers.formatUnits(
            destinationBalance,
            decimals
          )} WLD`
        );

        success = true;
        break;
      } catch (error) {
        // Continue to next method
        console.log(`❌ Method failed: ${error.message.split("(")[0]}`);
        continue;
      }
    }

    if (!success) {
      console.log("\n❌ Could not find a working withdraw/transfer method.");
      console.log("\n💡 Possible solutions:");
      console.log("1. The contract might have a different method name");
      console.log("2. You might not be the owner/authorized user");
      console.log(
        "3. The contract might have specific conditions for withdrawal"
      );
      console.log(
        "\nPlease provide the Holiday contract ABI or source code for precise interaction."
      );

      // Try to check if user is owner
      try {
        const ownerAbi = ["function owner() external view returns (address)"];
        const holidayContract = new ethers.Contract(
          HOLIDAY_CONTRACT,
          ownerAbi,
          signer
        );
        const owner = await holidayContract.owner();
        console.log(`\n🔍 Contract owner: ${owner}`);
        console.log(`🔍 Your address: ${signer.address}`);
        console.log(
          `🔍 Are you owner: ${
            owner.toLowerCase() === signer.address.toLowerCase()
          }`
        );
      } catch (e) {
        console.log("\n❓ Could not determine contract owner");
      }
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
    throw error;
  }
}

main()
  .then(() => {
    console.log("\n🎉 Script completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Fatal error:", error);
    process.exit(1);
  });
