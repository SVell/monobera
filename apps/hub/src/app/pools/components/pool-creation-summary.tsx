import { cn } from "@bera/ui";
import { PoolType } from "@berachain-foundation/berancer-sdk";
import { Address } from "viem";

const PoolCreationSummary = ({
  poolType,
  tokens,
  swapFee,
  ownersAddress,
  name,
  symbol,
}: {
  poolType?: PoolType;
  tokens?: any;
  swapFee?: number;
  ownersAddress?: Address;
  name?: string;
  symbol?: string;
}) => {
  return (
    <div className="">
      <h2 className="self-start text-xl font-semibold mb-4">Pool Summary</h2>
      <section className="rounded-sm border p-4 flex flex-col min-w-[400px] h-fit justify-between gap-y-2">
        <div className="flex">
          <div
            className={cn("w-full", poolType === undefined && "text-[#f6f7f9]")}
          >
            Pool Type
          </div>
          {poolType ? (
            <div className="flex items-center border-2 border-green-600 rounded-full text-[#4ade80] px-2 gap-2">
              <div className="h-1 w-1 bg-[#4ade80] rounded-full" /> Stable
            </div>
          ) : (
            <div className="w-4 opacity-35">--</div>
          )}
        </div>
        <div className="w-full flex">
          <div
            className={cn("w-full text-", tokens === undefined && "opacity-35")}
          >
            Tokens
          </div>
          {tokens ? (
            <div className="flex items-center border-2 border-green-600 rounded-full text-[#4ade80] px-2 gap-2">
              <div className="h-1 w-1 bg-[#4ade80] rounded-full" /> token
            </div>
          ) : (
            <div className="w-4 opacity-35">--</div>
          )}
        </div>
        <div className="w-full flex">
          <div className={cn("w-full", tokens === undefined && "opacity-35")}>
            Swap Fee
          </div>
          {swapFee ? (
            <div className="flex items-center border-2 border-green-600 rounded-full text-[#4ade80] px-2 gap-2">
              <div className="h-1 w-1 bg-[#4ade80] rounded-full" /> fee
            </div>
          ) : (
            <div className="w-4 opacity-35">--</div>
          )}
        </div>
        <div className="w-full flex">
          <div className={cn("w-full", tokens === undefined && "opacity-35")}>
            Owners Address
          </div>
          {ownersAddress ? (
            <div className="flex items-center border-2 border-green-600 rounded-full text-[#4ade80] px-2 gap-2">
              <div className="h-1 w-1 bg-[#4ade80] rounded-full" /> fee
            </div>
          ) : (
            <div className="w-4 opacity-35">--</div>
          )}
        </div>
        <div className="w-full flex">
          <div className={cn("w-full", name === undefined && "opacity-35")}>
            Name
          </div>
          {name ? (
            <div className="flex items-center border-2 border-green-600 rounded-full text-[#4ade80] px-2 gap-2">
              <div className="h-1 w-1 bg-[#4ade80] rounded-full" /> fee
            </div>
          ) : (
            <div className="w-4 opacity-35">--</div>
          )}
        </div>
        <div className="w-full flex">
          <div className={cn("w-full", symbol === undefined && "opacity-35")}>
            Symbol
          </div>
          {symbol ? (
            <div className="flex items-center border-2 border-green-600 rounded-full text-[#4ade80] px-2 gap-2">
              <div className="h-1 w-1 bg-[#4ade80] rounded-full" /> fee
            </div>
          ) : (
            <div className="w-4 opacity-35">--</div>
          )}
        </div>
      </section>
    </div>
  );
};

export default PoolCreationSummary;
