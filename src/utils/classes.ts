export interface LandClass {
  id: number;
  name: string;
  color: string;
  rgb: [number, number, number];
}

export const LAND_CLASSES: LandClass[] = [
  { id: 0, name: "Urban",       color: "#EF4444", rgb: [239, 68, 68] },
  { id: 1, name: "Agriculture", color: "#F59E0B", rgb: [245, 158, 11] },
  { id: 2, name: "Rangeland",   color: "#FB923C", rgb: [251, 146, 60] },
  { id: 3, name: "Forest",      color: "#10B981", rgb: [16, 185, 129] },
  { id: 4, name: "Water",       color: "#0EA5E9", rgb: [14, 165, 233] },
  { id: 5, name: "Barren",      color: "#92400E", rgb: [146, 64, 14] },
  { id: 6, name: "Unknown",     color: "#64748B", rgb: [100, 116, 139] },
];

export const NUM_CLASSES = LAND_CLASSES.length;
