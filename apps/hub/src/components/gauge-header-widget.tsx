import { truncateHash, useRewardVaults, useTokens } from "@bera/berajs";
import { ApiVaultFragment } from "@bera/graphql/pol/api";
import { GaugeIcon, MarketIcon, TokenIconList } from "@bera/shared-ui";
import { cn } from "@bera/ui";
import { isAddressEqual } from "viem";
import { Address } from "viem";

export const GaugeHeaderWidget = ({
  address,
  className,
  gauge: defaultGauge,
}: {
  address: Address;
  className?: string;
  gauge?: ApiVaultFragment;
}) => {
  const { data: vaultsData, isLoading } = useRewardVaults({
    pageSize: 9999,
  });

  const gauge =
    defaultGauge ??
    vaultsData?.gaugeList?.find((gauge) =>
      isAddressEqual(gauge.vaultAddress as Address, address),
    );

  const { data } = useTokens();
  const tokenList = data?.tokenList ?? [];
  let list: any = [];
  if (tokenList[0] && tokenList[1]) {
    list = [tokenList[0], tokenList[1]];
  }

  return (
    <>
      {isLoading || !gauge ? (
        <div>Loading</div>
      ) : (
        <div
          className={cn(
            "flex flex-col gap-2 whitespace-nowrap text-left",
            className,
          )}
        >
          <div className="text-md flex items-center gap-1 font-medium leading-6">
            <GaugeIcon
              address={gauge.vaultAddress as Address}
              overrideImage={gauge.metadata?.logoURI}
            />
            {gauge.metadata?.name ??
              truncateHash(gauge.id ?? gauge.vaultAddress)}
          </div>
          <div className="flex items-center gap-1 text-sm font-medium leading-5">
            <MarketIcon
              market={gauge.metadata?.productName ?? "OTHER"}
              size="md"
            />
            {gauge.metadata?.productName ?? "OTHER"}
          </div>
        </div>
      )}
    </>
  );
};
