"use client";

import React, { useCallback, useEffect } from "react";
import { cn } from "@bera/ui";
import { Button } from "@bera/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@bera/ui/command";
import { Icons } from "@bera/ui/icons";
import { Popover, PopoverContent, PopoverTrigger } from "@bera/ui/popover";

export function Combobox({
  items,
  selectedItems,
  onSelect,
  className,
  value,
  disabled,
}: {
  items: { value: string; label: string }[];
  selectedItems: string[];
  onSelect: (value: string) => void;
  className?: string;
  value: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const [buttonWidth, setButtonWidth] = React.useState(0);
  const buttonRef = React.useRef<HTMLButtonElement>(null);

  const updateButtonWidth = useCallback(() => {
    if (buttonRef.current) {
      setButtonWidth(buttonRef.current.offsetWidth);
    }
  }, []);

  useEffect(() => {
    updateButtonWidth();
    window.addEventListener("resize", updateButtonWidth);
    return () => window.removeEventListener("resize", updateButtonWidth);
  }, [updateButtonWidth]);

  const handleOpenChange = (newOpen: boolean) => {
    if (disabled) return;
    if (newOpen) {
      updateButtonWidth();
    }
    setOpen(newOpen);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          size="sm"
          ref={buttonRef}
          disabled={disabled}
          className={cn(
            "w-full min-w-[100px] justify-between rounded-sm text-sm border border-border p-2 text-foreground font-medium",
            className,
          )}
        >
          {value ? (
            <span className="text-foreground truncate">
              {items.find((item) => item.value === value)?.label}
            </span>
          ) : (
            <span className="text-muted-foreground truncate">
              Select Item...
            </span>
          )}
          <Icons.chevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0" style={{ width: buttonWidth }}>
        <Command>
          <CommandInput placeholder="Search item..." />
          <CommandList>
            <CommandEmpty>No item found.</CommandEmpty>
            <CommandGroup>
              {items.map((item) => (
                <CommandItem
                  key={item.value}
                  value={item.value}
                  className="cursor-pointer"
                  keywords={[item.label]}
                  disabled={selectedItems.includes(item.value)}
                  onSelect={(currentValue) => {
                    setOpen(false);
                    onSelect(currentValue); // Call the onSelect function
                  }}
                >
                  <Icons.check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === item.value ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {item.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
