import { useState, useRef, useCallback } from "react";
import { useSegmentor } from "./hooks/useSegmentor";
import { useStats } from "./hooks/useStats";
import { LoadingScreen } from "./components/LoadingScreen";
import { Controls, LocationPresets, type Mode } from "./components/Controls";
import { MapView, type MapViewHandle } from "./components/MapView";
import { StatsPanel } from "./components/StatsPanel";
import { ImageUpload } from "./components/ImageUpload";
import { DemoGallery } from "./components/DemoGallery";
import type { SegmentationResult } from "./utils/postprocess";
import { type Lang, t } from "./i18n";
import "./App.css";

export default function App() {
  const { segment, status, loadProgress } = useSegmentor();
  const { stats, update } = useStats();

  const [lang, setLang] = useState<Lang>("es");
  const [mode, setMode] = useState<Mode>("map");
  const [opacity, setOpacity] = useState(0.6);
  const [isSegmenting, setIsSegmenting] = useState(false);
  const [segResult, setSegResult] = useState<SegmentationResult | null>(null);

  const mapRef = useRef<MapViewHandle>(null);

  const handleSegmentMap = useCallback(async () => {
    if (!mapRef.current) return;
    setIsSegmenting(true);
    mapRef.current.captureView();
  }, []);

  const handleCaptureReady = useCallback(
    async (canvas: HTMLCanvasElement) => {
      const start = performance.now();
      const result = await segment(canvas);
      const elapsed = performance.now() - start;

      if (result) {
        setSegResult(result);
        update(result, elapsed, canvas.width, canvas.height);
      }
      setIsSegmenting(false);
    },
    [segment, update],
  );

  const handleUploadResult = useCallback(
    (result: SegmentationResult, width: number, height: number) => {
      update(result, 0, width, height);
    },
    [update],
  );

  const handleScreenshot = useCallback(() => {
    const canvas = mapRef.current?.getScreenshot();
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `satellite-segmentation-${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }, []);

  const handleFlyTo = useCallback((lng: number, lat: number, zoom: number) => {
    mapRef.current?.flyTo(lng, lat, zoom);
  }, []);

  if (status === "loading" || status === "idle") {
    return <LoadingScreen progress={loadProgress} lang={lang} />;
  }

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-inner">
          <h1 className="logo">
            <span className="logo-icon">&#x1F6F0; </span>
            SatSeg<span style={{ color: "#10B981" }}>AI</span>
          </h1>
          <nav className="header-nav">
            <a className="nav-link" href="https://github.com/Dantezp96/satellite-image-segmentation" target="_blank" rel="noreferrer">
              GitHub
            </a>
            <button className="lang-toggle" onClick={() => setLang((l) => (l === "es" ? "en" : "es"))}>
              {lang === "es" ? "EN" : "ES"}
            </button>
          </nav>
        </div>
      </header>

      <main className="container">
        {/* Hero */}
        <section className="hero-section">
          <h2>{t("app.subtitle", lang) as string}</h2>
          <p dangerouslySetInnerHTML={{ __html: t("app.description", lang) as string }} />
        </section>

        {/* Controls */}
        <Controls
          mode={mode}
          onModeChange={setMode}
          opacity={opacity}
          onOpacityChange={setOpacity}
          onSegment={handleSegmentMap}
          onScreenshot={handleScreenshot}
          isSegmenting={isSegmenting}
          modelReady={status === "ready"}
          lang={lang}
        />

        {mode === "map" && (
          <LocationPresets onFlyTo={handleFlyTo} lang={lang} />
        )}

        {/* Main Layout */}
        <div className="detection-layout">
          <div className="detection-main">
            {mode === "map" && (
              <MapView
                ref={mapRef}
                opacity={opacity}
                onCaptureReady={handleCaptureReady}
                segResult={segResult}
                isSegmenting={isSegmenting}
              />
            )}
            {mode === "upload" && (
              <ImageUpload
                segment={segment}
                opacity={opacity}
                onResult={handleUploadResult}
                lang={lang}
              />
            )}
            {mode === "demo" && (
              <DemoGallery
                segment={segment}
                opacity={opacity}
                onResult={handleUploadResult}
                lang={lang}
              />
            )}
          </div>
          <div className="detection-sidebar">
            <StatsPanel stats={stats} lang={lang} />
          </div>
        </div>

        {/* Methodology */}
        <div className="methodology-card">
          <h3 className="methodology-title">{t("methodology.title", lang) as string}</h3>
          <ul className="methodology-list">
            {(t("methodology.items", lang) as string[]).map((item, i) => (
              <li key={i} dangerouslySetInnerHTML={{ __html: item }} />
            ))}
          </ul>
        </div>
      </main>

      {/* Footer */}
      <footer className="footer">
        <p dangerouslySetInnerHTML={{ __html: t("footer.text", lang) as string }} />
      </footer>
    </div>
  );
}
