import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  networks: {
    sepolia: {
      url: "https://eth-sepolia.g.alchemy.com/v2/vg6DD9GmduZ75YH8EMj0A5H8EwwZd61m",
      accounts: [
        "6a96c557e99c00bb3f16e003bcb0da095f023c1b8e81b2df6473d1f5787f145f",
      ],
    },
  },
  solidity: "0.8.28",
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};

export default config;
