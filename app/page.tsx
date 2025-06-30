"use client";

import { getContract } from "viem";
import { useReadContract } from "wagmi";
import { publicClient } from "./viem";
import { CampaignCard } from "@/components/CampaignCard";
import { abi } from "./abi";

export default function Home() {
  const { data: resultCampaigns, isLoading: isLoadingCampaigns } =
    useReadContract({
      abi: abi,
      functionName: "getAllCampaigns",
      address: "0x1E59c7be7f6C50bd6EEEcF0829759eCb866ed70C",
    });

  const campaigns = resultCampaigns as any[];

  return (
    <main className="mx-auto max-w-7xl px-4 mt-4 sm:px-6 lg:px-8">
      <div className="py-10">
        <h1 className="text-4xl font-bold mb-4">Campaigns:</h1>
        <div className="grid grid-cols-3 gap-4">
          {!isLoadingCampaigns &&
            campaigns &&
            (campaigns.length > 0 ? (
              campaigns.map((campaign) => (
                <CampaignCard
                  key={campaign.campaignAddress}
                  campaignAddress={campaign.campaignAddress}
                />
              ))
            ) : (
              <p>No Campaigns</p>
            ))}
        </div>
      </div>
    </main>
  );
}
