import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        pink: "border-transparent bg-pink-500 text-white",
        sky: "border-transparent bg-sky-400 text-white",
        orange: "border-transparent bg-orange-500 text-white",
        green: "border-transparent bg-green-500 text-white",
        blue: "border-transparent bg-blue-500 text-white",
        purple: "border-transparent bg-purple-500 text-white",
        yellow: "border-transparent bg-yellow-500 text-slate-900",
        cyan: "border-transparent bg-cyan-400 text-slate-900",
        indigo: "border-transparent bg-indigo-500 text-white",
        slate: "border-transparent bg-slate-500 text-white",
        red: "border-transparent bg-red-500 text-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
