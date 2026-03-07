import { useRef, useEffect, useCallback, useState, forwardRef, useImperativeHandle } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { SegmentationResult } from "../utils/postprocess";
import { MODEL_INPUT_SIZE } from "../utils/preprocess";

interface Props {
  opacity: number;
  onCaptureReady: (canvas: HTMLCanvasElement) => void;
  segResult: SegmentationResult | null;
  isSegmenting: boolean;
}

export interface MapViewHandle {
  flyTo: (lng: number, lat: number, zoom: number) => void;
  captureView: () => void;
  getScreenshot: () => HTMLCanvasElement | null;
}

export const MapView = forwardRef<MapViewHandle, Props>(
  function MapView({ opacity, onCaptureReady, segResult, isSegmenting }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<maplibregl.Map | null>(null);
    const overlayRef = useRef<HTMLCanvasElement>(null);
    const [mapReady, setMapReady] = useState(false);

    // Initialize map
    useEffect(() => {
      if (!containerRef.current) return;

      const map = new maplibregl.Map({
        container: containerRef.current,
        style: {
          version: 8,
          sources: {
            "esri-satellite": {
              type: "raster",
              tiles: [
                "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
              ],
              tileSize: 256,
              attribution: "ESRI World Imagery",
              maxzoom: 18,
            },
          },
          layers: [
            {
              id: "satellite",
              type: "raster",
              source: "esri-satellite",
              paint: { "raster-opacity": 1 },
            },
          ],
        },
        center: [-74.006, 40.7128], // NYC
        zoom: 13,
        attributionControl: false,
      });

      map.addControl(new maplibregl.NavigationControl(), "top-right");
      map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");

      map.on("load", () => {
        setMapReady(true);
      });

      mapRef.current = map;

      return () => {
        map.remove();
        mapRef.current = null;
      };
    }, []);

    // Draw segmentation overlay
    useEffect(() => {
      const canvas = overlayRef.current;
      if (!canvas || !segResult) return;

      const ctx = canvas.getContext("2d")!;
      canvas.width = MODEL_INPUT_SIZE;
      canvas.height = MODEL_INPUT_SIZE;

      ctx.putImageData(segResult.maskImageData, 0, 0);
    }, [segResult]);

    const captureView = useCallback(() => {
      const map = mapRef.current;
      if (!map) return;

      // Get the map canvas and create a copy for inference
      const mapCanvas = map.getCanvas();
      const captureCanvas = document.createElement("canvas");
      captureCanvas.width = mapCanvas.width;
      captureCanvas.height = mapCanvas.height;
      const ctx = captureCanvas.getContext("2d")!;
      ctx.drawImage(mapCanvas, 0, 0);

      onCaptureReady(captureCanvas);
    }, [onCaptureReady]);

    const flyTo = useCallback((lng: number, lat: number, zoom: number) => {
      mapRef.current?.flyTo({ center: [lng, lat], zoom, duration: 2000 });
    }, []);

    const getScreenshot = useCallback((): HTMLCanvasElement | null => {
      const map = mapRef.current;
      if (!map) return null;

      const mapCanvas = map.getCanvas();
      const result = document.createElement("canvas");
      result.width = mapCanvas.width;
      result.height = mapCanvas.height;
      const ctx = result.getContext("2d")!;
      ctx.drawImage(mapCanvas, 0, 0);

      // Draw overlay if present
      const overlay = overlayRef.current;
      if (overlay && segResult) {
        ctx.globalAlpha = opacity;
        ctx.drawImage(overlay, 0, 0, result.width, result.height);
      }

      return result;
    }, [opacity, segResult]);

    useImperativeHandle(ref, () => ({ flyTo, captureView, getScreenshot }), [
      flyTo,
      captureView,
      getScreenshot,
    ]);

    return (
      <div className="map-container">
        <div ref={containerRef} className="map-inner" />
        {segResult && (
          <canvas
            ref={overlayRef}
            className="map-overlay"
            style={{ opacity }}
          />
        )}
        {isSegmenting && (
          <div className="map-scanning">
            <div className="scan-line" />
          </div>
        )}
        {!mapReady && (
          <div className="detection-placeholder">Loading map...</div>
        )}
      </div>
    );
  },
);
