import { useState, useRef, useCallback } from "react";
import type { SegmentationResult } from "../utils/postprocess";
import { LAND_CLASSES } from "../utils/classes";
import { type Lang, t } from "../i18n";

interface Props {
  segment: (source: HTMLImageElement) => Promise<SegmentationResult | null>;
  opacity: number;
  onResult: (result: SegmentationResult, width: number, height: number) => void;
  lang: Lang;
}

const DEMO_IMAGES = [
  { src: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80", label: "City" },
  { src: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80", label: "Farm" },
  { src: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80", label: "Forest" },
  { src: "https://images.unsplash.com/photo-1439405326854-014607f694d7?w=800&q=80", label: "Ocean" },
  { src: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800&q=80", label: "Desert" },
];

function drawResult(
  canvas: HTMLCanvasElement,
  img: HTMLImageElement,
  result: SegmentationResult,
  opacity: number,
) {
  const ctx = canvas.getContext("2d")!;
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  ctx.drawImage(img, 0, 0);

  const maskCanvas = document.createElement("canvas");
  maskCanvas.width = result.maskImageData.width;
  maskCanvas.height = result.maskImageData.height;
  maskCanvas.getContext("2d")!.putImageData(result.maskImageData, 0, 0);

  ctx.globalAlpha = opacity;
  ctx.drawImage(maskCanvas, 0, 0, canvas.width, canvas.height);
  ctx.globalAlpha = 1;

  // Legend
  const sorted = LAND_CLASSES
    .map((cls, i) => ({ ...cls, pct: result.classPercentages[i] }))
    .filter((c) => c.pct > 1)
    .sort((a, b) => b.pct - a.pct);

  const legendX = 10;
  let legendY = canvas.height - sorted.length * 26 - 18;
  ctx.fillStyle = "rgba(0,0,0,0.7)";
  ctx.beginPath();
  ctx.roundRect(legendX, legendY, 180, sorted.length * 26 + 16, 8);
  ctx.fill();

  sorted.forEach((cls, i) => {
    const y = legendY + 14 + i * 26 + 6;
    ctx.fillStyle = cls.color;
    ctx.fillRect(legendX + 10, y - 10, 12, 12);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 13px Inter, system-ui, sans-serif";
    ctx.fillText(`${cls.name} ${cls.pct.toFixed(1)}%`, legendX + 28, y);
  });
}

export function DemoGallery({ segment, opacity, onResult, lang }: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const [processing, setProcessing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleSelect = useCallback(
    async (index: number) => {
      setSelected(index);
      setProcessing(true);

      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = DEMO_IMAGES[index].src;
      await new Promise((resolve) => { img.onload = resolve; });

      const result = await segment(img);
      if (result && canvasRef.current) {
        drawResult(canvasRef.current, img, result, opacity);
        onResult(result, img.naturalWidth, img.naturalHeight);
      }
      setProcessing(false);
    },
    [segment, opacity, onResult],
  );

  return (
    <div className="demo-container">
      <div className="demo-gallery">
        {DEMO_IMAGES.map((img, i) => (
          <button
            key={i}
            className={`demo-thumb ${selected === i ? "active" : ""}`}
            onClick={() => handleSelect(i)}
          >
            <img src={img.src} alt={img.label} loading="lazy" />
            <span className="demo-thumb-label">{img.label}</span>
          </button>
        ))}
      </div>
      {selected !== null && (
        <div className="demo-result">
          <canvas ref={canvasRef} className="result-canvas" />
          {processing && (
            <div className="upload-processing">{t("status.segmenting", lang) as string}</div>
          )}
        </div>
      )}
      {selected === null && (
        <div className="demo-placeholder">
          <p>{t("demo.select", lang) as string}</p>
        </div>
      )}
    </div>
  );
}
