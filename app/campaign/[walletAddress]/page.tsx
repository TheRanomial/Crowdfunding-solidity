"use client";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { Address, getContract } from "viem";
import { baseSepolia } from "viem/chains";
import { TierCard } from "@/components/TierCard";
import { useParams } from "next/navigation";
import { useState } from "react";
import { campaignabi } from "@/app/campaignabi";

// Define your contract ABI
const campaignABI = campaignabi;

type Tier = {
  name: string;
  amount: bigint;
  backers: bigint;
};

export default function CampaignPage() {
  const { address, isConnected } = useAccount();
  const { walletAddress } = useParams();
  const [isEditing, setIsEditing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Name of the campaign
  const { data: name } = useReadContract({
    address: walletAddress as Address,
    abi: campaignABI,
    functionName: "name",
  }) as any;

  // Description of the campaign
  const { data: description } = useReadContract({
    address: walletAddress as Address,
    abi: campaignABI,
    functionName: "description",
  }) as any;

  // Campaign deadline
  const { data: deadline } = useReadContract({
    address: walletAddress as Address,
    abi: campaignABI,
    functionName: "deadline",
  }) as any;

  // Convert deadline to a date
  const deadlineDate = deadline ? new Date(Number(deadline) * 1000) : null;
  const hasDeadlinePassed = deadlineDate ? deadlineDate < new Date() : false;

  // Goal amount of the campaign
  const { data: goal } = useReadContract({
    address: walletAddress as Address,
    abi: campaignABI,
    functionName: "goal",
  }) as any;

  // Total funded balance of the campaign
  const { data: balance } = useReadContract({
    address: walletAddress as Address,
    abi: campaignABI,
    functionName: "getContractBalance",
  }) as any;

  // Calculate the total funded balance percentage
  const balanceNum = balance ? Number(balance) : 0;
  const goalNum = goal ? Number(goal) : 1; // Avoid division by zero
  const balancePercentage = Math.min((balanceNum / goalNum) * 100, 100);

  // Get tiers for the campaign
  const { data: tiers } = useReadContract({
    address: walletAddress as Address,
    abi: campaignABI,
    functionName: "getTiers",
  }) as any;

  console.log("Campaign Tiers:", tiers);

  // Get owner of the campaign
  const { data: owner } = useReadContract({
    address: walletAddress as Address,
    abi: campaignABI,
    functionName: "owner",
  });

  // Get status of the campaign
  const { data: status } = useReadContract({
    address: walletAddress as Address,
    abi: campaignABI,
    functionName: "state",
  });

  const { writeContract: withdraw } = useWriteContract();

  const handleWithdraw = () => {
    if (!isConnected) {
      alert("Please connect your wallet first");
      return;
    }

    withdraw(
      {
        address: walletAddress as Address,
        abi: campaignABI,
        functionName: "withdraw",
      },
      {
        onSuccess: () => alert("Funds withdrawn successfully!"),
        onError: (error) => alert(`Error: ${error.message}`),
      }
    );
  };

  const isOwner = owner === address;

  return (
    <div className="mx-auto max-w-7xl px-2 mt-4 sm:px-6 lg:px-8">
      <div className="flex flex-row justify-between items-center">
        <p className="text-4xl font-semibold">{name || "Loading..."}</p>
        {isOwner && (
          <div className="flex flex-row">
            {isEditing && (
              <div className="flex flex-row">
                <p className="px-4 py-2 bg-gray-500 text-white rounded-md mr-2">
                  Status:{" "}
                  {status === 0
                    ? "Active"
                    : status === 1
                    ? "Successful"
                    : status === 2
                    ? "Failed"
                    : "Unknown"}
                </p>
                {status === 1 && (
                  <button
                    className="px-4 py-2 bg-green-500 text-white rounded-md ml-2"
                    onClick={handleWithdraw}
                  >
                    Withdraw Funds
                  </button>
                )}
              </div>
            )}
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded-md"
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? "Done" : "Edit"}
            </button>
          </div>
        )}
      </div>

      <div className="my-4">
        <p className="text-lg font-semibold">Description:</p>
        <p>{description || "No description"}</p>
      </div>

      <div className="mb-4">
        <p className="text-lg font-semibold">Deadline</p>
        <p>{deadlineDate?.toDateString() || "Loading..."}</p>
      </div>

      <div className="mb-4">
        <p className="text-lg font-semibold">
          Campaign Goal: ${goal?.toString() || "0"}
        </p>
        <div className="relative w-full h-6 bg-gray-200 rounded-full dark:bg-gray-700">
          <div
            className="h-6 bg-blue-600 rounded-full dark:bg-blue-500 text-right"
            style={{ width: `${balancePercentage}%` }}
          >
            <p className="text-white dark:text-white text-xs p-1">
              ${balance?.toString() || "0"}
            </p>
          </div>
          <p className="absolute top-0 right-0 text-white dark:text-white text-xs p-1">
            {balancePercentage >= 100 ? "" : `${balancePercentage.toFixed(2)}%`}
          </p>
        </div>
      </div>

      <div>
        <p className="text-lg font-semibold">Tiers:</p>
        <div className="grid grid-cols-3 gap-4">
          {tiers && tiers.length > 0 ? (
            tiers.map((tier: Tier, index: number) => (
              <TierCard
                key={index}
                tier={{
                  name: tier.name,
                  amount: tier.amount,
                  backers: tier.backers,
                }}
                index={index}
                contractAddress={walletAddress as Address}
                isEditing={isEditing}
              />
            ))
          ) : (
            <p>{isEditing ? "No tiers yet" : "No tiers available"}</p>
          )}
          {isEditing && (
            <button
              className="max-w-sm flex flex-col text-center justify-center items-center font-semibold p-6 bg-blue-500 text-white border border-slate-100 rounded-lg shadow"
              onClick={() => setIsModalOpen(true)}
            >
              + Add Tier
            </button>
          )}
        </div>
      </div>

      {isModalOpen && (
        <CreateTierModal
          setIsModalOpen={setIsModalOpen}
          contractAddress={walletAddress as Address}
        />
      )}
    </div>
  );
}

