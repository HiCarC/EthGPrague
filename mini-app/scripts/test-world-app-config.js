// Test script to verify World App configuration
console.log("🧪 World App Configuration Test");
console.log("================================");

const CONTRACT_ADDRESS = "0xc7663Be8fD3860cCd91D6e2D8ae94251258d8412";
const WLD_TOKEN = "0x2cFc85d8E48F8EAB294be644d9E25C3030863003";
const PERMIT2 = "0xF0882554ee924278806d708396F1a7975b732522";
const WORLD_APP_ID = "app_1280bf653c14c769c5e1915c5ac6e7a5";

console.log("📋 Configuration to Add to World App Developer Portal:");
console.log("-----------------------------------------------------");
console.log(`🏨 Hotel Contract: ${CONTRACT_ADDRESS}`);
console.log(`💰 WLD Token: ${WLD_TOKEN}`);
console.log(`🔐 Permit2: ${PERMIT2}`);
console.log(`📱 App ID: ${WORLD_APP_ID}`);

console.log("\n📝 Steps to Configure:");
console.log("1. Go to https://developer.worldcoin.org/");
console.log(`2. Select your app: ${WORLD_APP_ID}`);
console.log("3. Navigate to Configuration → Advanced");
console.log("4. Add all three addresses above to the allowlist");
console.log("5. Save changes");

console.log("\n⚠️  Common Issues:");
console.log("- Make sure to add ALL THREE addresses");
console.log("- Wait 2-3 minutes after saving for changes to take effect");
console.log("- Test in the World App simulator first");

console.log("\n🔍 Verification:");
console.log("- Contract deployed ✅");
console.log("- Addresses configured in portal ❓ (manual step)");
console.log("- Environment variables set ❓ (check .env.local)");

console.log("\n📱 Test Flow:");
console.log("1. Configure addresses in Developer Portal");
console.log("2. Add NEXT_PUBLIC_CONTRACT_ADDRESS to .env.local");
console.log("3. Restart your development server");
console.log("4. Test booking creation in World App");
