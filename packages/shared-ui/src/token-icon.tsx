"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useTokens } from "@bera/berajs";
import { cn } from "@bera/ui";
import { CustomAvatar } from "@bera/ui/custom-avatar";
import { cva, type VariantProps } from "class-variance-authority";
import { getAddress, isAddress } from "viem";

const IconVariants = cva(
  "aspect-square flex items-center justify-center rounded-full text-foreground",
  {
    variants: {
      size: {
        "3xl": "w-16 h-16 text-lg font-semibold leading-7",
        "2xl": "w-12 h-12 text-[14px] font-semibold leading-tight",
        xl: "w-8 h-8 text-xs font-normal leading-3",
        lg: "w-6 h-6 text-[8px]",
        md: "w-4 h-4 text-[6px]",
        sm: "w-3 h-3 text-[4px]",
        xs: "w-2 h-2 text-[3px]",
      },
    },
    defaultVariants: {
      size: "lg",
    },
  },
);

interface IconProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof IconVariants> {
  address: string | undefined;
  symbol?: string;
  imgOverride?: string;
}

export const TokenIcon = ({
  address: adr,
  className,
  size,
  symbol,
  imgOverride,
  ...props
}: IconProps) => {
  const { data: tokenData } = useTokens();
  const [imageError, setImageError] = useState(false);
  const address = isAddress(adr ?? "") ? getAddress(adr ?? "") : adr;

  let img = "";
  // check if the token exists in the token dictionary
  const tokenExists =
    tokenData?.tokenDictionary &&
    address &&
    isAddress(address) &&
    tokenData?.tokenDictionary?.[address];
  if (tokenExists) {
    const uploadedToken = tokenData?.tokenDictionary?.[address];
    if (uploadedToken?.base64) {
      if (uploadedToken.base64.startsWith("data:")) {
        img = uploadedToken.base64;
      } else {
        // if the token does not contain image type, we assume it's svg
        img = `data:image/svg+xml;base64,${uploadedToken.base64}`;
      }
    } else {
      img = tokenData?.tokenDictionary?.[address]?.logoURI ?? "";
    }
  }

  // we assume the token has loaded if it exists in the token dictionary with server side rendering
  const [isLoading, setIsLoading] = useState(!tokenExists);

  const finalImageUrl = imgOverride ?? img ?? "";

  return (
    <CustomAvatar
      fallbackText={symbol ? symbol.slice(0, 3) : "TKN"}
      className={cn(IconVariants({ size }), className)}
      isNodeLoading={isLoading}
      imageNode={
        finalImageUrl && !imageError ? (
          <Image
            src={finalImageUrl}
            alt="Custom Avatar"
            fill
            style={{ opacity: isLoading ? 0 : 1 }}
            className={cn("aspect-square h-full w-full")}
            onLoad={() => setIsLoading(false)}
            onError={() => setImageError(true)}
          />
        ) : null
      }
      {...props}
    />
  );
};
