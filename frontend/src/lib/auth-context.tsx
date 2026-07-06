"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { MagicUserMetadata } from "magic-sdk";
import type { Address } from "viem";
import { getMagic } from "./magic";
import { fetchUnifiedBalance, particleConfigured } from "./particle-balance";
import type { UnifiedBalance } from "./types";
import { SignInModal } from "@/components/auth/sign-in-modal";

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
  signIn: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  /** Opens the sign-in modal. If the user completes it, `redirectTo` (when
   *  given) is where they're sent — used by CTAs that point at a route the
   *  visitor hasn't earned access to yet. */
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
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [balance, setBalance] = useState<UnifiedBalance | null>(null);
  const [balanceStatus, setBalanceStatus] = useState<BalanceStatus>("idle");
  const [modal, setModal] = useState<{ open: boolean; redirectTo?: string }>({ open: false });
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
    } catch {
      setBalanceStatus("error");
    }
  }, []);

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
        const info = await magic.user.getInfo();
        setUser(readUser(info));
        setStatus("authenticated");
        void loadBalance((info.wallets.ethereum?.publicAddress as Address | undefined) ?? null);
      })
      .catch(() => setStatus("unauthenticated"));
  }, [loadBalance]);

  const signIn = useCallback(
    async (email: string) => {
      const magic = getMagic();
      if (!magic) {
        throw new Error("Sign-in isn't configured yet — set NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY.");
      }
      await magic.auth.loginWithEmailOTP({ email, showUI: true });
      const info = await magic.user.getInfo();
      setUser(readUser(info));
      setStatus("authenticated");
      void loadBalance((info.wallets.ethereum?.publicAddress as Address | undefined) ?? null);
    },
    [loadBalance]
  );

  const signOut = useCallback(async () => {
    const magic = getMagic();
    if (magic) await magic.user.logout();
    setUser(null);
    setStatus("unauthenticated");
    setBalance(null);
    setBalanceStatus("idle");
  }, []);

  const requestSignIn = useCallback((redirectTo?: string) => {
    setModal({ open: true, redirectTo });
  }, []);

  const refreshBalance = useCallback(async () => {
    await loadBalance((user?.publicAddress as Address | null) ?? null);
  }, [loadBalance, user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      configured,
      signIn,
      signOut,
      requestSignIn,
      balance,
      balanceStatus,
      refreshBalance,
    }),
    [status, user, configured, signIn, signOut, requestSignIn, balance, balanceStatus, refreshBalance]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      <SignInModal
        open={modal.open}
        redirectTo={modal.redirectTo}
        onClose={() => setModal({ open: false })}
      />
    </AuthContext.Provider>
  );
}
