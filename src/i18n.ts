export type Lang = "es" | "en";

const translations = {
  "app.title": { es: "Segmentación Satelital", en: "Satellite Segmentation" },
  "app.subtitle": { es: "Clasificación de Uso de Suelo con IA", en: "AI-Powered Land Cover Classification" },
  "app.description": {
    es: "Modelo U-Net con encoder MobileNetV2 ejecutándose <strong>100% en tu navegador</strong> via ONNX Runtime Web. Sin servidor, sin enviar datos — privacidad total.",
    en: "U-Net model with MobileNetV2 encoder running <strong>100% in your browser</strong> via ONNX Runtime Web. No server, no data sent — total privacy.",
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

  "class.Urban": { es: "Urbano", en: "Urban" },
  "class.Agriculture": { es: "Agricultura", en: "Agriculture" },
  "class.Rangeland": { es: "Pastizal", en: "Rangeland" },
  "class.Forest": { es: "Bosque", en: "Forest" },
  "class.Water": { es: "Agua", en: "Water" },
  "class.Barren": { es: "Árido", en: "Barren" },
  "class.Unknown": { es: "Desconocido", en: "Unknown" },

  "upload.title": { es: "Arrastra una imagen satelital aquí", en: "Drag a satellite image here" },
  "upload.hint": { es: "o haz clic para seleccionar", en: "or click to select" },
  "upload.formats": { es: "JPG, PNG — imágenes satelitales", en: "JPG, PNG — satellite imagery" },

  "demo.select": { es: "Selecciona una imagen de ejemplo", en: "Select a sample image" },

  "loading.title": { es: "Cargando modelo...", en: "Loading model..." },
  "loading.subtitle": { es: "Segmentación de Imágenes Satelitales", en: "Satellite Image Segmentation" },

  "status.segmenting": { es: "Segmentando...", en: "Segmenting..." },

  "methodology.title": { es: "Metodología", en: "Methodology" },
  "methodology.items": {
    es: [
      "<strong>Modelo:</strong> U-Net con encoder MobileNetV2 pre-entrenado en ImageNet, fine-tuned para clasificación de uso de suelo.",
      "<strong>Clases:</strong> 7 categorías de cobertura terrestre — Urbano, Agricultura, Pastizal, Bosque, Agua, Árido, Desconocido.",
      "<strong>Inferencia:</strong> ONNX Runtime Web (WebAssembly) — todo el procesamiento ocurre en el navegador del usuario.",
      "<strong>Mapa:</strong> MapLibre GL JS con tiles satelitales de ESRI World Imagery (gratuito, sin autenticación).",
      "<strong>Privacidad:</strong> Ninguna imagen se envía a servidores externos. El modelo se descarga una vez y ejecuta localmente.",
    ],
    en: [
      "<strong>Model:</strong> U-Net with MobileNetV2 encoder pre-trained on ImageNet, fine-tuned for land cover classification.",
      "<strong>Classes:</strong> 7 land cover categories — Urban, Agriculture, Rangeland, Forest, Water, Barren, Unknown.",
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

export function t(key: Key, lang: Lang): string | readonly string[] {
  return translations[key][lang];
}
