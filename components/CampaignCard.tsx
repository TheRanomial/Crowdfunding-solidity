import { campaignabi } from "@/app/campaignabi";
import Link from "next/link";
import { getContract } from "viem";
import { useReadContract } from "wagmi";

type CampaignCardProps = {
  campaignAddress: string;
};

export const CampaignCard: React.FC<CampaignCardProps> = ({
  campaignAddress,
}) => {
  const { data: campaignName } = useReadContract({
    abi: campaignabi,
    address: campaignAddress as `0x${string}`,
    functionName: "name",
  }) as any;

  const { data: campaignDescription } = useReadContract({
    abi: campaignabi,
    address: campaignAddress as `0x${string}`,
    functionName: "description",
  }) as any;

  const { data: goal, isLoading: isLoadingGoal } = useReadContract({
    abi: campaignabi,
    address: campaignAddress as `0x${string}`,
    functionName: "goal",
  }) as any;

  // Total funded balance of the campaign
  const { data: balance, isLoading: isLoadingBalance } = useReadContract({
    abi: campaignabi,
    address: campaignAddress as `0x${string}`,
    functionName: "getContractBalance",
  }) as any;

  console.log(campaignName, campaignDescription, goal, balance);

  const totalBalance = balance?.toString();
  const totalGoal = goal?.toString();
  let balancePercentage =
    (parseInt(totalBalance as string) / parseInt(totalGoal as string)) * 100;

  if (balancePercentage >= 100) {
    balancePercentage = 100;
  }

  return (
    <div className="flex flex-col justify-between max-w-sm p-6 bg-white border border-slate-200 rounded-lg shadow">
      <div>
        {!isLoadingBalance && (
          <div className="mb-4">
            <div className="relative w-full h-6 bg-gray-200 rounded-full dark:bg-gray-700">
              <div
                className="h-6 bg-blue-600 rounded-full dark:bg-blue-500 text-right"
                style={{ width: `${balancePercentage?.toString()}%` }}
              >
                <p className="text-white dark:text-white text-xs p-1">
                  ${balance?.toString()}
                </p>
              </div>
              <p className="absolute top-0 right-0 text-white dark:text-white text-xs p-1">
                {balancePercentage >= 100
                  ? ""
                  : `${balancePercentage?.toString()}%`}
              </p>
            </div>
          </div>
        )}
        <h5 className="mb-2 text-2xl font-bold tracking-tight">
          {campaignName}
        </h5>

        <p className="mb-3 font-normal text-gray-700 dark:text-gray-400">
          {campaignDescription}
        </p>
      </div>

      <Link href={`/campaign/${campaignAddress}`} passHref={true}>
        <p className="inline-flex items-center px-3 py-2 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
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
        </p>
      </Link>
    </div>
  );
};
