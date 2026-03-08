import { useState, useRef, useCallback, useEffect } from "react";
import * as ort from "onnxruntime-web";
import { preprocess, MODEL_INPUT_SIZE } from "../utils/preprocess";
import { postprocess, type SegmentationResult } from "../utils/postprocess";

export type ModelStatus = "idle" | "loading" | "ready" | "error";

export function useSegmentor() {
  const sessionRef = useRef<ort.InferenceSession | null>(null);
  const [status, setStatus] = useState<ModelStatus>("idle");
  const [loadProgress, setLoadProgress] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadModel() {
      setStatus("loading");
      try {
        const response = await fetch("/models/flair_landcover.onnx");
        const reader = response.body!.getReader();
        const contentLength = +(response.headers.get("Content-Length") ?? 0);
        const chunks: Uint8Array[] = [];
        let received = 0;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
          received += value.length;
          if (contentLength > 0 && !cancelled) {
            setLoadProgress(received / contentLength);
          }
        }

        const blob = new Blob(chunks as BlobPart[]);
        const buffer = await blob.arrayBuffer();

        const session = await ort.InferenceSession.create(buffer, {
          executionProviders: ["wasm"],
          graphOptimizationLevel: "all",
        });

        if (!cancelled) {
          sessionRef.current = session;
          setStatus("ready");
          setLoadProgress(1);
        }
      } catch (err) {
        console.error("Model load failed:", err);
        if (!cancelled) setStatus("error");
      }
    }

    loadModel();
    return () => { cancelled = true; };
  }, []);

  const segment = useCallback(
    async (
      source: HTMLImageElement | HTMLCanvasElement,
    ): Promise<SegmentationResult | null> => {
      const session = sessionRef.current;
      if (!session) return null;

      const { tensor } = preprocess(source);
      const inputTensor = new ort.Tensor(
        "float32",
        tensor,
        [1, 3, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE],
      );

      const feeds: Record<string, ort.Tensor> = {};
      const inputName = session.inputNames[0];
      feeds[inputName] = inputTensor;

      const results = await session.run(feeds);
      const outputName = session.outputNames[0];
      const output = results[outputName].data as Float32Array;

      return postprocess(output);
    },
    [],
  );

  return { segment, status, loadProgress };
}
