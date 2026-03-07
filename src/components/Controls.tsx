import { type Lang, t } from "../i18n";

export type Mode = "map" | "upload" | "demo";

interface Props {
  mode: Mode;
  onModeChange: (m: Mode) => void;
  opacity: number;
  onOpacityChange: (v: number) => void;
  onSegment: () => void;
  onScreenshot: () => void;
  isSegmenting: boolean;
  modelReady: boolean;
  lang: Lang;
}

const LOCATIONS = [
  { name: "New York", lng: -74.006, lat: 40.7128, zoom: 14 },
  { name: "Amazon", lng: -60.0, lat: -3.0, zoom: 12 },
  { name: "Sahara", lng: 10.0, lat: 25.0, zoom: 10 },
  { name: "Tokyo", lng: 139.6917, lat: 35.6895, zoom: 14 },
  { name: "Netherlands", lng: 5.2913, lat: 52.1326, zoom: 12 },
];

interface LocationsProps {
  onFlyTo: (lng: number, lat: number, zoom: number) => void;
  lang: Lang;
}

export function LocationPresets({ onFlyTo, lang }: LocationsProps) {
  return (
    <div className="control-group">
      <span className="control-label">{t("controls.locations", lang)}</span>
      <div className="locations-row">
        {LOCATIONS.map((loc) => (
          <button
            key={loc.name}
            className="location-btn"
            onClick={() => onFlyTo(loc.lng, loc.lat, loc.zoom)}
          >
            {loc.name}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Controls({
  mode,
  onModeChange,
  opacity,
  onOpacityChange,
  onSegment,
  onScreenshot,
  isSegmenting,
  modelReady,
  lang,
}: Props) {
  const modes: Mode[] = ["map", "upload", "demo"];

  return (
    <div className="controls-row">
      <div className="control-group">
        <div className="toggle-buttons">
          {modes.map((m) => (
            <button
              key={m}
              className={`toggle-btn ${mode === m ? "active" : ""}`}
              onClick={() => onModeChange(m)}
            >
              {t(`mode.${m}`, lang)}
            </button>
          ))}
        </div>
      </div>

      <div className="control-group">
        <span className="control-label">
          {t("controls.opacity", lang)}: {Math.round(opacity * 100)}%
        </span>
        <input
          type="range"
          className="conf-slider"
          min={0}
          max={100}
          value={Math.round(opacity * 100)}
          onChange={(e) => onOpacityChange(Number(e.target.value) / 100)}
        />
      </div>

      {mode === "map" && (
        <div className="control-group control-actions">
          <button
            className={`action-btn ${isSegmenting ? "active" : ""}`}
            onClick={onSegment}
            disabled={!modelReady || isSegmenting}
          >
            {isSegmenting && <span className="status-dot active" />}
            {t("controls.segment", lang)}
          </button>
          <button className="action-btn secondary" onClick={onScreenshot}>
            &#128247; {t("controls.screenshot", lang)}
          </button>
        </div>
      )}
    </div>
  );
}
