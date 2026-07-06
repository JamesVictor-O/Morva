"use client";

import { AvatarTile } from "@/components/ui/avatar-tile";
import { useAuth } from "@/lib/auth-context";

/** The signed-in buyer's avatar tile for topbars — their email's first
 *  letter, read live from AuthContext. No more hardcoded "AR" placeholder. */
export function UserAvatar({ className = "" }: { className?: string }) {
  const { user } = useAuth();
  const initial = (user?.email ?? "?").charAt(0).toUpperCase();
  return <AvatarTile label={initial} accent="purple" size="lg" className={`rounded-full ${className}`} />;
}
