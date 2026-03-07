import { LAND_CLASSES } from "../utils/classes";
import { type Lang, t } from "../i18n";

interface Props {
  percentages: number[];
  lang: Lang;
}

export function ClassLegend({ percentages, lang }: Props) {
  const sorted = LAND_CLASSES
    .map((cls, i) => ({ ...cls, pct: percentages[i] ?? 0 }))
    .filter((c) => c.pct > 0.5)
    .sort((a, b) => b.pct - a.pct);

  return (
    <div className="class-legend">
      {sorted.length === 0 ? (
        <p className="legend-empty">—</p>
      ) : (
        sorted.map((cls) => (
          <div key={cls.id} className="legend-row">
            <span className="legend-dot" style={{ background: cls.color }} />
            <span className="legend-name">
              {t(`class.${cls.name}` as Parameters<typeof t>[0], lang) as string}
            </span>
            <span className="legend-bar-track">
              <span
                className="legend-bar-fill"
                style={{ width: `${cls.pct}%`, background: cls.color }}
              />
            </span>
            <span className="legend-pct">{cls.pct.toFixed(1)}%</span>
          </div>
        ))
      )}
    </div>
  );
}
