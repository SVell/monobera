import { Button } from "@bera/ui/button";
import { Card, CardContent } from "@bera/ui/card";
import { Address } from "viem";
import { useCreateRewardVault } from "~/app/vaults/create/components/useCreateRewardVault";

export const PoolCreateRewardVault = ({
  address,
  onSuccess,
}: {
  address: Address;
  onSuccess?: () => void;
}) => {
  const { createRewardVault, ModalPortal } = useCreateRewardVault({
    tokenAddress: address,
    onSuccess,
  });
  return (
    <Card>
      {ModalPortal}
      <CardContent className="p-4">
        <div className="flex justify-between gap-2 items-center w-full">
          <div>
            <h3 className="text-md font-semibold capitalize">
              No Reward Vault
            </h3>
            <p className="text-muted-foreground font-medium text-sm">
              There is no reward vault connected to this pool
            </p>
          </div>
          <div>
            <Button
              variant="outline"
              size="md"
              onClick={() => createRewardVault()}
            >
              Create
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
