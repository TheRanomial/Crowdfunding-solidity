import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const CrowdFundingFactoryModule = buildModule(
  "CrowdFundingFactoryModule",
  (m) => {
    const crowdFundingFactory = m.contract("CrowdFundingFactory", []);

    return { crowdFundingFactory };
  }
);

export default CrowdFundingFactoryModule;
