export interface LandClass {
  id: number;
  name: string;
  color: string;
  rgb: [number, number, number];
}

/**
 * FLAIR-INC land cover classes (19 output channels, 15 active).
 * Channels 15-18 are disabled (output 0) — we include them as placeholders.
 * Index matches the model output channel.
 */
export const LAND_CLASSES: LandClass[] = [
  { id: 0,  name: "Background",           color: "#1E293B", rgb: [30, 41, 59] },    // disabled
  { id: 1,  name: "Building",             color: "#EF4444", rgb: [239, 68, 68] },
  { id: 2,  name: "Pervious Surface",     color: "#D4A574", rgb: [212, 165, 116] },
  { id: 3,  name: "Impervious Surface",   color: "#94A3B8", rgb: [148, 163, 184] },
  { id: 4,  name: "Bare Soil",            color: "#92400E", rgb: [146, 64, 14] },
  { id: 5,  name: "Water",                color: "#0EA5E9", rgb: [14, 165, 233] },
  { id: 6,  name: "Coniferous",           color: "#065F46", rgb: [6, 95, 70] },
  { id: 7,  name: "Deciduous",            color: "#10B981", rgb: [16, 185, 129] },
  { id: 8,  name: "Brushwood",            color: "#84CC16", rgb: [132, 204, 22] },
  { id: 9,  name: "Vineyard",             color: "#7C3AED", rgb: [124, 58, 237] },
  { id: 10, name: "Herbaceous",           color: "#22C55E", rgb: [34, 197, 94] },
  { id: 11, name: "Agricultural Land",    color: "#F59E0B", rgb: [245, 158, 11] },
  { id: 12, name: "Plowed Land",          color: "#CA8A04", rgb: [202, 138, 4] },
  { id: 13, name: "Swimming Pool",        color: "#06B6D4", rgb: [6, 182, 212] },
  { id: 14, name: "Snow",                 color: "#F8FAFC", rgb: [248, 250, 252] },
  { id: 15, name: "Greenhouse",           color: "#FB923C", rgb: [251, 146, 60] },
  { id: 16, name: "Unused_16",            color: "#1E293B", rgb: [30, 41, 59] },
  { id: 17, name: "Unused_17",            color: "#1E293B", rgb: [30, 41, 59] },
  { id: 18, name: "Unused_18",            color: "#1E293B", rgb: [30, 41, 59] },
];

export const NUM_CLASSES = LAND_CLASSES.length;
