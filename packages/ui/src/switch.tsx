"use client";

import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";

import { cn } from "./utils/cn";
import { VariantProps, cva } from "class-variance-authority";

const rootVariants = cva(
  [
    "peer inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors",
    "disabled:cursor-not-allowed disabled:opacity-50",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "data-[state=checked]:bg-positive data-[state=unchecked]:bg-secondary-foreground",
  ],
  {
    variants: {
      size: {
        md: "h-[24px] w-[44px]",
        sm: "h-[16px] w-[28px]",
      },
    },
    defaultVariants: {
      size: "md",
    },
  },
);

const thumbVariants = cva(
  [
    "pointer-events-none block rounded-full bg-background shadow-lg ring-0 transition-transform",
    "data-[state=unchecked]:translate-x-0",
  ],
  {
    variants: {
      size: {
        md: "h-5 w-5 data-[state=checked]:translate-x-5",
        sm: "h-3 w-3 data-[state=checked]:translate-x-3",
      },
    },
    defaultVariants: {
      size: "md",
    },
  },
);

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> &
    VariantProps<typeof rootVariants>
>(({ className, size, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={rootVariants({ className, size })}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb className={thumbVariants({ size })} />
  </SwitchPrimitives.Root>
));
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
