import React, { useState } from "react";
import { ADDRESS_ZERO, Oracle, Token } from "@bera/berajs";
import { Alert, AlertDescription, AlertTitle } from "@bera/ui/alert";
import { InputWithLabel } from "@bera/ui/input";
import { ZERO_ADDRESS } from "@berachain-foundation/berancer-sdk";
import { isAddress } from "viem";

import BeraTooltip from "~/components/bera-tooltip";

interface OracleInputProps {
  oracle: Oracle;
  token: Token;
  onOracleChange: (index: number, updates: Partial<Oracle>) => void;
  index: number;
}

const MAXIMUM_CACHE_DURATION = 100000000;

const OracleInput: React.FC<OracleInputProps> = ({
  oracle,
  token,
  onOracleChange,
  index,
}) => {
  const [rawAddress, setRawAddress] = useState(
    oracle.address === ZERO_ADDRESS ? "" : oracle.address,
  ); // NOTE: this works well since the default is 0x0, but if you set the value to 0x0 (a strange choice for custom) it will appear empty
  const [addressError, setAddressError] = useState<string | null>(
    oracle.address === ZERO_ADDRESS
      ? "Please define a rate provider address."
      : null,
  );

  const handleAddressChange = (value: string) => {
    setRawAddress(value);

    if (isAddress(value)) {
      setAddressError(null);
      onOracleChange(index, { address: value });
    } else {
      setAddressError("Invalid address");
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <h3 className="font-bold">{token.symbol}</h3>

      <InputWithLabel
        label="Rate Provider Address"
        variant="black"
        value={rawAddress}
        onChange={(e) => handleAddressChange(e.target.value)}
        className="bg-transparent"
        tooltip={
          <BeraTooltip
            size="md"
            wrap={true}
            text=""
            children={
              <p>
                The address must point to a rate provider implementing the
                getRate() function. Use rate providers for all assets which are
                correlated but not strictly pegged.
                {/* - more details{" "} // TODO (#): Add a documentation link
                <a
                  href="https://www.google.com/search?q=rate+providers&oq=rate+providers"
                  target="_blank"
                  rel="noreferrer"
                >
                  here
                </a> */}
              </p>
            }
          />
        }
      />
      {addressError && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{addressError}</AlertDescription>
        </Alert>
      )}

      <InputWithLabel
        label="Cache Duration (seconds)"
        variant="black"
        type="number"
        value={oracle.cacheDuration.toString()}
        onChange={(e) => {
          const duration = parseInt(e.target.value, 10);
          if (duration >= 1 && duration <= MAXIMUM_CACHE_DURATION) {
            onOracleChange(index, { cacheDuration: duration });
          }
        }}
        className="bg-transparent"
      />
    </div>
  );
};

export default OracleInput;
