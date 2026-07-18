"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ArrowLeft, Check, CheckCircle2, ChevronDown, Copy, ExternalLink, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AvatarTile } from "@/components/ui/avatar-tile";
import { MediaImage } from "@/components/ui/media-image";
import { ChainBreakdown } from "@/components/checkout/chain-breakdown";
import { SignInGate } from "@/components/auth/sign-in-gate";
import { useAuth } from "@/lib/auth-context";
import { useCart, type ResolvedCartLine } from "@/lib/cart-context";
import { getMagic } from "@/lib/magic";
import { MagicSigner } from "@/lib/magic-signer";
import { createPendingOrder, markOrderFailed, markOrderSettled } from "@/lib/actions/orders";
import { formatUsd } from "@/lib/format";
import type { Stall } from "@/lib/types";
import { createMorva, SettlementTimeout, type PaymentStatus as SdkPaymentStatus } from "@morva/sdk";

const ease = [0.25, 0.46, 0.45, 0.94] as const;

type Step = "review" | "processing" | "success";

// Only USDC on Arbitrum One is wired up in Plaza today — a Plaza scope
// choice (stalls don't yet store a payout chain/token beyond this), not an
// SDK limitation; @morva/sdk itself supports settling to any of
// SUPPORTED_SETTLEMENT_CHAIN_IDS. This exact address is the one already
// proven live by sdk/scripts/e2e-payment.ts (Gate 2), not a freshly-typed
// one. A stall configured for any other payout token shows a clear error
// at pay time rather than attempting a transfer to a guessed address.
const TOKEN_ADDRESSES: Record<string, `0x${string}`> = {
  USDC: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
};

const STATUS_LABEL: Record<SdkPaymentStatus, string> = {
  building: "Preparing your payment…",
  authorizing: "Authorizing your wallet…",
  signing: "Waiting for your signature…",
  submitted: "Submitting…",
  settled: "Settled!",
  unknown: "Still confirming…",
  failed: "Something went wrong.",
};

interface CompletedOrder {
  orderNumber: string;
  lines: ResolvedCartLine[];
  total: number;
  email: string;
  transactionId: string;
  explorerUrl: string;
}

