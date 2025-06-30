"use client";

import { abi } from "@/app/abi";
import { publicClient } from "@/app/viem";
import { config } from "@/app/wagmi";
import { MyCampaignCard } from "@/components/MyCampaignCard";
import React, { useState } from "react";
import { getContract } from "viem";
import { useAccount, useWalletClient, useWriteContract } from "wagmi";
import { readContract } from "wagmi/actions";

export default function DashboardPage() {
  const account = useAccount();

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const contract = getContract({
    client: publicClient,
    abi: abi,
    address: "0x1E59c7be7f6C50bd6EEEcF0829759eCb866ed70C",
  });

  // Get Campaigns
  const [myCampaigns, setMyCampaigns] = useState<any[]>([]);
  const [isLoadingMyCampaigns, setIsLoadingMyCampaigns] =
    useState<boolean>(true);

  const fetchCampaigns = async () => {
    setIsLoadingMyCampaigns(true);
    try {
      const result = await readContract(config, {
        abi: abi,
        functionName: "getUserCampaigns",
        address: contract.address,
        args: [account?.address as string],
      });
      setMyCampaigns(result as any[]);
    } catch (error) {
      setMyCampaigns([]);
    } finally {
      setIsLoadingMyCampaigns(false);
    }
  };

  // Refetch function for modal
  const refetch = () => {
    fetchCampaigns();
  };

  // Fetch campaigns on mount and when account changes
  React.useEffect(() => {
    if (account?.address) {
      fetchCampaigns();
    }
  }, [account?.address]);

  return (
    <div className="mx-auto max-w-7xl px-4 mt-16 sm:px-6 lg:px-8">
      <div className="flex flex-row justify-between items-center mb-8">
        <p className="text-4xl font-semibold">Dashboard</p>
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded-md"
          onClick={() => setIsModalOpen(true)}
        >
          Create Campaign
        </button>
      </div>
      <p className="text-2xl font-semibold mb-4">My Campaigns:</p>
      <div className="grid grid-cols-3 gap-4">
        {!isLoadingMyCampaigns &&
          (myCampaigns && myCampaigns.length > 0 ? (
            myCampaigns.map((campaign, index) => (
              <MyCampaignCard
                key={index}
                contractAddress={campaign.campaignAddress}
              />
            ))
          ) : (
            <p>No campaigns</p>
          ))}
      </div>

      {isModalOpen && (
        <CreateCampaignModal
          setIsModalOpen={setIsModalOpen}
          refetch={refetch}
        />
      )}
    </div>
  );
}

type CreateCampaignModalProps = {
  setIsModalOpen: (value: boolean) => void;
  refetch: () => void;
};

const CreateCampaignModal = ({
  setIsModalOpen,
  refetch,
}: CreateCampaignModalProps) => {
  const { address } = useAccount();
  const [isCreating, setIsCreating] = useState(false);
  const [campaignName, setCampaignName] = useState("");
  const [campaignDescription, setCampaignDescription] = useState("");
  const [campaignGoal, setCampaignGoal] = useState(1);
  const [campaignDeadline, setCampaignDeadline] = useState(1);
  const { data: walletClient } = useWalletClient();

  const { writeContract } = useWriteContract();

  const handleCreateCampaign = async () => {
    if (!address || !walletClient) {
      alert("Please connect your wallet first");
      return;
    }

    setIsCreating(true);
    try {
      writeContract(
        {
          address: "0x1E59c7be7f6C50bd6EEEcF0829759eCb866ed70C",
          abi: abi,
          functionName: "createCampaign",
          args: [
            campaignName,
            campaignDescription,
            campaignGoal,
            campaignDeadline,
          ],
        },
        {
          onSuccess: (hash) => {
            publicClient.waitForTransactionReceipt({ hash }).then((receipt) => {
              if (receipt.status === "success") {
                alert("Campaign created successfully!");
                refetch();
                setIsModalOpen(false);
              }
            });
          },
          onError: (error) => {
            console.error(error);
            alert("Failed to create campaign");
          },
        }
      );
    } catch (error) {
      console.error(error);
      alert("Error creating campaign");
    } finally {
      setIsCreating(false);
    }
  };

  const handleCampaignGoal = (value: number) => {
    if (value < 1) {
      setCampaignGoal(1);
    } else {
      setCampaignGoal(value);
    }
  };

  const handleCampaignLengthhange = (value: number) => {
    if (value < 1) {
      setCampaignDeadline(1);
    } else {
      setCampaignDeadline(value);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center backdrop-blur-md">
      <div className="w-1/2 bg-slate-100 p-6 rounded-md">
        <div className="flex justify-between items-center mb-4">
          <p className="text-lg font-semibold">Create a Campaign</p>
          <button
            className="text-sm px-4 py-2 bg-slate-600 text-white rounded-md"
            onClick={() => setIsModalOpen(false)}
          >
            Close
          </button>
        </div>
        <div className="flex flex-col">
          <label>Campaign Name:</label>
          <input
            type="text"
            value={campaignName}
            onChange={(e) => setCampaignName(e.target.value)}
            placeholder="Campaign Name"
            className="mb-4 px-4 py-2 bg-slate-300 rounded-md"
          />
          <label>Campaign Description:</label>
          <textarea
            value={campaignDescription}
            onChange={(e) => setCampaignDescription(e.target.value)}
            placeholder="Campaign Description"
            className="mb-4 px-4 py-2 bg-slate-300 rounded-md"
          ></textarea>
          <label>Campaign Goal:</label>
          <input
            type="number"
            value={campaignGoal}
            onChange={(e) => handleCampaignGoal(parseInt(e.target.value))}
            className="mb-4 px-4 py-2 bg-slate-300 rounded-md"
          />
          <label>{`Campaign Length (Days)`}</label>
          <div className="flex space-x-4">
            <input
              type="number"
              value={campaignDeadline}
              onChange={(e) =>
                handleCampaignLengthhange(parseInt(e.target.value))
              }
              className="mb-4 px-4 py-2 bg-slate-300 rounded-md"
            />
          </div>

          <button
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md"
            onClick={handleCreateCampaign}
          >
            {isCreating ? "Creating Campaign..." : "Create Campaign"}
          </button>
        </div>
      </div>
    </div>
  );
};
