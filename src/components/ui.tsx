import type { ReactNode } from "react";

export function PageHeader({ kicker, title, children }: { kicker: string; title: ReactNode; children?: ReactNode }) {
  return (
    <header className="relative mb-10 pt-10 sm:pt-14">
      <div className="text-xs font-medium uppercase tracking-[0.2em] text-pitch">{kicker}</div>
      <h1 className="mt-3 max-w-4xl text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">{title}</h1>
      {children && <div className="mt-5 max-w-3xl text-base leading-relaxed text-muted sm:text-lg">{children}</div>}
    </header>
  );
}

export function Section({ title, kicker, children, id }: { title: ReactNode; kicker?: string; children: ReactNode; id?: string }) {
  return (
    <section id={id} className="mt-16 scroll-mt-20">
      {kicker && <div className="text-xs font-medium uppercase tracking-[0.2em] text-faint">{kicker}</div>}
      <h2 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">{title}</h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-line bg-panel/80 p-5 ${className}`}>{children}</div>;
}

export function CardTitle({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <div className="mb-4">
      <div className="text-sm font-semibold">{children}</div>
      {sub && <div className="mt-1 text-xs leading-relaxed text-muted">{sub}</div>}
    </div>
  );
}

const tones = {
  green: "border-pitch/40 bg-pitch/10 text-pitch",
  amber: "border-amber/40 bg-amber/10 text-amber",
  rose: "border-rose/40 bg-rose/10 text-rose",
  sky: "border-sky/40 bg-sky/10 text-sky",
  violet: "border-violet/40 bg-violet/10 text-violet",
  muted: "border-line-2 bg-panel-2 text-muted",
} as const;
export type Tone = keyof typeof tones;

export function Pill({ children, tone = "muted" }: { children: ReactNode; tone?: Tone }) {
  return <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${tones[tone]}`}>{children}</span>;
}

export function Stat({ label, value, sub, tone }: { label: string; value: ReactNode; sub?: ReactNode; tone?: Tone }) {
  const color = tone ? tones[tone].split(" ").find((c) => c.startsWith("text-")) : "text-ink";
  return (
    <div className="rounded-lg border border-line bg-panel-2/60 px-3 py-2.5">
      <div className="text-[11px] uppercase tracking-wider text-faint">{label}</div>
      <div className={`num mt-1 text-lg font-semibold ${color}`}>{value}</div>
      {sub && <div className="num mt-0.5 text-[11px] text-muted">{sub}</div>}
    </div>
  );
}

export function Slider({ label, value, min, max, step, onChange, fmt }: {
  label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; fmt?: (v: number) => string;
}) {
  return (
    <label className="block">
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-muted">{label}</span>
        <span className="num text-ink">{fmt ? fmt(value) : value}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}

export function NumField({ label, value, step = 0.01, onChange }: { label: string; value: number; step?: number; onChange: (v: number) => void }) {
  return (
    <label className="block">
      <div className="mb-1 text-xs text-muted">{label}</div>
      <input type="number" step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}

export function Callout({ children, tone = "green", title }: { children: ReactNode; tone?: Tone; title?: string }) {
  const border = { green: "border-l-pitch", amber: "border-l-amber", rose: "border-l-rose", sky: "border-l-sky", violet: "border-l-violet", muted: "border-l-line-2" }[tone];
  return (
    <div className={`rounded-r-lg border border-l-2 border-line ${border} bg-panel-2/50 px-4 py-3 text-sm leading-relaxed text-muted`}>
      {title && <div className="mb-1 font-semibold text-ink">{title}</div>}
      {children}
    </div>
  );
}

export function Bar({ value, tone = "green", max = 1 }: { value: number; tone?: Tone; max?: number }) {
  const bg = { green: "bg-pitch", amber: "bg-amber", rose: "bg-rose", sky: "bg-sky", violet: "bg-violet", muted: "bg-faint" }[tone];
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-line">
      <div className={`h-full rounded-full ${bg}`} style={{ width: `${Math.max(0, Math.min(1, value / max)) * 100}%` }} />
    </div>
  );
}
