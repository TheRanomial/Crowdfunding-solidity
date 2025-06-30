import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const CrowdFundingModule = buildModule("CrowdFundingModule", (m) => {
  // Test parameters
  const name = m.getParameter("name", "Test Campaign");
  const description = m.getParameter(
    "description",
    "A test crowdfunding campaign"
  );
  const goal = m.getParameter("goal", 1_000_000_000n); // 1 ETH in wei (adjust as needed)
  const duration = m.getParameter("duration", 86_400n); // 1 day in seconds

  const crowdFunding = m.contract("CrowdFunding", [
    name,
    description,
    goal,
    duration,
  ]);

  return { crowdFunding };
});

export default CrowdFundingModule;
