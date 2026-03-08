export type Lang = "es" | "en";

const translations = {
  "app.title": { es: "Segmentación Satelital", en: "Satellite Segmentation" },
  "app.subtitle": { es: "Clasificación de Uso de Suelo con IA", en: "AI-Powered Land Cover Classification" },
  "app.description": {
    es: "Modelo FLAIR U-Net+ResNet34 entrenado en imágenes aéreas reales, ejecutándose <strong>100% en tu navegador</strong> via ONNX Runtime Web. Sin servidor, sin enviar datos — privacidad total.",
    en: "FLAIR U-Net+ResNet34 model trained on real aerial imagery, running <strong>100% in your browser</strong> via ONNX Runtime Web. No server, no data sent — total privacy.",
  },

  "mode.map": { es: "Mapa", en: "Map" },
  "mode.upload": { es: "Subir Imagen", en: "Upload" },
  "mode.demo": { es: "Demo", en: "Demo" },

  "controls.opacity": { es: "Opacidad del Overlay", en: "Overlay Opacity" },
  "controls.segment": { es: "Segmentar Vista", en: "Segment View" },
  "controls.screenshot": { es: "Captura", en: "Screenshot" },
  "controls.locations": { es: "Ubicaciones", en: "Locations" },

  "stats.inference": { es: "Inferencia", en: "Inference" },
  "stats.resolution": { es: "Resolución", en: "Resolution" },
  "stats.dominant": { es: "Clase Dominante", en: "Dominant Class" },
  "stats.total": { es: "Segmentaciones", en: "Segmentations" },
  "stats.distribution": { es: "Distribución de Clases", en: "Class Distribution" },

  "class.Background": { es: "Fondo", en: "Background" },
  "class.Building": { es: "Edificación", en: "Building" },
  "class.Pervious Surface": { es: "Superficie Permeable", en: "Pervious Surface" },
  "class.Impervious Surface": { es: "Superficie Impermeable", en: "Impervious Surface" },
  "class.Bare Soil": { es: "Suelo Desnudo", en: "Bare Soil" },
  "class.Water": { es: "Agua", en: "Water" },
  "class.Coniferous": { es: "Coníferas", en: "Coniferous" },
  "class.Deciduous": { es: "Caducifolios", en: "Deciduous" },
  "class.Brushwood": { es: "Matorral", en: "Brushwood" },
  "class.Vineyard": { es: "Viñedo", en: "Vineyard" },
  "class.Herbaceous": { es: "Herbáceas", en: "Herbaceous" },
  "class.Agricultural Land": { es: "Tierra Agrícola", en: "Agricultural Land" },
  "class.Plowed Land": { es: "Tierra Arada", en: "Plowed Land" },
  "class.Swimming Pool": { es: "Piscina", en: "Swimming Pool" },
  "class.Snow": { es: "Nieve", en: "Snow" },
  "class.Greenhouse": { es: "Invernadero", en: "Greenhouse" },

  "upload.title": { es: "Arrastra una imagen satelital aquí", en: "Drag a satellite image here" },
  "upload.hint": { es: "o haz clic para seleccionar", en: "or click to select" },
  "upload.formats": { es: "JPG, PNG — imágenes satelitales o aéreas", en: "JPG, PNG — satellite or aerial imagery" },

  "demo.select": { es: "Selecciona una imagen de ejemplo", en: "Select a sample image" },

  "loading.title": { es: "Cargando modelo...", en: "Loading model..." },
  "loading.subtitle": { es: "Segmentación de Imágenes Satelitales", en: "Satellite Image Segmentation" },

  "status.segmenting": { es: "Segmentando...", en: "Segmenting..." },

  "methodology.title": { es: "Metodología", en: "Methodology" },
  "methodology.items": {
    es: [
      "<strong>Modelo:</strong> FLAIR U-Net con encoder ResNet34, entrenado en el dataset FLAIR-INC del IGN francés — 218,400 parches de imágenes aéreas reales a 0.2m/px.",
      "<strong>Clases:</strong> 15 categorías de cobertura terrestre — Edificación, Agua, Coníferas, Caducifolios, Tierra Agrícola, Suelo Desnudo, y más.",
      "<strong>Inferencia:</strong> ONNX Runtime Web (WebAssembly) — todo el procesamiento ocurre en el navegador del usuario.",
      "<strong>Mapa:</strong> MapLibre GL JS con tiles satelitales de ESRI World Imagery (gratuito, sin autenticación).",
      "<strong>Privacidad:</strong> Ninguna imagen se envía a servidores externos. El modelo se descarga una vez y ejecuta localmente.",
    ],
    en: [
      "<strong>Model:</strong> FLAIR U-Net with ResNet34 encoder, trained on the French IGN FLAIR-INC dataset — 218,400 patches of real aerial imagery at 0.2m/px.",
      "<strong>Classes:</strong> 15 land cover categories — Building, Water, Coniferous, Deciduous, Agricultural Land, Bare Soil, and more.",
      "<strong>Inference:</strong> ONNX Runtime Web (WebAssembly) — all processing happens in the user's browser.",
      "<strong>Map:</strong> MapLibre GL JS with ESRI World Imagery satellite tiles (free, no authentication).",
      "<strong>Privacy:</strong> No images are sent to external servers. The model is downloaded once and runs locally.",
    ],
  },

  "footer.text": {
    es: 'Construido por <strong>Omar Daniel Zorro</strong> — Data & ML Engineer',
    en: 'Built by <strong>Omar Daniel Zorro</strong> — Data & ML Engineer',
  },
} as const;

type Key = keyof typeof translations;

export function t(key: Key | string, lang: Lang): string | readonly string[] {
  const entry = translations[key as Key];
  if (!entry) return key; // fallback to key if translation missing
  return entry[lang];
}
