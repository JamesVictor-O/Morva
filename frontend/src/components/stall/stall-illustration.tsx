import type { StallIllustration } from "@/lib/types";

/**
 * Flat, minimal per-stall illustrations, replacing the plain dashed-box
 * placeholders. Drawn with currentColor + white only, so each one inherits
 * whatever accent-fg color its wrapping tile already sets — no illustration
 * ships its own fixed palette, so the tiles stay visually consistent across
 * every accent color rather than introducing a new one-off palette per icon.
 */
export function StallArt({
  illustration,
  className = "",
}: {
  illustration: StallIllustration;
  className?: string;
}) {
  const Icon = ILLUSTRATIONS[illustration];
  return <Icon className={className} />;
}

const ILLUSTRATIONS: Record<StallIllustration, (props: { className?: string }) => React.ReactNode> = {
  ceramics: Ceramics,
  plant: Plant,
  bread: Bread,
  "tote-bag": ToteBag,
  coffee: Coffee,
  book: Book,
  shoe: Shoe,
};

function Bread({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 140" className={className} fill="none">
      <ellipse cx="100" cy="120" rx="70" ry="10" fill="currentColor" opacity="0.15" />
      <ellipse cx="85" cy="88" rx="75" ry="42" fill="currentColor" />
      <g stroke="white" strokeOpacity="0.45" strokeWidth="3.5" strokeLinecap="round">
        <line x1="55" y1="64" x2="70" y2="106" />
        <line x1="70" y1="61" x2="86" y2="109" />
        <line x1="86" y1="59" x2="102" y2="109" />
        <line x1="102" y1="61" x2="115" y2="105" />
      </g>
      <ellipse cx="156" cy="99" rx="30" ry="26" fill="currentColor" opacity="0.8" />
      <line x1="141" y1="99" x2="170" y2="99" stroke="white" strokeOpacity="0.45" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  );
}

function Ceramics({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 140" className={className} fill="none">
      <ellipse cx="100" cy="118" rx="80" ry="10" fill="currentColor" opacity="0.12" />
      <ellipse cx="100" cy="104" rx="78" ry="18" fill="white" />
      <ellipse cx="100" cy="102" rx="54" ry="10" fill="currentColor" opacity="0.15" />
      <path d="M45 92 a35 30 0 0 0 70 0 Z" fill="white" />
      <path d="M45 92 a35 30 0 0 0 70 0" fill="none" stroke="currentColor" strokeOpacity="0.12" strokeWidth="3" />
      <rect x="128" y="52" width="42" height="45" rx="9" fill="currentColor" />
      <path d="M170 62 a14 14 0 0 1 0 28" stroke="currentColor" strokeWidth="7" fill="none" strokeLinecap="round" />
      <ellipse cx="149" cy="52" rx="21" ry="6" fill="white" opacity="0.65" />
    </svg>
  );
}

function Coffee({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 140" className={className} fill="none">
      <ellipse cx="100" cy="118" rx="60" ry="9" fill="currentColor" opacity="0.12" />
      <ellipse cx="100" cy="104" rx="55" ry="13" fill="white" />
      <rect x="72" y="54" width="60" height="50" rx="7" fill="currentColor" />
      <ellipse cx="102" cy="54" rx="30" ry="8" fill="white" />
      <ellipse cx="102" cy="54" rx="20" ry="5" fill="currentColor" opacity="0.55" />
      <path d="M135 61 a12 12 0 0 1 0 24" stroke="currentColor" strokeWidth="6" fill="none" strokeLinecap="round" />
      <g stroke="currentColor" strokeOpacity="0.35" strokeWidth="3" fill="none" strokeLinecap="round">
        <path d="M88 39 q-6 -8 0 -16 q6 -8 0 -16" />
        <path d="M102 39 q-6 -8 0 -16 q6 -8 0 -16" />
        <path d="M116 39 q-6 -8 0 -16 q6 -8 0 -16" />
      </g>
    </svg>
  );
}

