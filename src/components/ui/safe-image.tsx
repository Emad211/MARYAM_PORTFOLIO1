"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface SafeImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  sizes?: string;
  priority?: boolean;
  fallbackClassName?: string;
}

/**
 * next/image wrapper that swaps a failed remote load for an on-brand
 * placeholder block, so dead URLs never render as broken-image glyphs
 * or empty wells.
 */
export function SafeImage({
  src,
  alt,
  width,
  height,
  fill = false,
  className,
  sizes = "(max-width: 768px) 100vw, 50vw",
  priority = false,
  fallbackClassName,
}: SafeImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={cn(
          "flex items-center justify-center bg-gradient-to-br from-secondary via-background to-secondary",
          fallbackClassName ?? className,
          fill && "absolute inset-0 h-auto w-auto",
        )}
      >
        <span className="font-headline text-4xl font-bold text-primary/40" aria-hidden>
          F
        </span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      {...(fill ? { fill: true } : { width: width ?? 1080, height: height ?? 720 })}
      sizes={sizes}
      priority={priority}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
