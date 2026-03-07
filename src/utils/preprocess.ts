export const MODEL_INPUT_SIZE = 512;

export interface PreprocessResult {
  tensor: Float32Array;
  originalWidth: number;
  originalHeight: number;
}

/**
 * Resize image to MODEL_INPUT_SIZE x MODEL_INPUT_SIZE, normalize to [0,1],
 * and convert from HWC RGBA to NCHW RGB Float32.
 */
export function preprocess(
  source: HTMLImageElement | HTMLCanvasElement,
): PreprocessResult {
  const canvas = document.createElement("canvas");
  canvas.width = MODEL_INPUT_SIZE;
  canvas.height = MODEL_INPUT_SIZE;
  const ctx = canvas.getContext("2d")!;

  const origW = source instanceof HTMLImageElement ? source.naturalWidth : source.width;
  const origH = source instanceof HTMLImageElement ? source.naturalHeight : source.height;

  ctx.drawImage(source, 0, 0, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE);

  const imageData = ctx.getImageData(0, 0, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE);
  const { data } = imageData;
  const size = MODEL_INPUT_SIZE * MODEL_INPUT_SIZE;
  const tensor = new Float32Array(3 * size);

  for (let i = 0; i < size; i++) {
    const srcIdx = i * 4;
    tensor[i] = data[srcIdx] / 255;               // R
    tensor[size + i] = data[srcIdx + 1] / 255;     // G
    tensor[2 * size + i] = data[srcIdx + 2] / 255; // B
  }

  return { tensor, originalWidth: origW, originalHeight: origH };
}
