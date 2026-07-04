import { Search } from "lucide-react";

export function SearchField({ placeholder }: { placeholder: string }) {
  return (
    <label className="flex min-w-0 flex-1 items-center gap-[11px] rounded-full bg-fill px-[18px] py-[11px] text-ink-faint sm:max-w-[300px]">
      <Search size={18} strokeWidth={1.5} className="flex-none" />
      <input
        type="text"
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-ink-faint"
      />
    </label>
  );
}
