"use client";

import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";

import { cn } from "./utils/cn";

interface CustomAvatarProps
  extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> {
  /**
   * The image source URL to load via a standard <img> element by default.
   * If this is provided and `imageNode` is not, a standard <img> is used.
   */
  src?: string;
  /**
   * The alt text for the image if using `src`.
   */
  alt?: string;
  /**
   * Fallback content to display if the image fails to load or is not provided.
   * This can be initials, an icon, or any React element.
   */
  fallbackText?: React.ReactNode | string;
  /**
   * Width of the avatar in pixels.
   */
  width?: number;
  /**
   * Height of the avatar in pixels.
   */
  height?: number;
  /**
   * A React node that can be used to render a custom image.
   * For example, a Next.js <Image> component. If provided, `src` is ignored.
   */
  imageNode?: React.ReactNode;
  /**
   * Custom className for the fallback element.
   */
  fallbackClassName?: string;
  /**
   * Whether the avatar is loading.
   */
  isNodeLoading?: boolean;
}

/**
 * Avatar component that displays an image (img by default), a custom image node, or a fallback.
 */
const CustomAvatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  CustomAvatarProps
>(
  (
    {
      className,
      src,
      alt = "Avatar",
      fallbackText,
      width = 40,
      height = 40,
      imageNode,
      fallbackClassName,
      isNodeLoading,
      ...props
    },
    ref,
  ) => {
    const [hasError, setHasError] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(true);

    const AvatarFallback = React.useMemo(
      () => (
        <AvatarPrimitive.Fallback
          className={cn(
            "flex h-full w-full items-center justify-center rounded-full bg-muted",
            fallbackClassName,
          )}
        >
          {fallbackText ?? "?"}
        </AvatarPrimitive.Fallback>
      ),
      [fallbackText, fallbackClassName],
    );

    const ImageContent = React.useMemo(() => {
      if (imageNode) {
        return (
          <div className="relative h-full w-full">
            {imageNode}
            {isNodeLoading && AvatarFallback}
          </div>
        );
      }

      if (src && !hasError) {
        return (
          <>
            <img
              src={src}
              alt={alt}
              className="h-full w-full rounded-full object-cover"
              style={{ display: isLoading ? "none" : "block" }}
              onLoad={() => setIsLoading(false)}
              onError={() => setHasError(true)}
            />
            {isLoading && AvatarFallback}
          </>
        );
      }

      return AvatarFallback;
    }, [
      imageNode,
      src,
      hasError,
      isLoading,
      isNodeLoading,
      alt,
      width,
      height,
      AvatarFallback,
    ]);

    return (
      <AvatarPrimitive.Root
        ref={ref}
        className={cn(
          "relative h-10 w-10 flex shrink-0 overflow-hidden rounded-full",
          className,
        )}
        {...props}
      >
        {ImageContent}
      </AvatarPrimitive.Root>
    );
  },
);
CustomAvatar.displayName = "CustomAvatar";

export { CustomAvatar };
