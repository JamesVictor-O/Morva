"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Check, Upload } from "lucide-react";
import { Button } from "../ui/button";
import { AvatarTile } from "../ui/avatar-tile";
import { StepIndicator } from "./step-indicator";
import { accentClasses } from "../ui/accent";
import type { Accent } from "@/lib/types";

const ease = [0.25, 0.46, 0.45, 0.94] as const;

const ACCENT_OPTIONS: Accent[] = ["green", "yellow", "peach", "purple", "beige"];

interface OnboardingData {
  name: string;
  tagline: string;
  accent: Accent;
  payoutAddress: string;
}

const INITIAL_DATA: OnboardingData = {
  name: "",
  tagline: "",
  accent: "yellow",
  payoutAddress: "",
};

export function OnboardingFlow() {
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [data, setData] = useState<OnboardingData>(INITIAL_DATA);

  const initial = data.name.trim().charAt(0).toUpperCase() || "?";
  const canContinueIdentity = data.name.trim().length > 0;
  const canContinuePayout = data.payoutAddress.trim().length > 0;

  function handleConnect() {
    setData((d) => ({ ...d, payoutAddress: "0x7a3f4b2c9e1d8f6a5c3b0e7d2f9a1c4b8e6d3f2a" }));
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-[600px] flex-col px-5 py-10 sm:py-16">
      <Link href="/" className="mb-8 flex items-center gap-2 text-[14px] text-ink-faint transition-colors hover:text-ink">
        <ArrowLeft size={16} strokeWidth={1.6} />
        Save & exit
      </Link>

      <AnimatePresence mode="wait">
        {done ? (
          <SuccessPanel key="success" data={data} initial={initial} />
        ) : (
          <motion.div
            key={`step-${step}`}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.22, ease }}
            className="rounded-[28px] border border-border bg-surface p-8 sm:p-10"
          >
            <StepIndicator step={step} total={3} />

            {step === 0 && (
              <>
                <h1 className="mt-[22px] text-[28px] font-semibold tracking-tight text-ink sm:text-[30px]">
                  Introduce your stall
                </h1>
                <p className="mt-1.5 text-[15px] text-ink-soft">
                  This is what buyers see in the plaza.
                </p>

                <div className="mt-[26px] flex flex-col gap-[18px]">
                  <Field label="Stall name">
                    <input
                      value={data.name}
                      onChange={(e) => setData((d) => ({ ...d, name: e.target.value }))}
                      placeholder="Golden Hour Bakery"
                      className="w-full rounded-2xl border border-border bg-surface-solid px-[18px] py-[15px] text-[16px] text-ink outline-none focus:border-primary"
                    />
                  </Field>
                  <Field label="Tagline">
                    <input
                      value={data.tagline}
                      onChange={(e) => setData((d) => ({ ...d, tagline: e.target.value }))}
                      placeholder="Sourdough, pastries & small-batch jam"
                      className="w-full rounded-2xl border border-border bg-surface-solid px-[18px] py-[15px] text-[16px] text-ink outline-none focus:border-primary"
                    />
                  </Field>
                  <div className="flex flex-col gap-5 sm:flex-row">
                    <div className="flex-1">
                      <Field label="Logo">
                        <div className="flex h-24 flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed border-border-strong bg-surface-solid text-ink-quiet">
                          <Upload size={22} strokeWidth={1.6} />
                          <span className="text-[13px]">Upload</span>
                        </div>
                      </Field>
                    </div>
                    <div className="flex-1">
                      <Field label="Stall color">
                        <div className="mt-1 flex gap-3">
                          {ACCENT_OPTIONS.map((accent) => {
                            const { bg } = accentClasses(accent);
                            const selected = accent === data.accent;
                            return (
                              <button
                                key={accent}
                                type="button"
                                aria-label={accent}
                                onClick={() => setData((d) => ({ ...d, accent }))}
                                className={`h-11 w-11 rounded-2xl ${bg} ${
                                  selected ? "ring-2 ring-ink ring-offset-2 ring-offset-surface" : ""
                                }`}
                              />
                            );
                          })}
                        </div>
                      </Field>
                    </div>
                  </div>
                </div>

                <Button
                  fullWidth
                  className="mt-[30px]"
                  disabled={!canContinueIdentity}
                  onClick={() => setStep(1)}
                >
                  Continue
                </Button>
              </>
            )}

            {step === 1 && (
              <>
                <h1 className="mt-[22px] text-[28px] font-semibold tracking-tight text-ink sm:text-[30px]">
                  Where should your money go?
                </h1>
                <p className="mt-1.5 text-[15px] leading-[1.5] text-ink-soft">
                  Every sale lands here automatically. Paste an address or connect an account.
                </p>

                <div className="mt-[26px]">
                  <Field label="Payout destination">
                    {data.payoutAddress ? (
                      <div className="flex items-center justify-between rounded-2xl border border-border bg-surface-solid px-[18px] py-[15px] font-mono text-[15px] text-ink">
                        {truncateAddress(data.payoutAddress)}
                        <span className="rounded-full bg-success-bg px-[11px] py-[5px] font-sans text-[12px] font-medium text-success-fg">
                          Connected
                        </span>
                      </div>
                    ) : (
                      <div className="flex gap-2.5">
                        <input
                          value={data.payoutAddress}
                          onChange={(e) => setData((d) => ({ ...d, payoutAddress: e.target.value }))}
                          placeholder="0x…"
                          className="min-w-0 flex-1 rounded-2xl border border-border bg-surface-solid px-[18px] py-[15px] font-mono text-[15px] text-ink outline-none focus:border-primary"
                        />
                        <Button type="button" variant="dark" onClick={handleConnect} className="px-6 py-0 text-[14px]">
                          Connect
                        </Button>
                      </div>
                    )}
                  </Field>
                  <p className="mt-2 text-[13px] text-ink-faint">
                    We settle to this account the moment a sale clears.
                  </p>
                </div>

                <div className="mt-6">
                  <Field label="You get paid in">
                    <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface-solid px-[18px] py-[15px]">
                      <span className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-full bg-accent-slate-bg text-[13px] font-semibold text-primary">
                        $
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[15px] font-semibold text-ink">USDC</p>
                        <p className="text-[13px] text-ink-faint">A dollar, always worth a dollar</p>
                      </div>
                      <span className="flex-none rounded-full bg-fill px-3 py-1.5 text-[12px] text-ink-faint">
                        Fixed
                      </span>
                    </div>
                  </Field>
                </div>

                <Button
                  fullWidth
                  className="mt-[30px]"
                  disabled={!canContinuePayout}
                  onClick={() => setStep(2)}
                >
                  Continue
                </Button>
              </>
            )}

            {step === 2 && (
              <>
                <h1 className="mt-[22px] text-[28px] font-semibold tracking-tight text-ink sm:text-[30px]">
                  Look good?
                </h1>
                <p className="mt-1.5 text-[15px] text-ink-soft">
                  Here&apos;s your stall, exactly as the plaza will show it.
                </p>

                <StallPreviewCard data={data} initial={initial} className="mt-[22px]" />

                <div className="mt-5 flex flex-col gap-2.5">
                  <SummaryRow label="Payout" value={truncateAddress(data.payoutAddress)} mono />
                  <SummaryRow label="Paid in" value="USDC" />
                </div>

                <Button fullWidth className="mt-[26px]" onClick={() => setDone(true)}>
                  Open stall
                </Button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SuccessPanel({
  data,
  initial,
}: {
  data: OnboardingData;
  initial: string;
}) {
  const { bg } = accentClasses(data.accent);
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease }}
      className={`flex flex-col items-center rounded-[28px] border border-border-soft p-9 text-center sm:p-12 ${bg}`}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 16, delay: 0.1 }}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-solid"
      >
        <Check size={26} strokeWidth={2.2} className="text-ink" />
      </motion.div>
      <h1 className="mt-5 text-[28px] font-semibold tracking-tight text-ink sm:text-[30px]">
        Your stall is open
      </h1>
      <p className="mt-1.5 text-[15px] text-ink-soft">It&apos;s live in the plaza right now.</p>

      <StallPreviewCard data={data} initial={initial} className="mt-[26px] w-full text-left" />

      <Link href="/" className="mt-6 w-full">
        <Button variant="dark" fullWidth>
          View in the plaza
        </Button>
      </Link>
    </motion.div>
  );
}

function StallPreviewCard({
  data,
  initial,
  className = "",
}: {
  data: OnboardingData;
  initial: string;
  className?: string;
}) {
  const { bg } = accentClasses(data.accent);
  return (
    <div className={`overflow-hidden rounded-[26px] border border-border-soft bg-surface-solid ${className}`}>
      <div className={`flex h-[130px] p-[22px] ${bg}`}>
        <div className="flex-1 rounded-2xl border border-dashed border-ink/15 bg-surface-solid/60 font-mono text-[11px] text-ink/40" />
      </div>
      <div className="flex items-center gap-[13px] p-5">
        <AvatarTile label={initial} accent={data.accent} size="lg" />
        <div className="min-w-0">
          <p className="truncate text-[17px] font-semibold text-ink">
            {data.name || "Your stall name"}
          </p>
          <p className="truncate text-[13px] text-ink-faint">
            {data.tagline || "Your tagline goes here"}
          </p>
        </div>
      </div>
    </div>
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

function SummaryRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between text-[14px]">
      <span className="text-ink-faint">{label}</span>
      <span className={mono ? "font-mono text-ink" : "font-semibold text-ink"}>{value}</span>
    </div>
  );
}

function truncateAddress(address: string): string {
  if (!address) return "Not connected";
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}
