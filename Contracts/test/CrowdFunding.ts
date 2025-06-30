import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("CrowdFunding", function () {
  async function deployCrowdFundingFixture() {
    const CAMPAIGN_DURATION = 7; // 7 days
    const CAMPAIGN_GOAL = hre.ethers.parseEther("10");
    const TIER_AMOUNT = hre.ethers.parseEther("1");

    const [owner, donor1, donor2] = await hre.ethers.getSigners();

    const CrowdFunding = await hre.ethers.getContractFactory("CrowdFunding");
    const crowdFunding = await CrowdFunding.deploy(
      owner.address,
      "Test Campaign",
      "Test Description",
      CAMPAIGN_GOAL,
      CAMPAIGN_DURATION
    );

    // Add a funding tier
    await crowdFunding.connect(owner).addTier("Standard", TIER_AMOUNT);

    return {
      crowdFunding,
      owner,
      donor1,
      donor2,
      CAMPAIGN_GOAL,
      CAMPAIGN_DURATION,
      TIER_AMOUNT,
    };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { crowdFunding, owner } = await loadFixture(
        deployCrowdFundingFixture
      );
      expect(await crowdFunding.owner()).to.equal(owner.address);
    });

    it("Should initialize with active state", async function () {
      const { crowdFunding } = await loadFixture(deployCrowdFundingFixture);
      expect(await crowdFunding.state()).to.equal(0); // CampaignState.active
    });

    it("Should set correct deadline", async function () {
      const { crowdFunding, CAMPAIGN_DURATION } = await loadFixture(
        deployCrowdFundingFixture
      );
      const blockTime = await time.latest();
      expect(await crowdFunding.deadline()).to.equal(
        blockTime + CAMPAIGN_DURATION * 24 * 60 * 60
      );
    });
  });

  describe("Tier Management", function () {
    it("Should allow owner to add tiers", async function () {
      const { crowdFunding, owner } = await loadFixture(
        deployCrowdFundingFixture
      );
      await expect(
        crowdFunding
          .connect(owner)
          .addTier("Premium", hre.ethers.parseEther("2"))
      ).to.emit(crowdFunding, "TierAdded");
    });

    it("Should prevent non-owners from adding tiers", async function () {
      const { crowdFunding, donor1 } = await loadFixture(
        deployCrowdFundingFixture
      );
      await expect(
        crowdFunding
          .connect(donor1)
          .addTier("Premium", hre.ethers.parseEther("2"))
      ).to.be.revertedWith("Only owner can withdraw");
    });

    it("Should allow owner to remove tiers", async function () {
      const { crowdFunding, owner } = await loadFixture(
        deployCrowdFundingFixture
      );
      await expect(crowdFunding.connect(owner).removeTier(0)).to.emit(
        crowdFunding,
        "TierRemoved"
      );
    });
  });

  describe("Funding", function () {
    it("Should accept correct funding amounts", async function () {
      const { crowdFunding, donor1, TIER_AMOUNT } = await loadFixture(
        deployCrowdFundingFixture
      );
      await expect(crowdFunding.connect(donor1).fund(0, { value: TIER_AMOUNT }))
        .to.emit(crowdFunding, "Funded")
        .to.changeEtherBalance(crowdFunding, TIER_AMOUNT);
    });

    it("Should reject incorrect funding amounts", async function () {
      const { crowdFunding, donor1, TIER_AMOUNT } = await loadFixture(
        deployCrowdFundingFixture
      );
      await expect(
        crowdFunding.connect(donor1).fund(0, { value: TIER_AMOUNT / 2n })
      ).to.be.revertedWith("Incorrect amount value");
    });

    it("Should track donators", async function () {
      const { crowdFunding, donor1, TIER_AMOUNT } = await loadFixture(
        deployCrowdFundingFixture
      );
      await crowdFunding.connect(donor1).fund(0, { value: TIER_AMOUNT });
      expect(await crowdFunding.hasDonated(donor1.address)).to.be.true;
    });
  });

  describe("State Transitions", function () {
    it("Should mark as successful when goal is reached", async function () {
      const { crowdFunding, donor1, donor2, CAMPAIGN_GOAL, TIER_AMOUNT } =
        await loadFixture(deployCrowdFundingFixture);

      // Fund enough to reach goal
      const donationsNeeded = Math.ceil(
        Number(CAMPAIGN_GOAL) / Number(TIER_AMOUNT)
      );
      for (let i = 0; i < donationsNeeded; i++) {
        await crowdFunding.connect(donor1).fund(0, { value: TIER_AMOUNT });
      }

      expect(await crowdFunding.state()).to.equal(1); // CampaignState.successful
    });

    it("Should mark as failed when deadline passes without reaching goal", async function () {
      const { crowdFunding, CAMPAIGN_DURATION } = await loadFixture(
        deployCrowdFundingFixture
      );

      // Fast forward past deadline
      await time.increase(CAMPAIGN_DURATION * 24 * 60 * 60 + 1);

      expect(await crowdFunding.state()).to.equal(2); // CampaignState.failed
    });
  });

  describe("Withdrawals", function () {
    it("Should allow owner to withdraw when successful", async function () {
      const { crowdFunding, owner, donor1, CAMPAIGN_GOAL, TIER_AMOUNT } =
        await loadFixture(deployCrowdFundingFixture);

      // Fund to reach goal
      const donationsNeeded = Math.ceil(
        Number(CAMPAIGN_GOAL) / Number(TIER_AMOUNT)
      );
      for (let i = 0; i < donationsNeeded; i++) {
        await crowdFunding.connect(donor1).fund(0, { value: TIER_AMOUNT });
      }

      await expect(
        crowdFunding.connect(owner).withdraw()
      ).to.changeEtherBalances(
        [owner, crowdFunding],
        [CAMPAIGN_GOAL, -CAMPAIGN_GOAL]
      );
    });

    it("Should prevent withdrawals when not successful", async function () {
      const { crowdFunding, owner } = await loadFixture(
        deployCrowdFundingFixture
      );
      await expect(crowdFunding.connect(owner).withdraw()).to.be.revertedWith(
        "Campaign not sucessful"
      );
    });
  });

  describe("Refunds", function () {
    it("Should allow refunds when campaign fails", async function () {
      const { crowdFunding, donor1, TIER_AMOUNT, CAMPAIGN_DURATION } =
        await loadFixture(deployCrowdFundingFixture);

      // Make a donation
      await crowdFunding.connect(donor1).fund(0, { value: TIER_AMOUNT });

      // Fast forward past deadline
      await time.increase(CAMPAIGN_DURATION * 24 * 60 * 60 + 1);

      await expect(crowdFunding.refundAll()).to.changeEtherBalance(
        donor1,
        TIER_AMOUNT
      );
    });
  });
});

