import pkg from "hardhat";
const { ethers } = pkg;

async function main() {
  console.log("🎯 Approving WLD Tokens for Permit2...\n");

  // Contract addresses on Worldchain mainnet
  const WLD_TOKEN = "0x2cFc85d8E48F8EAB294be644d9E25C3030863003";
  const PERMIT2 = "0xF0882554ee924278806d708396F1a7975b732522";

  console.log(`🪙 WLD Token: ${WLD_TOKEN}`);
  console.log(`🔑 Permit2: ${PERMIT2}\n`);

  // Connect to Worldchain mainnet
  const provider = new ethers.JsonRpcProvider(
    "https://worldchain-mainnet.g.alchemy.com/public"
  );
  console.log(`🌐 Connected to Worldchain mainnet`);
  const network = await provider.getNetwork();
  console.log(`📡 Network: ${network.name} (Chain ID: ${network.chainId})\n`);

  try {
    // You need to add your private key to .env file as PRIVATE_KEY
    if (!process.env.PRIVATE_KEY) {
      console.log("❌ No PRIVATE_KEY found in environment variables");
      console.log(
        "💡 Add your private key to .env file as PRIVATE_KEY=your_private_key_here"
      );
      console.log("⚠️  Make sure your .env file is in .gitignore!");
      return;
    }

    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    console.log(`👤 Wallet address: ${wallet.address}`);

    // Create WLD token contract instance
    const wldAbi = [
      "function balanceOf(address owner) view returns (uint256)",
      "function allowance(address owner, address spender) view returns (uint256)",
      "function approve(address spender, uint256 amount) returns (bool)",
      "function decimals() view returns (uint8)",
      "function symbol() view returns (string)",
    ];

    const wldContract = new ethers.Contract(WLD_TOKEN, wldAbi, wallet);

    // Check current balance and allowance
    console.log("📊 Current Status:");
    const balance = await wldContract.balanceOf(wallet.address);
    const currentAllowance = await wldContract.allowance(
      wallet.address,
      PERMIT2
    );

    console.log(`   WLD Balance: ${ethers.formatEther(balance)} WLD`);
    console.log(
      `   Current Allowance: ${ethers.formatEther(currentAllowance)} WLD`
    );

    if (balance === 0n) {
      console.log("❌ You have no WLD tokens to approve!");
      console.log("💡 Get some WLD tokens first before approving");
      return;
    }

    // Set approval amount (you can choose one of these options)
    const approvalOptions = [
      { name: "Unlimited", amount: ethers.MaxUint256 },
      { name: "100 WLD", amount: ethers.parseEther("100") },
      { name: "10 WLD", amount: ethers.parseEther("10") },
      { name: "1 WLD", amount: ethers.parseEther("1") },
    ];

    console.log("\n🎚️  Approval Options:");
    approvalOptions.forEach((option, index) => {
      console.log(
        `   ${index + 1}. ${option.name} (${
          option.amount === ethers.MaxUint256
            ? "Max"
            : ethers.formatEther(option.amount)
        } WLD)`
      );
    });

    // For this script, let's use 100 WLD as a reasonable amount
    const approvalAmount = ethers.parseEther("100");

    console.log(
      `\n🚀 Approving ${ethers.formatEther(approvalAmount)} WLD for Permit2...`
    );

    // Check if enough allowance already exists
    if (currentAllowance >= approvalAmount) {
      console.log(
        `✅ Sufficient allowance already exists (${ethers.formatEther(
          currentAllowance
        )} WLD)`
      );
      console.log("🎉 You should be able to make bookings now!");
      return;
    }

    // Send approval transaction
    console.log("📤 Sending approval transaction...");
    const tx = await wldContract.approve(PERMIT2, approvalAmount);
    console.log(`📋 Transaction hash: ${tx.hash}`);
    console.log("⏳ Waiting for confirmation...");

    const receipt = await tx.wait();
    console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);

    // Verify the approval
    const newAllowance = await wldContract.allowance(wallet.address, PERMIT2);
    console.log(`🎯 New allowance: ${ethers.formatEther(newAllowance)} WLD`);

    console.log("\n🎉 Success! Your WLD tokens are now approved for Permit2!");
    console.log("💡 You can now try creating bookings again.");
  } catch (error) {
    console.error("❌ Approval failed:", error.message);

    if (error.message.includes("insufficient funds")) {
      console.log("💡 You may need ETH for gas fees on Worldchain");
    } else if (error.message.includes("nonce")) {
      console.log("💡 Try again - there might be a nonce issue");
    }
  }
}

main().catch((error) => {
  console.error("💥 Script failed:", error);
  process.exit(1);
});
