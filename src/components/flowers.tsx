/**
 * Hand-drawn style botanical illustrations. Pure SVG, no images, no animation
 * here — layers that move live in bouquet.tsx.
 */

type FlowerTone = {
  petalLight: string;
  petalMid: string;
  petalDeep: string;
  heart: string;
  leaf: string;
};

export const TONES: Record<string, FlowerTone> = {
  blush: { petalLight: "#fbe9ee", petalMid: "#e8b3c1", petalDeep: "#c47f92", heart: "#f3d6a8", leaf: "#8fa08b" },
  rose: { petalLight: "#f3d2da", petalMid: "#d99baa", petalDeep: "#b4637a", heart: "#e8c391", leaf: "#7f9179" },
  burgundy: { petalLight: "#c88b9b", petalMid: "#9b4a60", petalDeep: "#6d2739", heart: "#d8b77a", leaf: "#6f8168" },
  ivory: { petalLight: "#fffdf8", petalMid: "#f7ecdc", petalDeep: "#e2cfb4", heart: "#d8b77a", leaf: "#93a48d" },
  gold: { petalLight: "#f6e6c4", petalMid: "#e6cda0", petalDeep: "#cbab74", heart: "#b9925a", leaf: "#8a9b83" },
  sage: { petalLight: "#eef2ea", petalMid: "#cfd9c9", petalDeep: "#a6b6a0", heart: "#d8b77a", leaf: "#8fa08b" },
};

const uid = (prefix: string, tone: string) =>
  `${prefix}-${tone}-${Math.abs(tone.length * 7 + prefix.length * 13)}`;

/** One rounded petal anchored at its base, pointing up. */
function petalPath(height: number, width: number): string {
  const h = height;
  const w = width;
  const f = (value: number) => value.toFixed(1);
  return [
    "M0 0",
    `C${f(-w * 0.62)} ${f(-h * 0.2)} ${f(-w * 0.6)} ${f(-h * 0.66)} ${f(-w * 0.34)} ${f(-h * 0.92)}`,
    `C${f(-w * 0.15)} ${f(-h * 1.02)} ${f(w * 0.15)} ${f(-h * 1.02)} ${f(w * 0.34)} ${f(-h * 0.92)}`,
    `C${f(w * 0.6)} ${f(-h * 0.66)} ${f(w * 0.62)} ${f(-h * 0.2)} 0 0`,
    "Z",
  ].join(" ");
}

type RoseLayer = { count: number; offset: number; height: number; width: number; core: boolean; tilt: number };

const ROSE_LAYERS: RoseLayer[] = [
  { count: 5, offset: 0, height: 80, width: 58, core: false, tilt: 0 },
  { count: 6, offset: 24, height: 64, width: 50, core: false, tilt: 3 },
  { count: 5, offset: 48, height: 48, width: 40, core: true, tilt: -4 },
  { count: 4, offset: 20, height: 32, width: 28, core: true, tilt: 6 },
];

/**
 * A layered garden rose, drawn by hand out of petals so it can scale cleanly
 * from a 24px icon to the centrepiece of the bouquet.
 */
export function Rose({
  tone = "rose",
  className = "",
  size = 120,
}: {
  tone?: keyof typeof TONES | string;
  className?: string;
  size?: number;
}) {
  const t = TONES[tone] ?? TONES.rose;
  const id = uid("rose", String(tone));

  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      role="presentation"
    >
      <defs>
        <radialGradient id={`${id}-outer`} cx="46%" cy="36%" r="72%">
          <stop offset="0%" stopColor={t.petalLight} />
          <stop offset="46%" stopColor={t.petalMid} />
          <stop offset="100%" stopColor={t.petalDeep} />
        </radialGradient>
        <radialGradient id={`${id}-core`} cx="50%" cy="42%" r="60%">
          <stop offset="0%" stopColor={t.petalLight} />
          <stop offset="70%" stopColor={t.petalMid} />
          <stop offset="100%" stopColor={t.petalDeep} />
        </radialGradient>
      </defs>

      {ROSE_LAYERS.map((layer, layerIndex) =>
        Array.from({ length: layer.count }, (_, index) => {
          const angle = layer.offset + index * (360 / layer.count);
          return (
            <g
              key={`${layerIndex}-${index}`}
              transform={`rotate(${angle.toFixed(1)} 100 100) translate(100 100)`}
            >
              <path
                d={petalPath(layer.height, layer.width)}
                fill={`url(#${id}-${layer.core ? "core" : "outer"})`}
                stroke={t.petalDeep}
                strokeOpacity={layer.core ? 0.2 : 0.16}
                strokeWidth="0.8"
                transform={`rotate(${layer.tilt})`}
              />
            </g>
          );
        }),
      )}

      {/* the rolled heart */}
      {[0, 90, 180, 270].map((angle) => (
        <g key={angle} transform={`rotate(${angle + 12} 100 100) translate(100 100)`}>
          <path
            d="M0 0 C-9 -6 -11 -17 -3 -21 C2 -23 7 -20 8 -14 C9 -8 5 -2 0 0 Z"
            fill={`url(#${id}-core)`}
            stroke={t.petalDeep}
            strokeOpacity="0.25"
            strokeWidth="0.7"
          />
        </g>
      ))}
      <circle cx="100" cy="98" r="2.6" fill={t.heart} opacity="0.95" />
      <circle cx="100" cy="102" r="26" fill={t.petalDeep} opacity="0.07" />
    </svg>
  );
}

