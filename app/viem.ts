import { createPublicClient, getContract, http, parseAbi } from "viem";
import { sepolia } from "viem/chains";

export const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(),
});
