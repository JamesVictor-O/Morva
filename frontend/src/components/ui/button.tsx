import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "dark" | "ghost";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-primary text-primary-ink hover:bg-[#2450e0]",
  dark: "bg-ink text-white hover:bg-[#26262b]",
  ghost: "bg-fill text-ink hover:bg-border-soft",
};

export function Button({
  variant = "primary",
  fullWidth = false,
  className = "",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  fullWidth?: boolean;
}) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-full px-6 py-4 font-semibold text-[16px] transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        VARIANT_CLASSES[variant]
      } ${fullWidth ? "w-full" : ""} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
