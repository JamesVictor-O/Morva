import type { ButtonHTMLAttributes } from "react";

export function IconButton({
  className = "",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`flex h-[42px] w-[42px] flex-none items-center justify-center rounded-full border border-border bg-surface-solid transition-colors hover:bg-fill ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
