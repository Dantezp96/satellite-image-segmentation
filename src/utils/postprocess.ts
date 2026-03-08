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
 * ADE20K (150 classes) → 7 Land Cover classes mapping.
 * SegFormer outputs 150 ADE20K classes. We map them to our 7 categories.
 *
 * ADE20K class indices (0-indexed):
 * https://huggingface.co/nvidia/segformer-b0-finetuned-ade-512-512
 */
const ADE20K_TO_LAND: Record<number, number> = {
  // Urban (0): buildings, roads, infrastructure
  1: 0,   // building
  3: 0,   // floor
  6: 0,   // road
  11: 0,  // sidewalk
  12: 0,  // person (urban activity)
  14: 0,  // car
  19: 0,  // house
  20: 0,  // fence
  24: 0,  // table
  25: 0,  // desk
  28: 0,  // windowpane
  31: 0,  // cabinet
  33: 0,  // door
  35: 0,  // lamp
  36: 0,  // curtain
  41: 0,  // box
  42: 0,  // column
  43: 0,  // signboard
  44: 0,  // chest of drawers
  46: 0,  // shelf
  48: 0,  // stairs
  50: 0,  // bridge
  52: 0,  // screen / monitor
  53: 0,  // runway
  61: 0,  // path
  62: 0,  // stairway
  79: 0,  // bus
  80: 0,  // truck
  83: 0,  // tower
  84: 0,  // awning
  89: 0,  // van
  90: 0,  // ship
  99: 0,  // pole
  100: 0, // land (paved)
  102: 0, // tent
  116: 0, // skyscraper
  118: 0, // pier
  125: 0, // booth
  130: 0, // bicycle
  135: 0, // swimming pool (artificial)
  142: 0, // escalator

  // Agriculture (1): cultivated fields, grass
  9: 1,   // grass
  29: 1,  // field
  59: 1,  // flower
  66: 1,  // plaything / garden object
  73: 1,  // plant / pot
  126: 1, // bulletin board (farm area)

  // Rangeland (2): mixed vegetation / shrubs
  17: 2,  // plant
  72: 2,  // path (rural)

  // Forest (3): trees, dense vegetation
  4: 3,   // tree
  67: 3,  // palm

  // Mountain from satellite is typically barren terrain
  16: 5,  // mountain → Barren (satellite perspective)

  // Water (4): sea, river, lake, pool
  21: 4,  // sea
  26: 4,  // lake / water
  60: 4,  // river
  109: 4, // waterfall
  113: 4, // fountain
  128: 4, // pool table (misfire, but water-like)

  // Barren (5): sand, rock, desert
  13: 5,  // earth / ground
  34: 5,  // rock / cliff (ADE20K 34)
  91: 5,  // dirt track
  94: 5,  // sand
  106: 5, // stone
  110: 5, // hill
  134: 5, // land (barren)

  // Sky / Unknown (6)
  2: 6,   // sky
  7: 6,   // bed
  8: 6,   // sofa
  10: 6,  // table
  15: 6,  // seat
  18: 6,  // curtain

  // Remap for satellite perspective (from above, these look like urban/ground)
  0: 0,   // wall → Urban (buildings from above)
  5: 0,   // ceiling → Urban (flat rooftops from above)
  22: 0,  // painting → Urban (flat surface patterns)
  27: 5,  // rug → Barren (ground texture)
};

/** Map any ADE20K class to our 7 land cover classes */
function mapAde20kToLand(adeClass: number): number {
  return ADE20K_TO_LAND[adeClass] ?? 6; // default to Unknown
}

/**
 * SegFormer outputs [1, 150, 128, 128] logits (ADE20K, 1/4 resolution).
 * We argmax, map to 7 classes, upsample to MODEL_INPUT_SIZE, and colorize.
 */
export function postprocess(output: Float32Array): SegmentationResult {
  const NUM_ADE_CLASSES = 150;
  const OUT_H = 128;
  const OUT_W = 128;
  const outPixels = OUT_H * OUT_W;

  // Argmax per pixel at 128x128 resolution
  const adeIndices = new Uint8Array(outPixels);
  for (let i = 0; i < outPixels; i++) {
    let maxVal = -Infinity;
    let maxIdx = 0;
    for (let c = 0; c < NUM_ADE_CLASSES; c++) {
      const val = output[c * outPixels + i];
      if (val > maxVal) {
        maxVal = val;
        maxIdx = c;
      }
    }
    adeIndices[i] = maxIdx;
  }

  // Map ADE20K → Land cover at 128x128
  const landIndices128 = new Uint8Array(outPixels);
  for (let i = 0; i < outPixels; i++) {
    landIndices128[i] = mapAde20kToLand(adeIndices[i]);
  }

  // Nearest-neighbor upsample from 128x128 to MODEL_INPUT_SIZE x MODEL_INPUT_SIZE
  const H = MODEL_INPUT_SIZE;
  const W = MODEL_INPUT_SIZE;
  const totalPixels = H * W;
  const classCounts = new Array(NUM_CLASSES).fill(0);
  const maskData = new Uint8ClampedArray(totalPixels * 4);

  for (let y = 0; y < H; y++) {
    const srcY = Math.floor((y * OUT_H) / H);
    for (let x = 0; x < W; x++) {
      const srcX = Math.floor((x * OUT_W) / W);
      const cls = landIndices128[srcY * OUT_W + srcX];
      classCounts[cls]++;

      const [r, g, b] = LAND_CLASSES[cls].rgb;
      const idx = (y * W + x) * 4;
      maskData[idx] = r;
      maskData[idx + 1] = g;
      maskData[idx + 2] = b;
      maskData[idx + 3] = 180;
    }
  }

  const maskImageData = new ImageData(maskData, W, H);
  const classPercentages = classCounts.map((c) => (c / totalPixels) * 100);
  const dominantClass = classCounts.indexOf(Math.max(...classCounts));

  return { maskImageData, classCounts, classPercentages, dominantClass };
}
