import type { SVGProps } from "react";

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/** A thin botanical sprig, used as a quiet corner ornament. */
export function Sprig({ className = "", ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 120 120" aria-hidden="true" className={className} {...props}>
      <g {...stroke} strokeWidth={1.1}>
        <path d="M18 104C34 88 56 62 82 30" />
        <path d="M42 78c-8-2-14-8-15-16 9 0 16 5 19 12" />
        <path d="M56 62c-8-3-13-9-13-17 9 1 15 6 17 13" />
        <path d="M68 46c-2-9 1-16 7-21 4 8 3 15-2 21" />
        <path d="M36 88c9 1 15 6 17 14-9 0-15-5-18-12" />
        <path d="M52 70c9 2 14 8 15 16-9-1-14-7-16-14" />
      </g>
    </svg>
  );
}

/** A row of small blossoms used as a section divider. */
export function BlossomRule({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-3 ${className}`} aria-hidden="true">
      <span className="h-px w-10 bg-gradient-to-r from-transparent to-gold/70 sm:w-16" />
      <svg viewBox="0 0 40 24" className="h-4 w-7 text-rose" {...stroke} strokeWidth={1.1}>
        <path d="M20 12c0-4 2-6 5-6s5 3 4 6c3-1 6 1 6 4s-3 4-6 3c1 3-1 5-4 5s-5-2-4-5c-3 1-6-1-6-4s3-5 6-3Z" />
        <circle cx="20" cy="12" r="1.6" className="fill-gold" stroke="none" />
      </svg>
      <span className="h-px w-10 bg-gradient-to-l from-transparent to-gold/70 sm:w-16" />
    </div>
  );
}

/** Delicate floral corner for cards. */
export function CornerFlourish({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" className={className} {...stroke} strokeWidth={0.9}>
      <path d="M4 96C18 74 30 46 60 18" opacity={0.55} />
      <path d="M30 64c-7-1-12-6-13-13 8 0 13 4 16 10" opacity={0.5} />
      <path d="M45 44c-6-3-10-8-9-15 7 2 11 6 12 12" opacity={0.5} />
      <path d="M62 26c0-7 4-12 10-15 3 7 1 12-4 16" opacity={0.5} />
      <circle cx="60" cy="18" r="2.4" className="fill-rose/50" stroke="none" />
    </svg>
  );
}

/** The printed seal that sits at the foot of the letter. */
export function WaxSeal({ initials = "Y", className = "" }: { initials?: string; className?: string }) {
  return (
    <span className={`relative inline-flex items-center justify-center ${className}`} aria-hidden="true">
      <svg viewBox="0 0 64 64" className="h-14 w-14 drop-shadow-[0_6px_10px_rgba(88,34,47,0.25)]">
        <defs>
          <radialGradient id="wax" cx="35%" cy="28%" r="75%">
            <stop offset="0%" stopColor="#a0475d" />
            <stop offset="55%" stopColor="#7d3347" />
            <stop offset="100%" stopColor="#5a2130" />
          </radialGradient>
        </defs>
        <path
          d="M32 3c9 0 13 4 18 8s9 9 9 18-4 15-9 19-9 9-18 9-14-5-19-9-9-10-9-19 4-14 9-18S23 3 32 3Z"
          fill="url(#wax)"
        />
        <circle cx="32" cy="32" r="20" fill="none" stroke="#f0cfd6" strokeOpacity="0.35" strokeWidth="1" />
        <text
          x="32"
          y="40"
          textAnchor="middle"
          fontFamily="'Playfair Display', Georgia, serif"
          fontSize="22"
          fill="#f6e2e6"
          fillOpacity="0.92"
        >
          {initials}
        </text>
      </svg>
    </span>
  );
}