export function Tulip({
  tone = "blush",
  className = "",
  size = 90,
}: {
  tone?: keyof typeof TONES | string;
  className?: string;
  size?: number;
}) {
  const t = TONES[tone] ?? TONES.blush;
  const id = uid("tulip", String(tone));
  return (
    <svg viewBox="0 0 90 120" width={size} height={size * (4 / 3)} className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-p`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={t.petalLight} />
          <stop offset="60%" stopColor={t.petalMid} />
          <stop offset="100%" stopColor={t.petalDeep} />
        </linearGradient>
      </defs>
      <path d="M45 62V112" stroke={t.leaf} strokeWidth="2.6" strokeLinecap="round" />
      <path d="M45 96C34 92 27 84 25 72C37 74 44 82 45 96Z" fill={t.leaf} opacity="0.9" />
      <path d="M45 104C56 100 63 92 64 80C52 82 46 90 45 104Z" fill={t.leaf} opacity="0.75" />
      <path d="M45 64C23 60 20 34 30 22C35 16 40 18 45 22C50 18 55 16 60 22C70 34 67 60 45 64Z" fill={`url(#${id}-p)`} />
      <path d="M45 24C45 34 45 50 45 62" stroke={t.petalDeep} strokeOpacity="0.28" strokeWidth="1.1" strokeLinecap="round" />
      <path d="M45 22C40 30 37 44 39 58" fill="none" stroke={t.petalLight} strokeOpacity="0.7" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M45 22C50 30 53 44 51 58" fill="none" stroke={t.petalDeep} strokeOpacity="0.22" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function BabyBreath({
  className = "",
  size = 90,
  tone = "ivory",
}: {
  className?: string;
  size?: number;
  tone?: keyof typeof TONES | string;
}) {
  const t = TONES[tone] ?? TONES.ivory;
  const springs: [number, number, number][] = [
    [45, 40, 1],
    [30, 56, 0.82],
    [60, 54, 0.78],
    [38, 74, 0.66],
    [54, 76, 0.6],
  ];
  return (
    <svg viewBox="0 0 90 120" width={size} height={size * (4 / 3)} className={className} aria-hidden="true">
      <g stroke={t.leaf} strokeWidth="0.9" fill="none" opacity="0.75">
        <path d="M45 112C45 92 45 74 45 62" />
        <path d="M45 90C40 84 34 76 31 64" />
        <path d="M45 88C51 82 57 74 60 62" />
        <path d="M45 96C42 88 39 82 37 82" />
      </g>
      {springs.map(([cx, cy, scale], index) => (
        <g key={index} transform={`translate(${cx} ${cy}) scale(${scale})`}>
          {[0, 72, 144, 216, 288].map((angle) => (
            <ellipse
              key={angle}
              cx="0"
              cy="-4.6"
              rx="2.5"
              ry="4.1"
              fill={t.petalLight}
              stroke={t.petalDeep}
              strokeOpacity="0.25"
              strokeWidth="0.5"
              transform={`rotate(${angle})`}
            />
          ))}
          <circle cx="0" cy="0" r="1.3" fill={t.heart} />
        </g>
      ))}
    </svg>
  );
}

/** A single loose leaf, handy for bouquet filler. */
export function Leaf({
  className = "",
  tone = "sage",
  rotate = 0,
}: {
  className?: string;
  tone?: keyof typeof TONES | string;
  rotate?: number;
}) {
  const t = TONES[tone] ?? TONES.sage;
  return (
    <svg viewBox="0 0 60 100" className={className} aria-hidden="true" style={{ transform: `rotate(${rotate}deg)` }}>
      <path d="M30 96C30 70 30 46 30 22" stroke={t.leaf} strokeWidth="1.6" strokeLinecap="round" opacity="0.8" />
      <path
        d="M30 78C14 72 8 56 14 40C28 46 31 62 30 78Z"
        fill={t.petalMid}
        opacity="0.85"
      />
      <path d="M30 62C44 56 50 42 44 28C32 34 29 48 30 62Z" fill={t.leaf} opacity="0.85" />
      <path d="M30 34C22 30 18 22 20 12C29 16 32 24 30 34Z" fill={t.petalDeep} opacity="0.8" />
    </svg>
  );
}

/** Small decorative bloom for the proposal heading. */
export function BlossomCluster({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 60" className={className} aria-hidden="true">
      <g fill="none" stroke="#8fa08b" strokeWidth="1.1" strokeLinecap="round" opacity="0.7">
        <path d="M120 56C120 40 120 28 120 18" />
        <path d="M120 48C108 44 100 34 98 24" />
        <path d="M120 46C132 42 140 32 142 22" />
      </g>
      <g>
        {[
          [120, 16, 1],
          [96, 22, 0.78],
          [144, 20, 0.74],
          [82, 36, 0.52],
          [158, 34, 0.5],
        ].map(([cx, cy, s], index) => (
          <g key={index} transform={`translate(${cx} ${cy}) scale(${s})`}>
            {[0, 72, 144, 216, 288].map((angle) => (
              <ellipse
                key={angle}
                cx="0"
                cy="-6"
                rx="3.4"
                ry="5.6"
                fill="#fbe9ee"
                stroke="#d99baa"
                strokeOpacity="0.5"
                strokeWidth="0.6"
                transform={`rotate(${angle})`}
              />
            ))}
            <circle cx="0" cy="0" r="1.7" fill="#d8b77a" />
          </g>
        ))}
      </g>
    </svg>
  );
}
