import { LAND_CLASSES } from "../utils/classes";
import { ClassLegend } from "./ClassLegend";
import type { SegStats } from "../hooks/useStats";
import { type Lang, t } from "../i18n";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface Props {
  stats: SegStats;
  lang: Lang;
}

export function StatsPanel({ stats, lang }: Props) {
  const pieData = LAND_CLASSES
    .map((cls, i) => ({
      name: t(`class.${cls.name}` as Parameters<typeof t>[0], lang) as string,
      value: stats.classPercentages[i] ?? 0,
      color: cls.color,
    }))
    .filter((d) => d.value > 0.5 && !d.name.startsWith("Unused"));

  const dominantName = stats.dominantClass >= 0
    ? t(`class.${LAND_CLASSES[stats.dominantClass].name}` as Parameters<typeof t>[0], lang) as string
    : "—";

  return (
    <div className="stats-panel">
      {/* Inference Time */}
      <div className="stats-card">
        <span className="stats-label">{t("stats.inference", lang) as string}</span>
        <span className="stats-value">
          {stats.inferenceTime || "—"}
          {stats.inferenceTime > 0 && <span className="stats-unit">ms</span>}
        </span>
      </div>

      {/* Dominant Class */}
      <div className="stats-card">
        <span className="stats-label">{t("stats.dominant", lang) as string}</span>
        <span className="stats-value stats-value-sm">{dominantName}</span>
      </div>

      {/* Resolution */}
      <div className="stats-card">
        <span className="stats-label">{t("stats.resolution", lang) as string}</span>
        <span className="stats-value stats-value-sm">{stats.resolution}</span>
      </div>

      {/* Total Segmentations */}
      <div className="stats-card">
        <span className="stats-label">{t("stats.total", lang) as string}</span>
        <span className="stats-value">{stats.totalSegmentations}</span>
      </div>

      {/* Pie Chart */}
      {pieData.length > 0 && (
        <div className="stats-card pie-card">
          <span className="stats-label">{t("stats.distribution", lang) as string}</span>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={35}
                outerRadius={65}
                dataKey="value"
                stroke="none"
              >
                {pieData.map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Class Breakdown */}
      <div className="stats-card class-breakdown">
        <span className="stats-label">{t("stats.distribution", lang) as string}</span>
        <ClassLegend percentages={stats.classPercentages} lang={lang} />
      </div>
    </div>
  );
}
