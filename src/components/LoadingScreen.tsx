import { type Lang, t } from "../i18n";

interface Props {
  progress: number;
  lang: Lang;
}

export function LoadingScreen({ progress, lang }: Props) {
  const pct = Math.min(Math.round(progress * 100), 100);

  return (
    <div className="loading-screen">
      <div className="loading-logo">
        <span className="loading-icon">&#x1F6F0;</span>
        <h1 className="loading-title">U-Net</h1>
        <p className="loading-subtitle">{t("loading.subtitle", lang)}</p>
      </div>
      <div className="loading-progress">
        <div className="loading-progress-bar" style={{ width: `${pct}%` }} />
      </div>
      <p className="loading-text">{t("loading.title", lang)} {pct}%</p>
    </div>
  );
}
