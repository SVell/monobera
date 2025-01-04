import { useState } from "react";
import { Button } from "@bera/ui/button";
import { Dialog, DialogContent } from "@bera/ui/dialog";
import { Address } from "viem";

import { DelegateContent } from "./BoostContent";
import { ActionButton } from "@bera/shared-ui";

export const BoostModal = ({
  validator,
  setIsValidatorDataLoading,
}: {
  validator: Address;
  setIsValidatorDataLoading: (loading: boolean) => void;
}) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <ActionButton>
        <Button onClick={() => setOpen(true)}>Boost</Button>
      </ActionButton>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-full md:w-[550px]">
          <DelegateContent
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
