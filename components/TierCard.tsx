import { useAccount, useWriteContract } from "wagmi";
import { Address } from "viem";

type Tier = {
  name: string;
  amount: bigint;
  backers: bigint;
};

type TierCardProps = {
  tier: Tier;
  index: number;
  contractAddress: Address;
  isEditing: boolean;
};

export const TierCard: React.FC<TierCardProps> = ({
  tier,
  index,
  contractAddress,
  isEditing,
}) => {
  const { isConnected } = useAccount();
  const { writeContract, isPending: isFunding } = useWriteContract();
  const { writeContract: removeTier, isPending: isRemoving } =
    useWriteContract();

  const handleFund = () => {
    if (!isConnected) {
      alert("Please connect your wallet first");
      return;
    }

    writeContract(
      {
        address: contractAddress,
        abi: [
          {
            inputs: [
              { internalType: "uint256", name: "_tierIndex", type: "uint256" },
            ],
            name: "fund",
            outputs: [],
            stateMutability: "payable",
            type: "function",
          },
        ],
        functionName: "fund",
        args: [BigInt(index)],
        value: tier.amount,
      },
      {
        onSuccess: () => alert("Funded successfully!"),
        onError: (error) => alert(`Error: ${error.message}`),
      }
    );
  };

  const handleRemoveTier = () => {
    if (!isConnected) {
      alert("Please connect your wallet first");
      return;
    }

    removeTier(
      {
        address: contractAddress,
        abi: [
          {
            inputs: [
              { internalType: "uint256", name: "_index", type: "uint256" },
            ],
            name: "removeTier",
            outputs: [],
            stateMutability: "nonpayable",
            type: "function",
          },
        ],
        functionName: "removeTier",
        args: [BigInt(index)],
      },
      {
        onSuccess: () => alert("Tier removed successfully!"),
        onError: (error) => alert(`Error: ${error.message}`),
      }
    );
  };

  return (
    <div className="max-w-sm flex flex-col justify-between p-6 border border-slate-100 rounded-lg shadow">
      <div>
        <div className="flex flex-row justify-between items-center">
          <p className="text-2xl font-semibold">{tier.name}</p>
          <p className="text-2xl font-semibold">${tier.amount.toString()}</p>
        </div>
      </div>
      <div className="flex flex-row justify-between items-end">
        <p className="text-xs font-semibold">
          Total Backers: {tier.backers.toString()}
        </p>
        <button
          onClick={handleFund}
          disabled={isFunding}
          className={`mt-4 px-4 py-2 rounded-md ${
            isFunding
              ? "bg-blue-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          } text-white`}
        >
          {isFunding ? "Processing..." : "Select"}
        </button>
      </div>
      {isEditing && (
        <button
          onClick={handleRemoveTier}
          disabled={isRemoving}
          className={`mt-4 px-4 py-2 rounded-md ${
            isRemoving
              ? "bg-red-400 cursor-not-allowed"
              : "bg-red-600 hover:bg-red-700"
          } text-white`}
        >
          {isRemoving ? "Removing..." : "Remove"}
        </button>
      )}
    </div>
  );
};
