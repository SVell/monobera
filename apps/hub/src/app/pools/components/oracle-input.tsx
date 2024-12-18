import React, { useState } from "react";
import { ADDRESS_ZERO, Oracle, Token } from "@bera/berajs";
import { Alert, AlertDescription, AlertTitle } from "@bera/ui/alert";
import { InputWithLabel } from "@bera/ui/input";
import { ZERO_ADDRESS } from "@berachain-foundation/berancer-sdk";

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

  const validateAddress = (value: string): boolean =>
    /^0x[a-fA-F0-9]{40}$/.test(value);

  const handleAddressChange = (value: string) => {
    setRawAddress(value);

    if (validateAddress(value)) {
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
        label="Oracle Address"
        variant="black"
        value={rawAddress}
        onChange={(e) => handleAddressChange(e.target.value)}
        className="bg-transparent"
        tooltip={
          <BeraTooltip
            size="md"
            wrap={true}
            // FIXME: this is an info-dump, do we want a full modal/Dialog for this?
            text={`Address must point to a rate provider deployment implementing the function getRate() which returns an 
                   exchange rate. You will want to use rateProviders for all assets in your pool when each asset has its own 
                   price that is independent of all the other assets' prices.\nIf we have tokens A, B, and C and only have price 
                   feeds with respect to USD, then we would want all assets to have price feeds. When internally calculating 
                   relative prices, the USD would cancel out, giving us prices for A:B, A:C, B:C, and their inverses.\nIf we have
                   tokens A and B and a rate provider that gives the price of A with respect to B, 
                   then the rateProvider corresponding to token A would get the A:B price feed, and the rateProvider 
                   corresponding to token B would be the zero address.`}
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
