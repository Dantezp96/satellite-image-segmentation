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
 * Convert model output [1, NUM_CLASSES, H, W] logits to colored mask.
 * Performs argmax per pixel, then maps to class colors.
 */
export function postprocess(output: Float32Array): SegmentationResult {
  const H = MODEL_INPUT_SIZE;
  const W = MODEL_INPUT_SIZE;
  const totalPixels = H * W;

  const classCounts = new Array(NUM_CLASSES).fill(0);
  const classIndices = new Uint8Array(totalPixels);

  // Argmax per pixel
  for (let i = 0; i < totalPixels; i++) {
    let maxVal = -Infinity;
    let maxIdx = 0;
    for (let c = 0; c < NUM_CLASSES; c++) {
      const val = output[c * totalPixels + i];
      if (val > maxVal) {
        maxVal = val;
        maxIdx = c;
      }
    }
    classIndices[i] = maxIdx;
    classCounts[maxIdx]++;
  }

  // Create colored RGBA mask
  const maskData = new Uint8ClampedArray(totalPixels * 4);
  for (let i = 0; i < totalPixels; i++) {
    const cls = classIndices[i];
    const [r, g, b] = LAND_CLASSES[cls].rgb;
    const idx = i * 4;
    maskData[idx] = r;
    maskData[idx + 1] = g;
    maskData[idx + 2] = b;
    maskData[idx + 3] = 180; // semi-transparent
  }

  const maskImageData = new ImageData(maskData, W, H);

  // Calculate percentages
  const classPercentages = classCounts.map((c) => (c / totalPixels) * 100);
  const dominantClass = classCounts.indexOf(Math.max(...classCounts));

  return { maskImageData, classCounts, classPercentages, dominantClass };
}
