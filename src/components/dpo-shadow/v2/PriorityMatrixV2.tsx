// Banded priority matrix — 4×4 grid met gekleurde zones en schaalbare bubbles.
// 1:1 visueel overgenomen uit HTML-referentie (V9.2).
import { RiskClusterRow, shadowBand, exposureBand, tierColorV2, formatScore } from "./riskFixture";

interface Props {
  clusters: RiskClusterRow[];
  onBubbleClick: (c: RiskClusterRow) => void;
}

function cellClass(row: number, col: number): string {
  if (row <= 1 && col >= 2) return "bg-[#fff1f1]"; // toxic
  if (row === 3 && col >= 2) return "bg-[#edf8fd]"; // training
  if (row === 2 && col >= 2) return "bg-[#edf8fd]"; // training
  if (row <= 1 && col <= 1) return "bg-[#fffbed]"; // elevated
  return "bg-[#f7fbf5]"; // clean
}

function cellLabel(row: number, col: number): { text: string; cls: string; color: string } | null {
  if (row === 0 && col === 0) return { text: "Discovery", cls: "top-4 left-4", color: "#C06000" };
  if (row === 0 && col === 3) return { text: "Interventie", cls: "top-4 right-4 text-right", color: "#b4292d" };
  if (row === 3 && col === 0) return { text: "Geborgd", cls: "bottom-4 left-4", color: "#3e6a00" };
  if (row === 3 && col === 3) return { text: "Training", cls: "bottom-4 right-4 text-right", color: "#0369a1" };
  return null;
}

function cornerRadius(row: number, col: number): string {
  if (row === 0 && col === 0) return "rounded-tl-[17px]";
  if (row === 0 && col === 3) return "rounded-tr-[17px]";
  if (row === 3 && col === 0) return "rounded-bl-[17px]";
  if (row === 3 && col === 3) return "rounded-br-[17px]";
  return "";
}

export function PriorityMatrixV2({ clusters, onBubbleClick }: Props) {
  const counts = clusters.map((c) => c.n);
  const min = counts.length ? Math.min(...counts) : 0;
  const max = counts.length ? Math.max(...counts) : 0;
  const bubbleSize = (n: number) => {
    if (max === min) return 42;
    return Math.round(24 + ((n - min) / (max - min)) * 42);
  };

  const cells = Array.from({ length: 16 }, (_, idx) => {
    const row = Math.floor(idx / 4);
    const col = idx % 4;
    const inCell = clusters.filter(
      (c) => shadowBand(c.shadow) === row && exposureBand(c.exposure) === col,
    );
    return { row, col, items: inCell };
  });

  return (
    <div className="w-full">
      {/* X-as labels */}
      <div className="ml-[86px] mb-2 grid grid-cols-4 gap-1">
        {[
          ["Laag", "0-24"],
          ["Verhoogd", "25-49"],
          ["Hoog", "50-74"],
          ["Kritiek", "75-100"],
        ].map(([label, range]) => (
          <div key={label} className="text-center text-[10px] font-extrabold leading-tight text-slate-400">
            {label}
            <span className="mt-0.5 block text-[9px] font-semibold text-slate-400/80">{range}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-[76px_minmax(0,1fr)] gap-[10px]">
        {/* Y-as labels */}
        <div className="grid grid-rows-4 gap-1">
          {[
            ["Verboden", "80"],
            ["Beperkt", "40"],
            ["Beoordelen", "20"],
            ["Toegestaan", "0"],
          ].map(([label, val]) => (
            <div
              key={label}
              className="flex items-center justify-end pr-2 text-right text-[10px] font-extrabold leading-tight text-slate-400"
            >
              {label}
              <br />
              {val}
            </div>
          ))}
        </div>

        {/* 4×4 grid */}
        <div
          className="grid min-h-[290px] grid-cols-4 grid-rows-4 gap-px overflow-hidden rounded-[18px] border border-[#93afc7] bg-[#8aaabb] shadow-[inset_0_1px_0_rgba(255,255,255,.65)]"
        >
          {cells.map(({ row, col, items }) => {
            const label = cellLabel(row, col);
            return (
              <div
                key={`${row}-${col}`}
                className={`relative flex min-h-[70px] items-center justify-center p-2 ${cellClass(row, col)} ${cornerRadius(row, col)}`}
              >
                {label && (
                  <span
                    className={`pointer-events-none absolute text-[10px] font-black uppercase tracking-[.04em] opacity-[.74] ${label.cls}`}
                    style={{ color: label.color }}
                  >
                    {label.text}
                  </span>
                )}
                <div className="flex w-full flex-wrap items-center justify-center gap-1.5 pt-2.5">
                  {items.map((c) => {
                    const size = bubbleSize(c.n);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => onBubbleClick(c)}
                        title={`${c.tool} — ${c.dept}: shadow ${c.shadow}, exposure ${c.exposure}, priority ${formatScore(c.priority)}`}
                        className="relative -mb-1 mt-[-6px] flex items-center justify-center rounded-full border-2 border-white font-mono text-[10px] font-black text-white shadow-[0_10px_22px_rgba(15,23,42,.22)] transition-transform hover:z-10 hover:scale-[1.14] hover:shadow-[0_14px_28px_rgba(15,23,42,.28)]"
                        style={{
                          width: size,
                          height: size,
                          background: tierColorV2(c.assigned_tier),
                        }}
                      >
                        {c.n}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="ml-[86px] mt-3 flex flex-wrap items-center gap-3 text-[10px] font-semibold text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-[#b4292d]" />
          toxic_shadow
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-[#C06000]" />
          priority_review
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-[#3e6a00]" />
          standard
        </span>
      </div>
    </div>
  );
}