function ToteBag({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 140" className={className} fill="none">
      <ellipse cx="100" cy="122" rx="55" ry="9" fill="currentColor" opacity="0.12" />
      <path d="M70 57 a20 22 0 0 1 40 0" stroke="currentColor" strokeWidth="7" fill="none" strokeLinecap="round" />
      <path d="M90 57 a20 22 0 0 1 40 0" stroke="currentColor" strokeWidth="7" fill="none" strokeLinecap="round" />
      <rect x="60" y="57" width="80" height="63" rx="10" fill="currentColor" />
      <rect x="60" y="57" width="80" height="18" rx="10" fill="white" opacity="0.22" />
      <rect x="75" y="76" width="50" height="34" rx="6" fill="none" stroke="white" strokeOpacity="0.45" strokeDasharray="4 4" />
    </svg>
  );
}

function Plant({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 140" className={className} fill="none">
      <ellipse cx="100" cy="122" rx="45" ry="8" fill="currentColor" opacity="0.12" />
      <path d="M85 105 h30 l-6 20 h-18 Z" fill="currentColor" />
      <rect x="80" y="98" width="40" height="10" rx="5" fill="white" />
      <line x1="100" y1="98" x2="100" y2="65" stroke="currentColor" strokeWidth="4" />
      <ellipse cx="100" cy="50" rx="14" ry="24" fill="currentColor" />
      <ellipse cx="100" cy="50" rx="6" ry="16" fill="white" opacity="0.28" />
      <ellipse cx="72" cy="66" rx="13" ry="22" fill="currentColor" opacity="0.82" transform="rotate(-30 72 66)" />
      <ellipse cx="128" cy="66" rx="13" ry="22" fill="currentColor" opacity="0.82" transform="rotate(30 128 66)" />
    </svg>
  );
}

function Shoe({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 140" className={className} fill="none">
      <ellipse cx="100" cy="122" rx="70" ry="9" fill="currentColor" opacity="0.12" />
      <path
        d="M22 106 q0 15 15 15 h128 q17 0 17 -15 q0 -9 -11 -11 l-15 -3 q-5 -1 -5 -6 v-7 h-116 q-13 0 -13 13 Z"
        fill="currentColor"
      />
      <path
        d="M36 83 q0 -23 27 -31 q20 -6 39 -2 q23 4 35 19 l14 16 q4 5 -2 6 h-101 q-12 0 -12 -8 Z"
        fill="white"
      />
      <path
        d="M36 83 q0 -23 27 -31 q20 -6 39 -2 q23 4 35 19 l14 16"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.15"
        strokeWidth="3"
      />
      <g stroke="currentColor" strokeOpacity="0.4" strokeWidth="3" strokeLinecap="round">
        <line x1="58" y1="65" x2="82" y2="59" />
        <line x1="63" y1="75" x2="88" y2="69" />
        <line x1="68" y1="85" x2="94" y2="79" />
      </g>
    </svg>
  );
}

function Book({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 140" className={className} fill="none">
      <ellipse cx="100" cy="118" rx="55" ry="9" fill="currentColor" opacity="0.12" />
      <rect x="45" y="90" width="52" height="14" rx="2" fill="currentColor" opacity="0.7" transform="rotate(-8 71 97)" />
      <rect x="103" y="88" width="55" height="14" rx="2" fill="currentColor" opacity="0.85" transform="rotate(4 130 95)" />
      <path d="M62 90 q38 -18 76 0 v-45 q-38 -16 -76 0 Z" fill="white" />
      <line x1="100" y1="45" x2="100" y2="90" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2" />
      <g stroke="currentColor" strokeOpacity="0.3" strokeWidth="2">
        <line x1="70" y1="55" x2="94" y2="52" />
        <line x1="70" y1="65" x2="94" y2="62" />
        <line x1="70" y1="75" x2="94" y2="72" />
        <line x1="106" y1="52" x2="130" y2="55" />
        <line x1="106" y1="62" x2="130" y2="65" />
        <line x1="106" y1="72" x2="130" y2="75" />
      </g>
    </svg>
  );
}
