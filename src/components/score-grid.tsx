import type { Grid } from "@/lib/model";

export function ScoreGrid({ grid, size = 6, home = "Home", away = "Away" }: { grid: Grid; size?: number; home?: string; away?: string }) {
  let max = 0;
  for (let h = 0; h <= size; h++) for (let a = 0; a <= size; a++) max = Math.max(max, grid[h][a]);
  return (
    <div className="overflow-x-auto">
      <div className="inline-block">
        <div className="mb-1 pl-10 text-[11px] uppercase tracking-wider text-faint">{away} goals →</div>
        <div className="flex">
          <div className="flex w-10 items-center justify-center">
            <span className="-rotate-90 whitespace-nowrap text-[11px] uppercase tracking-wider text-faint">{home} goals →</span>
          </div>
          <table className="border-separate border-spacing-0.5">
            <thead>
              <tr>
                <th />
                {Array.from({ length: size + 1 }, (_, a) => <th key={a} className="num w-12 text-[11px] font-normal text-faint">{a}</th>)}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: size + 1 }, (_, h) => (
                <tr key={h}>
                  <th className="num pr-1 text-right text-[11px] font-normal text-faint">{h}</th>
                  {Array.from({ length: size + 1 }, (_, a) => {
                    const p = grid[h][a];
                    const t = Math.sqrt(p / max);
                    const rgb = h > a ? "34,197,94" : h === a ? "245,185,66" : "56,189,248";
                    return (
                      <td key={a} title={`${h}-${a}: ${(p * 100).toFixed(2)}%`}
                        className="num h-9 w-12 rounded text-center text-[11px]"
                        style={{ background: `rgba(${rgb},${0.08 + t * 0.62})`, color: t > 0.55 ? "#05080b" : "var(--ink)" }}>
                        {(p * 100).toFixed(1)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-2 flex gap-4 pl-10 text-[11px] text-muted">
          <span><span className="mr-1 inline-block h-2 w-2 rounded-sm bg-pitch" />home win</span>
          <span><span className="mr-1 inline-block h-2 w-2 rounded-sm bg-amber" />draw</span>
          <span><span className="mr-1 inline-block h-2 w-2 rounded-sm bg-sky" />away win</span>
          <span className="text-faint">cell = % chance of that exact score</span>
        </div>
      </div>
    </div>
  );
}
