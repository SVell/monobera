import {
  FormattedNumber,
  getPriceImpactColorClass,
  useSlippage,
} from "@bera/shared-ui";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@bera/ui/accordion";
import { PriceImpactAmount } from "@berachain-foundation/berancer-sdk";
import { useMemo, useState } from "react";
import { NetworkFee } from "~/components/swap-card-info";

export function WithdrawLiquidityDetails({
  priceImpact,
  gasPrice,
  exchangeRate,
  totalValue,
}: {
  priceImpact: PriceImpactAmount | undefined;
  exchangeRate: string | undefined;
  totalValue?: string | undefined;
  gasPrice?: string;
}) {
  const [isSelected, setIsSelected] = useState(false);

  const priceImpactColorClass = useMemo(() => {
    return getPriceImpactColorClass(priceImpact?.percentage);
  }, [priceImpact]);

  const slippage = useSlippage();
  return (
    <Accordion
      type="single"
      collapsible
      onValueChange={() => setIsSelected(!isSelected)}
    >
      <AccordionItem value="item-1" className="w-full" disabled={!exchangeRate}>
        <AccordionTrigger
          //   decorator={!isSelected && <NetworkFee gasPrice={gasPrice} />}
          className="flex gap-4 text-sm min-w-full w-full font-normal text-muted-foreground"
        >
          <span className="text-white font-semibold text-xs">
            {exchangeRate && exchangeRate}
          </span>
        </AccordionTrigger>
        <AccordionContent>
          <div className="flex flex-col w-full gap-2">
            <div className="w-full flex flex-row justify-between items-center">
              <span className="text-muted-foreground text-xs font-semibold">
                Price Impact
              </span>
              <span
                className={`text-right text-xs font-semibold  ${
                  priceImpactColorClass ?? ""
                }`}
              >
                {priceImpact
                  ? `~${Math.abs(priceImpact.percentage).toFixed(2)}%`
                  : "-"}
              </span>
            </div>
            {totalValue && (
              <div className="w-full flex flex-row justify-between items-center">
                <span className="text-muted-foreground text-xs font-semibold">
                  Total Value
                </span>
                <span className={"text-right text-xs font-semibold"}>
                  <FormattedNumber value={totalValue} symbol="USD" />
                </span>
              </div>
            )}
            <div className="w-full flex flex-row justify-between items-center">
              <span className="text-muted-foreground text-xs font-semibold">
                Slippage Tolerance
              </span>
              <span className={"text-right text-xs font-semibold"}>
                {slippage}%
              </span>
            </div>
            {gasPrice && (
              <div className="w-full flex flex-row justify-between items-center">
                <span className="text-muted-foreground text-xs font-semibold">
                  Network Fee
                </span>
                <NetworkFee gasPrice={gasPrice} />
              </div>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
