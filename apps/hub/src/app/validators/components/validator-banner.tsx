"use client";
import Link from "next/link";
import { truncateHash, useBeraJs, useValidatorByOperator } from "@bera/berajs";
import { ValidatorIcon } from "@bera/shared-ui";
import { getHubValidatorPath } from "@bera/shared-ui";
import { Icons } from "@bera/ui/icons";

export const ValidatorsBanner = () => {
  const { account, isReady } = useBeraJs();
  const { data: validator, isLoading } = useValidatorByOperator(
    account ?? "0x",
  );
  if (
    !isReady ||
    !account ||
    isLoading ||
    !validator ||
    validator?.validators.length === 0
  )
    return <></>;
  return (
    <Link
      className="rounded-sm border px-4 py-6"
      href={getHubValidatorPath(validator?.validators[0]?.publicKey ?? "0x")}
    >
      <div className="flex items-center text-sm font-semibold leading-5 text-muted-foreground">
        <Icons.checkCircle2 className="mr-1 h-4 w-4 text-success-foreground" />{" "}
        Connected as
        <ValidatorIcon address={account} className="ml-4 mr-1" />{" "}
        {"Public Key:"}{" "}
        {truncateHash(validator?.validators[0]?.publicKey ?? "0x")}{" "}
        {" | Operator: "} ({truncateHash(account)})
      </div>
      <div className="flex items-center gap-3 text-2xl font-semibold leading-loose">
        Manage as a validator <Icons.arrowRight />
      </div>
      <div className="text-sm font-medium leading-5 text-muted-foreground">
        View your validator’s analytics and configure your settings.
      </div>
    </Link>
  );
};
