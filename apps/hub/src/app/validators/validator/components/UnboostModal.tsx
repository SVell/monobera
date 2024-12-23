import { useState } from "react";
import { useUserBoostsOnValidator } from "@bera/berajs";
import { Button } from "@bera/ui/button";
import { Dialog, DialogContent } from "@bera/ui/dialog";

import { UnboostContent } from "./UnboostContent";
import { ApiValidatorFragment } from "@bera/graphql/pol/api";
import { Address } from "viem";

export const UnbondModal = ({
  validator,
  setIsValidatorDataLoading,
}: {
  validator: ApiValidatorFragment | undefined;
  setIsValidatorDataLoading: (loading: boolean) => void;
}) => {
  const [open, setOpen] = useState(false);

  const { data: userBoosts } = useUserBoostsOnValidator({
    pubkey: validator?.pubkey as Address,
  });

  if (!validator) return null;
  return (
    <>
      <Button
        variant="ghost"
        onClick={() => setOpen(true)}
        disabled={Number(userBoosts?.activeBoosts) <= 0}
      >
        Unboost
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-full md:w-[550px]">
          <UnboostContent
            onSuccess={() => {
              setOpen(false);
            }}
            setIsValidatorDataLoading={setIsValidatorDataLoading}
            validator={validator}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};
