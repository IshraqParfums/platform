import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Container({
  children,
  className,
  size = "default",
}: {
  children: ReactNode;
  className?: string;
  size?: "default" | "wide" | "narrow";
}) {
  const width =
    size === "wide"
      ? "max-w-[1400px]"
      : size === "narrow"
        ? "max-w-3xl"
        : "max-w-[1200px]";

  return (
    <div className={cn("mx-auto w-full px-5 sm:px-8", width, className)}>
      {children}
    </div>
  );
}
