"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { MagicUserMetadata } from "magic-sdk";
import type { Address } from "viem";
import { getMagic } from "./magic";
import { fetchUnifiedBalance, particleConfigured } from "./particle-balance";
import type { UnifiedBalance } from "./types";
import { AuthErrorModal } from "@/components/auth/auth-error-modal";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";
export type BalanceStatus = "idle" | "loading" | "ready" | "error";

export interface AuthUser {
  email: string | null;
  publicAddress: string | null;
}

interface AuthContextValue {
  status: AuthStatus;
  user: AuthUser | null;
  /** False when `NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY` isn't set — sign-in will
   *  surface an explanatory error instead of silently doing nothing. */
  configured: boolean;
  signOut: () => Promise<void>;
  /** Opens Magic's own hosted sign-in UI (email + OTP, entirely inside its
   *  iframe overlay — nothing custom to render here). If the visitor
   *  completes it, `redirectTo` (when given) is where they're sent — used
   *  by CTAs that point at a route the visitor hasn't earned access to
   *  yet. Closing Magic's overlay without finishing is a no-op, not an
   *  error. */
  requestSignIn: (redirectTo?: string) => void;
  /** Cross-chain balance, read live from the buyer's Particle Universal
   *  Account (EIP-7702 mode) once signed in. Never populated with mock
   *  data — `null` means "not fetched yet", check `balanceStatus`. */
  balance: UnifiedBalance | null;
  balanceStatus: BalanceStatus;
  refreshBalance: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}

function readUser(info: MagicUserMetadata): AuthUser {
  return { email: info.email, publicAddress: info.wallets.ethereum?.publicAddress ?? null };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [balance, setBalance] = useState<UnifiedBalance | null>(null);
  const [balanceStatus, setBalanceStatus] = useState<BalanceStatus>("idle");
  const [authError, setAuthError] = useState<string | null>(null);
  const configured = Boolean(process.env.NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY);

  const loadBalance = useCallback(async (address: Address | null) => {
    if (!address || !particleConfigured()) {
      setBalanceStatus("error");
      return;
    }
    setBalanceStatus("loading");
    try {
      const next = await fetchUnifiedBalance(address);
      setBalance(next);
      setBalanceStatus("ready");
    } catch (err) {
      console.error("[Morva] fetchUnifiedBalance failed:", err);
      setBalanceStatus("error");
    }
  }, []);

  // Shared by the mount-time session check and a fresh sign-in — both end
  // with the same "we have a logged-in Magic user" state to apply.
  const applySession = useCallback(
    (info: MagicUserMetadata) => {
      setUser(readUser(info));
      setStatus("authenticated");
      void loadBalance((info.wallets.ethereum?.publicAddress as Address | undefined) ?? null);
    },
    [loadBalance]
  );

  useEffect(() => {
    // The `await` below yields a microtask before any setState runs, so this
    // never resolves synchronously within the effect's commit — even for the
    // "no publishable key configured" branch.
    Promise.resolve()
      .then(() => getMagic())
      .then(async (magic) => {
        if (!magic) {
          setStatus("unauthenticated");
          return;
        }
        const loggedIn = await magic.user.isLoggedIn();
        if (!loggedIn) {
          setStatus("unauthenticated");
          return;
        }
        applySession(await magic.user.getInfo());
      })
      .catch(() => setStatus("unauthenticated"));
  }, [applySession]);

  const signOut = useCallback(async () => {
    const magic = getMagic();
    if (magic) await magic.user.logout();
    setUser(null);
    setStatus("unauthenticated");
    setBalance(null);
    setBalanceStatus("idle");
  }, []);

  const requestSignIn = useCallback(
    (redirectTo?: string) => {
      const magic = getMagic();
      if (!magic) {
        setAuthError("Sign-in isn't configured yet — set NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY.");
        return;
      }

      // Magic renders its own overlay for the whole flow (email, OTP,
      // everything) — we just wait for it to settle. Closing that overlay
      // without finishing rejects the promise, confirmed live: the
      // "closed-by-user" event does NOT fire for this (it apparently only
      // covers other dismissal paths), and the rejection isn't one of the
      // SDK's specific cancellation codes either — it's a generic
      // `MagicRPCError` (code -32603) whose message happens to read "User
      // canceled action." Matching on that text is the only thing that
      // actually distinguishes a cancel from a real failure here.
      magic.wallet
        .connectWithUI()
        .then(async () => {
          applySession(await magic.user.getInfo());
          if (redirectTo) router.push(redirectTo);
        })
        .catch((err) => {
          const message = err instanceof Error ? err.message : String(err);
          if (/cancel/i.test(message)) return;
          setAuthError(message || "Something went wrong. Try again.");
        });
    },
    [applySession, router]
  );

  const refreshBalance = useCallback(async () => {
    await loadBalance((user?.publicAddress as Address | null) ?? null);
  }, [loadBalance, user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      configured,
      signOut,
      requestSignIn,
      balance,
      balanceStatus,
      refreshBalance,
    }),
    [status, user, configured, signOut, requestSignIn, balance, balanceStatus, refreshBalance]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      <AuthErrorModal
        message={authError}
        onRetry={() => {
          setAuthError(null);
          requestSignIn();
        }}
        onClose={() => setAuthError(null)}
      />
    </AuthContext.Provider>
  );
}
