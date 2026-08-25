import { type ComponentProps } from "react";
import { cn } from "@/lib/utils";
import logoMark from "./seed-admin-mark.png";

export function Logo({ className, ...props }: ComponentProps<"img">) {
  return (
    <img
      src={logoMark}
      alt="Seed Admin"
      className={cn("size-6 object-contain", className)}
      {...props}
    />
  );
}
