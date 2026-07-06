"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";

/**
 * A CTA that requires sign-in before it'll actually go anywhere. Looks and
 * reads exactly like the destination it points to — clicking it while
 * signed out opens the sign-in modal instead of navigating, then continues
 * on to `href` automatically once that succeeds.
 */
export function ProtectedCta({
  href,
  variant = "primary",
  className = "",
  children,
}: {
  href: string;
  variant?: "primary" | "dark" | "ghost";
  className?: string;
  children: React.ReactNode;
}) {
  const { status, requestSignIn } = useAuth();
  const router = useRouter();

  function handleClick() {
    if (status === "authenticated") {
      router.push(href);
    } else {
      requestSignIn(href);
    }
  }

  return (
    <Button variant={variant} className={className} onClick={handleClick}>
      {children}
    </Button>
  );
}
