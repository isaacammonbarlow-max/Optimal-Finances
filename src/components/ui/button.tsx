import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-xl font-medium transition-all disabled:opacity-50",
          variant === "primary" &&
            "bg-emerald-500 text-white hover:bg-emerald-400 shadow-lg shadow-emerald-500/20",
          variant === "secondary" &&
            "bg-white/10 text-white hover:bg-white/15 border border-white/10",
          variant === "ghost" && "text-slate-300 hover:bg-white/5 hover:text-white",
          variant === "danger" && "bg-rose-500/90 text-white hover:bg-rose-500",
          size === "sm" && "h-8 px-3 text-sm",
          size === "md" && "h-10 px-4 text-sm",
          size === "lg" && "h-12 px-6 text-base",
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
