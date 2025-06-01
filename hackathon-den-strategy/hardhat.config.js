require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-verify");
require("dotenv").config();

module.exports = {
  solidity: {
    version: "0.8.26",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  paths: {
    sources: "./src",        // Make sure this points to your contracts
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  // ✅ Exclude problematic files from compilation
  contractSizer: {
    alphaSort: true,
    runOnCompile: true,
    disambiguatePaths: false,
  },
  // Ignore files that require upgradeable contracts
  ignore: [
    "src/core/**/*.sol",
    "src/dependencies/**/*.sol"
  ],
  networks: {
    berachain: {
      url: "https://rpc.berachain.com/",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 80094,
      gasPrice: 10000000000,
    }
  },
  etherscan: {
    apiKey: {
      berachain: "berachain"
    },
    customChains: [
      {
        network: "berachain",
        chainId: 80094,
        urls: {
          apiURL: "https://api.routescan.io/v2/network/mainnet/evm/80094/etherscan",
          browserURL: "https://beratrail.io/"
        }
      }
    ]
  }
}; 