export function CheckoutPageClient({ stall }: { stall: Stall }) {
  const { status, user, balance, balanceStatus, refreshBalance } = useAuth();
  const cart = useCart();

  const [step, setStep] = useState<Step>("review");
  const [email, setEmail] = useState(user?.email ?? "");
  const [breakdownOpen, setBreakdownOpen] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<CompletedOrder | null>(null);
  const [payStatusLabel, setPayStatusLabel] = useState<string | null>(null);
  const [payError, setPayError] = useState<string | null>(null);
  // Set only when a payment's settlement couldn't be confirmed in time
  // (SettlementTimeout) — genuinely unresolved, not a confirmed failure,
  // so the order is deliberately left "pending" rather than marked
  // failed. Clicking pay again resumes checking this exact transaction
  // instead of submitting a brand new transfer for the same order.
  const [unresolvedAttempt, setUnresolvedAttempt] = useState<{
    orderId: string;
    orderNumber: string;
    transactionId: string;
    total: number;
  } | null>(null);

  if (status !== "authenticated") {
    return (
      <SignInGate title="Sign in to check out" body="You'll need an account to pay for your order." />
    );
  }

  if (step === "success" && completedOrder) {
    return <SuccessView stall={stall} order={completedOrder} />;
  }

  const lines = cart.resolvedLines();
  const cartMatchesStall = cart.stallSlug === stall.slug && lines.length > 0;

  if (!cartMatchesStall) {
    return <EmptyCartView stall={stall} />;
  }

  const total = lines.reduce((sum, line) => sum + line.lineTotalUsd, 0);
  const balanceLoading = balanceStatus === "loading" || balanceStatus === "idle";
  const balanceError = balanceStatus === "error";
  const covers = balanceStatus === "ready" && (balance?.totalUsd ?? 0) >= total;
  const remaining = (balance?.totalUsd ?? 0) - total;
  const shortfall = total - (balance?.totalUsd ?? 0);

  async function handlePay() {
    if (!covers || !user?.publicAddress) return;

    const tokenAddress = TOKEN_ADDRESSES[stall.payoutToken ?? "USDC"];
    if (!tokenAddress) {
      setPayError(`This stall settles in ${stall.payoutToken}, which checkout doesn't support yet.`);
      return;
    }

    setStep("processing");
    setPayError(null);
    setPayStatusLabel(STATUS_LABEL.building);

    let orderId: string | undefined;
    let orderNumber: string | undefined;
    try {
      // Resuming a payment whose settlement we couldn't confirm last
      // time — reuse the same order and transaction instead of creating
      // a new pending order and submitting a second transfer for it. Only
      // valid if the cart hasn't changed since — a different total means
      // a different intent, so resuming the old transaction would be wrong.
      const resumable = unresolvedAttempt && unresolvedAttempt.total === total ? unresolvedAttempt : null;
      const pending = resumable
        ? { orderId: resumable.orderId, orderNumber: resumable.orderNumber }
        : await createPendingOrder({
            stallId: stall.id,
            buyerAddress: user.publicAddress,
            buyerEmail: email || undefined,
            lines: lines.map((line) => ({ productId: line.productId, quantity: line.quantity })),
          });
      orderId = pending.orderId;
      orderNumber = pending.orderNumber;

      const magic = getMagic();
      if (!magic) throw new Error("Sign-in isn't configured.");

      const morva = createMorva({
        particle: {
          projectId: process.env.NEXT_PUBLIC_PARTICLE_PROJECT_ID!,
          projectClientKey: process.env.NEXT_PUBLIC_PARTICLE_CLIENT_KEY!,
          projectAppUuid: process.env.NEXT_PUBLIC_PARTICLE_APP_ID!,
        },
      });
      const signer = new MagicSigner(magic, user.publicAddress as `0x${string}`);
      const session = await morva.connect(signer);

      const intent = morva.createDirectIntent({
        // USDC has 6 on-chain decimals — .toFixed(2) here would silently
        // round any sub-cent total to "0.00" and pay literally nothing
        // (confirmed live: a $0.001 item settled a real, verifiable
        // transaction that moved zero value). 6 matches what's actually
        // being sent to a 6-decimal token.
        amount: total.toFixed(6),
        orderId: pending.orderNumber,
        settlementToken: tokenAddress,
        settlementRecipient: stall.payoutAddress as `0x${string}`,
        // Explicit, not just relying on the SDK's default: Morva Plaza
        // settles on Arbitrum One today (stalls don't yet have a
        // per-merchant chain preference — see TOKEN_ADDRESSES above). The
        // SDK itself supports any of SUPPORTED_SETTLEMENT_CHAIN_IDS.
        settlementChainId: 42161,
      });

      const result = await session.pay(intent, {
        onStatus: (status) => setPayStatusLabel(STATUS_LABEL[status]),
        resumeTransactionId: resumable?.transactionId,
      });

      setUnresolvedAttempt(null);
      await markOrderSettled(pending.orderId, result);

      setCompletedOrder({
        orderNumber: pending.orderNumber,
        lines,
        total,
        email,
        transactionId: result.transactionId,
        explorerUrl: result.explorerUrl,
      });
      setStep("success");
      cart.clear();
    } catch (err) {
      // err.message alone (what's shown below and persisted to the order)
      // is a generic wrapper — the actual underlying reason from Particle
      // is on .cause and otherwise never surfaces anywhere.
      console.error("[Morva] checkout payment failed:", err, err instanceof Error ? err.cause : undefined);

      if (err instanceof SettlementTimeout) {
        // Genuinely unresolved, not a confirmed failure — the payment may
        // still land. Leave the order "pending" (never call
        // markOrderFailed for this) and remember the transactionId so the
        // next pay() click resumes checking THIS transaction instead of
        // submitting a second transfer for the same order.
        if (orderId && orderNumber) {
          setUnresolvedAttempt({
            orderId,
            orderNumber,
            transactionId: err.transactionId,
            total,
          });
        }
        setPayError(
          "We couldn't confirm this payment in time, but it may still complete. Wait a moment, then try again — we'll pick up checking the same payment rather than charging you twice."
        );
        setStep("review");
        return;
      }

      if (orderId) {
        await markOrderFailed(orderId, err instanceof Error ? err.message : "Unknown error").catch(() => {});
      }
      setPayError(err instanceof Error ? err.message : "Payment failed. Try again.");
      setStep("review");
    } finally {
      setPayStatusLabel(null);
    }
  }

  return (
    <div className="min-h-screen bg-surface">
      <div className="h-1.5 bg-ink" />
      <header className="mx-auto flex max-w-[1100px] items-center justify-between px-5 py-6 sm:px-8">
        <Link
          href={`/stalls/${stall.slug}`}
          className="flex items-center gap-2 text-[14px] text-ink-faint transition-colors hover:text-ink"
        >
          <ArrowLeft size={16} strokeWidth={1.8} />
          Back to {stall.name}
        </Link>
        <span className="flex items-center gap-1.5 text-[13px] text-ink-faint">
          <Lock size={13} strokeWidth={1.8} />
          Secured by Morva
        </span>
      </header>

      <main className="mx-auto grid max-w-[1100px] gap-8 px-5 pb-20 sm:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-start lg:gap-12">
        {/* Left: order review */}
        {/* min-w-0: grid items default to min-width:auto, which lets a
            nowrap-truncated child's full intrinsic text width force this
            column (and the whole grid/page) wider than the viewport. */}
        <div className="min-w-0">
          <p className="text-[15px] text-ink-soft">You&apos;re paying</p>
          <p className="mt-1 text-[52px] font-semibold leading-none tracking-tight text-ink sm:text-[60px]">
            ${formatUsd(total)}
          </p>

          <div className="mt-8 flex flex-col divide-y divide-divider rounded-[24px] border border-border-soft bg-surface-solid">
            {lines.map((line) => (
              <div key={line.productId} className="flex items-center gap-4 p-5">
                <MediaImage
                  src={line.photoUrl}
                  alt={line.name}
                  sizes="72px"
                  aspectRatio="1 / 1"
                  className="w-[72px] flex-none rounded-2xl bg-fill"
                  fallback={
                    <div className="flex h-full w-full items-center justify-center">
                      <AvatarTile label={stall.initial} accent={stall.accent} size="lg" />
                    </div>
                  }
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[16px] font-semibold text-ink">{line.name}</p>
                  <p className="mt-0.5 truncate text-[13px] text-ink-faint">
                    {line.meta} · qty {line.quantity}
                  </p>
                </div>
                <p className="flex-none text-[16px] font-semibold text-ink">
                  ${formatUsd(line.lineTotalUsd)}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-col gap-2.5 text-[15px]">
            <div className="flex items-center justify-between text-ink-soft">
              <span>Subtotal</span>
              <span>${formatUsd(total)}</span>
            </div>
            <div className="flex items-center justify-between text-ink-soft">
              <span>Shipping</span>
              <span>Free</span>
            </div>
            <div className="flex items-center justify-between text-ink-soft">
              <span>Network fees</span>
              <span className="text-success-fg">Covered by Morva</span>
            </div>
            <div className="mt-1.5 flex items-center justify-between border-t border-border-soft pt-2.5 text-[18px] font-semibold text-ink">
              <span>Total</span>
              <span>${formatUsd(total)}</span>
            </div>
          </div>
        </div>

        {/* Right: pay with balance */}
        <div className="rounded-[28px] border border-border-soft bg-surface-solid p-7 sm:p-8">
          <p className="text-[21px] font-semibold tracking-tight text-ink">Pay with your balance</p>
          <p className="mt-1 text-[14px] text-ink-soft">One balance. We handle the rest.</p>

          <div className="mt-6 rounded-2xl border border-border-soft p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[13px] text-ink-faint">Your balance</p>
                <p className={`mt-0.5 text-[26px] font-semibold tracking-tight text-ink ${balanceLoading ? "animate-pulse" : ""}`}>
                  {balanceError ? "Unavailable" : balanceLoading ? "…" : `$${formatUsd((balance?.totalUsd ?? 0))}`}
                </p>
              </div>
              {balanceError ? (
                <button
                  onClick={() => refreshBalance()}
                  className="flex-none rounded-full bg-fill px-[14px] py-2 text-[13px] font-medium text-ink-soft transition-colors hover:bg-border-soft"
                >
                  Retry
                </button>
              ) : (
                !balanceLoading &&
                balance && (
                  <button
                    onClick={() => setBreakdownOpen((o) => !o)}
                    className="flex flex-none items-center gap-[7px] rounded-full bg-fill px-[14px] py-2 text-[13px] text-ink-soft"
                  >
                    Held across {balance.chains.length} networks
                    <ChevronDown
                      size={14}
                      className={`transition-transform duration-200 ${breakdownOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                )
              )}
            </div>
            <AnimatePresence>
              {breakdownOpen && balance && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease }}
                  className="overflow-hidden"
                >
                  <div className="mt-3.5 border-t border-divider pt-1.5">
                    <ChainBreakdown chains={balance.chains} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {!balanceError && !balanceLoading && (
            <div className="mt-4 flex items-center justify-between text-[14px] text-ink-soft">
              <span>Balance after this order</span>
              <span className={`font-semibold ${covers ? "text-ink" : "text-error-fg"}`}>
                ${formatUsd(covers ? remaining : (balance?.totalUsd ?? 0))}
              </span>
            </div>
          )}

          {balanceStatus === "ready" && !covers && (
            <div className="mt-4 rounded-2xl bg-error-bg p-4">
              <p className="flex items-center gap-2 text-[13px] font-semibold text-error-fg">
                <AlertTriangle size={15} strokeWidth={2} />
                Not enough in your balance
              </p>
              <p className="mt-1 text-[12.5px] leading-[1.4] text-error-fg-soft">
                You&apos;re ${formatUsd(shortfall)} short.
              </p>
            </div>
          )}

          <label className="mt-5 block">
            <span className="text-[13px] font-medium text-ink-soft">Send my receipt to</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mt-2 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-[15px] text-ink outline-none transition-colors focus:border-primary"
            />
          </label>

          <Button
            onClick={handlePay}
            fullWidth
            className="mt-5"
            disabled={balanceLoading || balanceError || !covers || step === "processing"}
          >
            {step === "processing"
              ? (payStatusLabel ?? "Moving your funds…")
              : balanceLoading
                ? "Checking your balance…"
                : `Pay $${formatUsd(total)}`}
          </Button>

          {payError && (
            <p className="mt-3 text-center text-[13px] text-error-fg">{payError}</p>
          )}

          <p className="mt-4 text-center text-[12px] leading-[1.5] text-ink-whisper">
            By paying you agree to Morva&apos;s terms.
            <br />
            Chain names, gas and bridging are handled for you.
          </p>
        </div>
      </main>
    </div>
  );
}

function EmptyCartView({ stall }: { stall: Stall }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-5 text-center">
      <p className="text-[24px] font-semibold tracking-tight text-ink">Your cart is empty</p>
      <p className="mt-2 max-w-[340px] text-[15px] text-ink-soft">
        Add something from {stall.name} before checking out.
      </p>
      <Link href={`/stalls/${stall.slug}`} className="mt-6">
        <Button className="px-7 py-3.5">Back to {stall.name}</Button>
      </Link>
    </div>
  );
}

function SuccessView({ stall, order }: { stall: Stall; order: CompletedOrder }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(order.orderNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard access denied — not worth surfacing an error for.
    }
  }

  return (
    <div className="min-h-screen bg-surface px-5 py-16 sm:py-20">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease }}
        className="mx-auto max-w-[560px] text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 220, damping: 16, delay: 0.1 }}
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success-bg"
        >
          <CheckCircle2 size={30} className="text-success-fg" />
        </motion.div>
        <p className="mt-5 text-[28px] font-semibold tracking-tight text-ink">Thank you for your order!</p>
        <p className="mt-1.5 text-[15px] text-ink-soft">
          Paid from your balance — {stall.name} has been notified.
        </p>

        <div className="mt-6 inline-flex items-center gap-3 rounded-2xl border border-border-soft bg-surface-solid px-5 py-3">
          <div className="text-left">
            <p className="text-[12px] text-ink-faint">Order number</p>
            <p className="font-mono text-[14px] font-semibold text-ink">{order.orderNumber}</p>
          </div>
          <button
            onClick={handleCopy}
            aria-label="Copy order number"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-fill text-ink-faint transition-colors hover:bg-border-soft"
          >
            {copied ? <Check size={14} className="text-success-fg" /> : <Copy size={14} />}
          </button>
        </div>

        {order.email && (
          <p className="mt-3 text-[13px] text-ink-faint">
            Order confirmation sent to <span className="text-ink-soft">{order.email}</span>
          </p>
        )}

        <a
          href={order.explorerUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-soft transition-colors hover:text-ink"
        >
          View transaction
          <ExternalLink size={13} strokeWidth={1.8} />
        </a>

        <div className="mt-8 overflow-hidden rounded-[24px] border border-border-soft bg-surface-solid text-left">
          <p className="border-b border-border-soft px-5 py-4 text-[15px] font-semibold text-ink">
            Order summary
          </p>
          <div className="flex flex-col divide-y divide-divider">
            {order.lines.map((line) => (
              <div key={line.productId} className="flex items-center gap-4 px-5 py-4">
                <MediaImage
                  src={line.photoUrl}
                  alt={line.name}
                  sizes="52px"
                  aspectRatio="1 / 1"
                  className="w-[52px] flex-none rounded-xl bg-fill"
                  fallback={
                    <div className="flex h-full w-full items-center justify-center">
                      <AvatarTile label={stall.initial} accent={stall.accent} size="md" />
                    </div>
                  }
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-semibold text-ink">{line.name}</p>
                  <p className="text-[12px] text-ink-faint">Qty {line.quantity}</p>
                </div>
                <p className="flex-none text-[14px] font-semibold text-ink">
                  ${formatUsd(line.lineTotalUsd)}
                </p>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between border-t border-border-soft px-5 py-4 text-[16px] font-semibold text-ink">
            <span>Total</span>
            <span>${formatUsd(order.total)}</span>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link href={`/stalls/${stall.slug}`}>
            <Button variant="dark" className="px-7 py-3.5">
              Back to {stall.name}
            </Button>
          </Link>
          <Link href="/orders" className="text-[14px] font-semibold text-ink">
            View your orders
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
