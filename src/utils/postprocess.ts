import { LAND_CLASSES, NUM_CLASSES } from "./classes";
import { MODEL_INPUT_SIZE } from "./preprocess";

export interface SegmentationResult {
  /** RGBA ImageData at MODEL_INPUT_SIZE x MODEL_INPUT_SIZE */
  maskImageData: ImageData;
  /** Per-class pixel count */
  classCounts: number[];
  /** Per-class percentage */
  classPercentages: number[];
  /** Dominant class index */
  dominantClass: number;
}

/**
 * FLAIR model outputs [1, 19, 512, 512] logits at full resolution.
 * We argmax per pixel, colorize, and compute stats.
 */
export function postprocess(output: Float32Array): SegmentationResult {
  const H = MODEL_INPUT_SIZE;
  const W = MODEL_INPUT_SIZE;
  const totalPixels = H * W;
  const classCounts = new Array(NUM_CLASSES).fill(0);
  const maskData = new Uint8ClampedArray(totalPixels * 4);

  for (let i = 0; i < totalPixels; i++) {
    // Argmax across 19 classes for this pixel
    let maxVal = -Infinity;
    let maxIdx = 0;
    for (let c = 0; c < NUM_CLASSES; c++) {
      const val = output[c * totalPixels + i];
      if (val > maxVal) {
        maxVal = val;
        maxIdx = c;
      }
    }

    classCounts[maxIdx]++;

    const [r, g, b] = LAND_CLASSES[maxIdx].rgb;
    const idx = i * 4;
    maskData[idx] = r;
    maskData[idx + 1] = g;
    maskData[idx + 2] = b;
    maskData[idx + 3] = 180;
  }

  const maskImageData = new ImageData(maskData, W, H);
  const classPercentages = classCounts.map((c) => (c / totalPixels) * 100);

  // Find dominant class (skip disabled classes 0, 16-18)
  let dominantClass = 1;
  let maxCount = 0;
  for (let c = 1; c <= 15; c++) {
    if (classCounts[c] > maxCount) {
      maxCount = classCounts[c];
      dominantClass = c;
    }
  }

  return { maskImageData, classCounts, classPercentages, dominantClass };
}
