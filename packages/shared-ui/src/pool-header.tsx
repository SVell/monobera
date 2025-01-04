"use client";
import { ReactNode } from "react";
import { cn } from "@bera/ui";
import { Button } from "@bera/ui/button";
import { Icons } from "@bera/ui/icons";
import { useRouter } from "next/navigation";

export const PoolHeader = ({
  title,
  subtitles,
  actions,
  center,
  className,
  backHref,
  isVault,
}: {
  title: ReactNode;
  subtitles: {
    title: string;
    content: any;
    color?: "success" | "warning" | "destructive";
    externalLink?: string;
    tooltip?: ReactNode;
  }[];
  actions?: ReactNode;
  center?: boolean;
  className?: string;
  backHref?: string;
  isVault?: boolean;
}) => {
  const router = useRouter();
  return (
    <div
      className={cn(
        "flex w-full flex-col items-center justify-between md:items-start md:justify-center lg:flex-row lg:items-end",
        className,
      )}
    >
      <div
        className={cn(
          "flex w-full flex-col gap-4",
          center ? "items-center" : "items-start",
        )}
      >
        <Button
          variant={"ghost"}
          size="sm"
          className="flex gap-1"
          onClick={() => (backHref ? router.push(backHref) : router.back())}
        >
          <Icons.arrowLeft className="h-4 w-4" />
          <div className="text-sm font-medium">
            {backHref ? "Go Back" : isVault ? "All Vaults" : "All Pools"}
          </div>
        </Button>
        <span
          className={cn(
            "flex w-full gap-4 text-2xl font-semibold items-start",
            center && "justify-center text-center  md:text-left",
          )}
        >
          {title}
        </span>
        <div
          className={cn(
            "flex w-full gap-x-2 flex-row flex-wrap items-center leading-7 text-muted-foreground",
            center && " justify-center ",
          )}
        >
          {subtitles.map((subtitle, index) => (
            <div className="flex w-fit items-center gap-1" key={index}>
              {subtitle.title}
              {subtitle.tooltip ? <> {subtitle.tooltip}:</> : ":"}
              <span
                className={cn(
                  "flex items-center gap-1 text-sm font-semibold",
                  subtitle.color
                    ? `text-${subtitle.color}-foreground`
                    : "text-foreground",
                  subtitle.externalLink && "cursor-pointer hover:underline",
                )}
                onClick={() =>
                  subtitle.externalLink && window.open(subtitle.externalLink)
                }
              >
                {subtitle.content}
                {subtitle.externalLink && (
                  <Icons.externalLink className="inline-block h-4 w-4 text-muted-foreground" />
                )}
              </span>
            </div>
          ))}
        </div>
      </div>

      {actions && (
        <div className="mt-4 flex gap-2 md:mt-4 lg:mt-0">{actions}</div>
      )}
    </div>
  );
};
