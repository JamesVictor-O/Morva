"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Topbar } from "@/components/layout/topbar";
import { AvatarTile } from "@/components/ui/avatar-tile";
import { Button } from "@/components/ui/button";
import { updateStallPayout } from "@/lib/actions/stalls";
import { SETTLEMENT_OPTIONS, settlementOptionKey, type SettlementOption } from "@/lib/settlement-options";
import type { Accent } from "@/lib/types";

export function SettingsPageClient({
  stallInitial,
  stallAccent,
  payoutAddress,
  payoutToken,
  payoutChainId,
}: {
  stallInitial: string;
  stallAccent: Accent;
  payoutAddress: string;
  payoutToken: string;
  payoutChainId: number;
}) {
  const router = useRouter();
  const [address, setAddress] = useState(payoutAddress);
  const [selectedKey, setSelectedKey] = useState(settlementOptionKey({ chainId: payoutChainId, token: payoutToken }));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const selected =
    SETTLEMENT_OPTIONS.find((option) => settlementOptionKey(option) === selectedKey) ?? SETTLEMENT_OPTIONS[0];

  async function handleSave() {
    setPending(true);
    setError(null);
    setSaved(false);
    try {
      const formData = new FormData();
      formData.set("payoutAddress", address.trim());
      formData.set("payoutToken", selected.token);
      formData.set("payoutChainId", String(selected.chainId));
      await updateStallPayout(formData);
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save your settings. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <AppShell variant="merchant">
      <Topbar
        left={<p className="text-[20px] font-semibold text-ink">Settings</p>}
        right={<AvatarTile label={stallInitial} accent={stallAccent} size="lg" className="rounded-full" />}
      />

      <main className="px-5 py-8 sm:px-8 lg:px-[34px] lg:py-10">
        <div className="max-w-[560px] rounded-[28px] border border-border-soft bg-surface-solid p-[26px]">
          <p className="text-[17px] font-semibold text-ink">Where your money goes</p>
          <p className="mt-1 text-[14px] text-ink-faint">
            Every sale settles here automatically — no manual step, no invoice to chase.
          </p>

          <div className="mt-6">
            <Field label="Payout address">
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="0x…"
                className="w-full min-w-0 rounded-2xl border border-border bg-surface-solid px-[18px] py-[15px] font-mono text-[15px] text-ink outline-none focus:border-primary"
              />
            </Field>
          </div>

          <div className="mt-6">
            <Field label="Settlement token & chain">
              <div className="flex flex-col gap-2.5">
                {SETTLEMENT_OPTIONS.map((option) => (
                  <SettlementOptionRow
                    key={settlementOptionKey(option)}
                    option={option}
                    selected={settlementOptionKey(option) === selectedKey}
                    onSelect={() => setSelectedKey(settlementOptionKey(option))}
                  />
                ))}
              </div>
            </Field>
            <p className="mt-2 text-[13px] text-ink-faint">
              Only verified stablecoin/chain pairs are offered — settling in a token
              that isn&apos;t pegged 1:1 to USD would silently charge the wrong amount,
              since product prices are entered in USD.
            </p>
          </div>

          {error && (
            <p className="mt-5 rounded-2xl bg-error-bg px-4 py-3 text-[14px] text-error-fg">{error}</p>
          )}
          {saved && !error && (
            <p className="mt-5 rounded-2xl bg-success-bg px-4 py-3 text-[14px] text-success-fg">
              Saved — new sales will settle to these details.
            </p>
          )}

          <div className="mt-6 flex justify-end">
            <Button onClick={handleSave} disabled={pending || !address.trim()} className="px-6 py-3 text-[14px]">
              {pending ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </div>
      </main>
    </AppShell>
  );
}

function SettlementOptionRow({
  option,
  selected,
  onSelect,
}: {
  option: SettlementOption;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex items-center gap-3 rounded-2xl border px-[18px] py-[15px] text-left transition-colors ${
        selected ? "border-primary bg-surface-solid" : "border-border bg-surface-solid hover:border-border-strong"
      }`}
    >
      <span className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-full bg-accent-slate-bg text-[13px] font-semibold text-primary">
        {option.token}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-semibold text-ink">
          {option.token} on {option.chainName}
        </p>
        <p className="truncate font-mono text-[12px] text-ink-faint">{option.tokenAddress}</p>
      </div>
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-[14px] font-semibold text-ink">{label}</p>
      {children}
    </div>
  );
}