describe("CrowdFundingFactory", function () {
  async function deployFactoryFixture() {
    const [owner, user1] = await hre.ethers.getSigners();

    const CrowdFundingFactory = await hre.ethers.getContractFactory(
      "CrowdFundingFactory"
    );
    const factory = await CrowdFundingFactory.deploy();

    return { factory, owner, user1 };
  }

  describe("Campaign Creation", function () {
    it("Should create new campaigns", async function () {
      const { factory, user1 } = await loadFixture(deployFactoryFixture);

      await expect(
        factory.connect(user1).createCampaign(
          "User Campaign",
          "User Description",
          hre.ethers.parseEther("5"),
          14 // 14 days
        )
      ).to.emit(factory, "CampaignCreated");
    });

    it("Should track user campaigns", async function () {
      const { factory, user1 } = await loadFixture(deployFactoryFixture);

      await factory
        .connect(user1)
        .createCampaign(
          "User Campaign",
          "User Description",
          hre.ethers.parseEther("5"),
          14
        );

      const userCampaigns = await factory.getUserCampaigns(user1.address);
      expect(userCampaigns.length).to.equal(1);
    });
  });

  describe("Pause Functionality", function () {
    it("Should allow owner to pause", async function () {
      const { factory, owner } = await loadFixture(deployFactoryFixture);
      await factory.connect(owner).togglePause();
      expect(await factory.paused()).to.be.true;
    });

    it("Should prevent campaign creation when paused", async function () {
      const { factory, owner, user1 } = await loadFixture(deployFactoryFixture);
      await factory.connect(owner).togglePause();

      await expect(
        factory
          .connect(user1)
          .createCampaign(
            "User Campaign",
            "User Description",
            hre.ethers.parseEther("5"),
            14
          )
      ).to.be.revertedWith("Campaigning is paused");
    });
  });
});
