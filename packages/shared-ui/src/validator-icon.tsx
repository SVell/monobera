"use client";

import { useMemo } from "react";
import { cn } from "@bera/ui";
import { Avatar, AvatarFallback, AvatarImage } from "@bera/ui/avatar";
import { Icons } from "@bera/ui/icons";
import { cva, type VariantProps } from "class-variance-authority";
import { Address } from "viem";
import { useAllValidators } from "@bera/berajs";

const IconVariants = cva(
  "aspect-square flex items-center justify-center rounded-full text-foreground bg-background border border-border",
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
  address?: Address;
  imgOverride?: string;
}

export const ValidatorIcon = ({
  address = "0x",
  imgOverride,
  className,
  size,
  ...props
}: IconProps) => {
  const { data } = useAllValidators();
  const img = useMemo(
    // @ts-ignore
    () =>
      data?.validators?.validators?.find(
        (v) => v.pubkey.toLowerCase() === address.toLowerCase(),
      )?.metadata?.logoURI ?? "",
    [address, data],
  );

  return (
    <Avatar className={cn(IconVariants({ size }), className)} {...props}>
      <AvatarImage
        src={imgOverride ? imgOverride : img}
        className="rounded-full"
        alt={address}
      />
      <AvatarFallback className="flex justify-center items-center">
        <Icons.validator className="w-full h-full p-[20%]" />
      </AvatarFallback>
    </Avatar>
  );
};
