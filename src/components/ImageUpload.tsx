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

function drawOverlay(
  canvas: HTMLCanvasElement,
  img: HTMLImageElement,
  result: SegmentationResult,
  opacity: number,
) {
  const ctx = canvas.getContext("2d")!;
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;

  // Draw original image
  ctx.drawImage(img, 0, 0);

  // Draw mask overlay
  const maskCanvas = document.createElement("canvas");
  maskCanvas.width = result.maskImageData.width;
  maskCanvas.height = result.maskImageData.height;
  const maskCtx = maskCanvas.getContext("2d")!;
  maskCtx.putImageData(result.maskImageData, 0, 0);

  ctx.globalAlpha = opacity;
  ctx.drawImage(maskCanvas, 0, 0, canvas.width, canvas.height);
  ctx.globalAlpha = 1;

  // Draw legend on image
  const legendX = 10;
  let legendY = canvas.height - 10;
  const sorted = LAND_CLASSES
    .map((cls, i) => ({ ...cls, pct: result.classPercentages[i] }))
    .filter((c) => c.pct > 1)
    .sort((a, b) => b.pct - a.pct);

  legendY -= sorted.length * 26;
  ctx.fillStyle = "rgba(0,0,0,0.7)";
  ctx.beginPath();
  ctx.roundRect(legendX, legendY - 8, 180, sorted.length * 26 + 16, 8);
  ctx.fill();

  sorted.forEach((cls, i) => {
    const y = legendY + i * 26 + 14;
    ctx.fillStyle = cls.color;
    ctx.fillRect(legendX + 10, y - 10, 12, 12);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 13px Inter, system-ui, sans-serif";
    ctx.fillText(`${cls.name} ${cls.pct.toFixed(1)}%`, legendX + 28, y);
  });
}

export function ImageUpload({ segment, opacity, onResult, lang }: Props) {
  const [processing, setProcessing] = useState(false);
  const [hasResult, setHasResult] = useState(false);
  const [dragging, setDragging] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const resultRef = useRef<SegmentationResult | null>(null);

  const processImage = useCallback(
    async (file: File) => {
      setProcessing(true);
      setHasResult(false);

      const img = new Image();
      img.src = URL.createObjectURL(file);
      await new Promise((resolve) => { img.onload = resolve; });
      imgRef.current = img;

      const result = await segment(img);
      if (result && canvasRef.current) {
        resultRef.current = result;
        drawOverlay(canvasRef.current, img, result, opacity);
        onResult(result, img.naturalWidth, img.naturalHeight);
        setHasResult(true);
      }
      setProcessing(false);
    },
    [segment, opacity, onResult],
  );

  // Redraw when opacity changes
  const redraw = useCallback(() => {
    if (imgRef.current && resultRef.current && canvasRef.current) {
      drawOverlay(canvasRef.current, imgRef.current, resultRef.current, opacity);
    }
  }, [opacity]);

  // Effect: redraw on opacity change
  if (hasResult) redraw();

  return (
    <div className="upload-container">
      {!hasResult && !processing && (
        <div
          className={`upload-zone ${dragging ? "dragging" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const file = e.dataTransfer.files[0];
            if (file) processImage(file);
          }}
        >
          <div className="upload-icon">&#x1F6F0;</div>
          <p>{t("upload.title", lang) as string}</p>
          <p className="upload-hint">{t("upload.hint", lang) as string}</p>
          <p className="upload-hint">{t("upload.formats", lang) as string}</p>
          <input
            type="file"
            className="upload-input"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) processImage(file);
            }}
          />
        </div>
      )}

      {(hasResult || processing) && (
        <div className="upload-result">
          <canvas ref={canvasRef} className="result-canvas" />
          {processing && (
            <div className="upload-processing">{t("status.segmenting", lang) as string}</div>
          )}
        </div>
      )}
    </div>
  );
}
