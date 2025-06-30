import { campaignabi } from "@/app/campaignabi";
import Link from "next/link";
import { useReadContract } from "wagmi";

type MyCampaignCardProps = {
  contractAddress: string;
};

const CAMPAIGN_ABI = campaignabi;

export const MyCampaignCard: React.FC<MyCampaignCardProps> = ({
  contractAddress,
}) => {
  const { data: name, isLoading: nameLoading } = useReadContract({
    abi: CAMPAIGN_ABI,
    address: contractAddress as `0x${string}`,
    functionName: "name",
  });

  const { data: description, isLoading: descriptionLoading } = useReadContract({
    abi: CAMPAIGN_ABI,
    address: contractAddress as `0x${string}`,
    functionName: "description",
  });

  const { data: goal, isLoading: goalLoading } = useReadContract({
    abi: CAMPAIGN_ABI,
    address: contractAddress as `0x${string}`,
    functionName: "goal",
  });

  const { data: deadline, isLoading: deadlineLoading } = useReadContract({
    abi: CAMPAIGN_ABI,
    address: contractAddress as `0x${string}`,
    functionName: "deadline",
  });

  const { data: balance, isLoading: balanceLoading } = useReadContract({
    abi: CAMPAIGN_ABI,
    address: contractAddress as `0x${string}`,
    functionName: "getContractBalance",
  });

  const { data: state, isLoading: stateLoading } = useReadContract({
    abi: CAMPAIGN_ABI,
    address: contractAddress as `0x${string}`,
    functionName: "state",
  });

  const isLoading =
    nameLoading ||
    descriptionLoading ||
    goalLoading ||
    deadlineLoading ||
    balanceLoading ||
    stateLoading;

  console.log(goal);

  // Convert state number to readable string
  const getStateText = (stateNum: number) => {
    switch (stateNum) {
      case 0:
        return "Active";
      case 1:
        return "Successful";
      case 2:
        return "Failed";
      default:
        return "Unknown";
    }
  };

  // Format ETH values
  const formatEth = (wei: bigint) => {
    if (!wei) return "0";
    return (Number(wei) / 1e18).toFixed(4);
  };

  // Format date
  const formatDate = (timestamp: bigint) => {
    if (!timestamp) return "N/A";
    return new Date(Number(timestamp) * 1000).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="flex flex-col justify-between max-w-sm p-6 bg-white border border-slate-200 rounded-lg shadow animate-pulse">
        <div>
          <div className="h-8 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded mb-3"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
        </div>
        <div className="h-10 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-between max-w-sm p-6 bg-white border border-slate-200 rounded-lg shadow">
      <div>
        <h5 className="mb-2 text-2xl font-bold tracking-tight">
          {typeof name === "string" ? name : String(name ?? "Unnamed Campaign")}
        </h5>
        <p className="mb-3 font-normal text-gray-700">
          {typeof description === "string"
            ? description
            : "No description available"}
        </p>

        <div className="mb-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Goal:</span>
            <span className="font-semibold">
              {goal ? formatEth(goal as bigint) : "0"} ETHÍ
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Raised:</span>
            <span className="font-semibold">
              {typeof balance === "bigint" ? formatEth(balance) : "0"} ETH
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Status:</span>
            <span
              className={`font-semibold ${
                state === 0
                  ? "text-blue-600"
                  : state === 1
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {typeof state === "number" ? getStateText(state) : "Unknown"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Deadline:</span>
            <span className="font-semibold">
              {typeof deadline === "bigint" ? formatDate(deadline) : "N/A"}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        {typeof goal === "bigint" && typeof balance === "bigint" && (
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span>Progress</span>
              <span>
                {((Number(balance) / Number(goal)) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{
                  width: `${Math.min(
                    (Number(balance) / Number(goal)) * 100,
                    100
                  )}%`,
                }}
              ></div>
            </div>
          </div>
        )}
      </div>

      <Link href={`/campaign/${contractAddress}`} passHref={true}>
        <div className="inline-flex items-center px-3 py-2 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 cursor-pointer">
          View Campaign
          <svg
            className="rtl:rotate-180 w-3.5 h-3.5 ms-2"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 14 10"
          >
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M1 5h12m0 0L9 1m4 4L9 9"
            />
          </svg>
        </div>
      </Link>
    </div>
  );
};
