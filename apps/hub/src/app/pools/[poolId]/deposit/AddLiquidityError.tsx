import { Alert, AlertDescription, AlertTitle } from "@bera/ui/alert";
import { Icons } from "@bera/ui/icons";
import { AddLiquidityError as AddLiquidityErrorType } from "./useAddLiquidity";
import { AddLiquidityKind } from "@berachain-foundation/berancer-sdk";

export default function AddLiquidityError({
  error,
  transactionType,
}: {
  error: AddLiquidityErrorType | undefined;
  transactionType: AddLiquidityKind;
}) {
  if (!error) {
    return null;
  }

  const isUnbalanced = transactionType === AddLiquidityKind.Unbalanced;

  const isUnbalanceAndTooMuch =
    isUnbalanced && error.balanceError === "BAL#001";

  return (
    <Alert variant="destructive">
      <AlertTitle className="flex items-center gap-1">
        <Icons.tooltip className=" inline h-4 w-4" /> Error
      </AlertTitle>
      <AlertDescription className="text-xs">
        {isUnbalanceAndTooMuch ? (
          <span>
            Balancer error: {error.balanceError} SUB_OVERFLOW.
            <br />
            Try to reduce the amount of tokens or use balanced mode.
          </span>
        ) : (
          error.message
        )}
      </AlertDescription>
    </Alert>
  );
}