type CreateTierModalProps = {
  setIsModalOpen: (value: boolean) => void;
  contractAddress: Address;
};

const CreateTierModal = ({
  setIsModalOpen,
  contractAddress,
}: CreateTierModalProps) => {
  const [tierName, setTierName] = useState("");
  const [tierAmount, setTierAmount] = useState("1");
  const { writeContract, isPending } = useWriteContract();

  const handleAddTier = () => {
    if (!tierName || !tierAmount) {
      alert("Please fill all fields");
      return;
    }

    writeContract(
      {
        address: contractAddress,
        abi: campaignABI,
        functionName: "addTier",
        args: [tierName, BigInt(tierAmount)],
      },
      {
        onSuccess: () => {
          alert("Tier added successfully!");
          setIsModalOpen(false);
        },
        onError: (error) => {
          alert(`Error: ${error.message}`);
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center backdrop-blur-md">
      <div className="w-1/2 p-6 rounded-md">
        <div className="flex justify-between items-center mb-4">
          <p className="text-lg font-semibold">Create a Funding Tier</p>
          <button
            className="text-sm px-4 py-2 bg-slate-600 text-white rounded-md"
            onClick={() => setIsModalOpen(false)}
          >
            Close
          </button>
        </div>
        <div className="flex flex-col">
          <label>Tier Name:</label>
          <input
            type="text"
            value={tierName}
            onChange={(e) => setTierName(e.target.value)}
            placeholder="Tier Name"
            className="mb-4 px-4 py-2 bg-slate-200 text-black rounded-md"
          />
          <label>Tier Cost:</label>
          <input
            type="number"
            value={tierAmount}
            onChange={(e) => setTierAmount(e.target.value)}
            className="mb-4 px-4 py-2 bg-slate-200 text-black rounded-md"
          />
          <button
            onClick={handleAddTier}
            disabled={isPending}
            className={`px-4 py-2 text-white rounded-md ${
              isPending ? "bg-blue-400" : "bg-blue-500 hover:bg-blue-600"
            }`}
          >
            {isPending ? "Adding..." : "Add Tier"}
          </button>
        </div>
      </div>
    </div>
  );
};
