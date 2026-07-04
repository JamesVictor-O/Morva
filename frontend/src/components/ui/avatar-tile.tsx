import type { Accent } from "@/lib/types";
import { accentClasses } from "./accent";

const SIZE_CLASSES = {
  sm: "h-[26px] w-[26px] rounded-lg text-[12px]",
  md: "h-[36px] w-[36px] rounded-xl text-[13px]",
  lg: "h-[42px] w-[42px] rounded-xl text-[15px]",
  xl: "h-[52px] w-[52px] rounded-2xl text-[19px]",
  "2xl": "h-20 w-20 rounded-[22px] text-[34px]",
} as const;

export function AvatarTile({
  label,
  accent,
  size = "md",
  className = "",
}: {
  label: string;
  accent: Accent;
  size?: keyof typeof SIZE_CLASSES;
  className?: string;
}) {
  const { bg, fg } = accentClasses(accent);
  return (
    <div
      className={`flex flex-none items-center justify-center font-semibold ${bg} ${fg} ${SIZE_CLASSES[size]} ${className}`}
    >
      {label}
    </div>
  );
}
