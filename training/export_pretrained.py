"""
Export a pre-trained segmentation model to ONNX.
Uses a SegFormer model fine-tuned for scene parsing (ADE20K).
Maps ADE20K classes to our 7 land cover classes in the frontend.

ADE20K has 150 classes. We map relevant ones:
  - building, house, skyscraper, road → Urban (0)
  - field, grass → Agriculture (1)
  - plant, tree, earth → Rangeland (2)
  - tree, forest → Forest (3)
  - water, sea, river, lake, pool → Water (4)
  - sand, mountain, rock → Barren (5)
  - sky, others → Unknown (6)
"""

import os
import torch
import numpy as np
from transformers import SegformerForSemanticSegmentation

MODEL_NAME = "nvidia/segformer-b0-finetuned-ade-512-512"
INPUT_SIZE = 512
NUM_CLASSES_ADE = 150


def main():
    print(f"Loading pre-trained SegFormer ({MODEL_NAME})...")
    model = SegformerForSemanticSegmentation.from_pretrained(MODEL_NAME)
    model.eval()

    total_params = sum(p.numel() for p in model.parameters()) / 1e6
    print(f"Parameters: {total_params:.1f}M")

    # Test forward pass
    dummy = torch.randn(1, 3, INPUT_SIZE, INPUT_SIZE)
    with torch.no_grad():
        out = model(dummy)
        logits = out.logits  # [1, 150, H/4, W/4]
        print(f"Output shape: {logits.shape}")

    # We need to handle the fact that SegFormer outputs at 1/4 resolution
    # We'll export the raw model and upsample + remap in the frontend

    # Export to ONNX
    print("\nExporting to ONNX...")
    onnx_path = "segformer_ade20k.onnx"

    torch.onnx.export(
        model,
        dummy,
        onnx_path,
        opset_version=17,
        input_names=["input"],
        output_names=["output"],
        dynamic_axes={"input": {0: "batch"}, "output": {0: "batch"}},
        dynamo=False,
    )

    size_mb = os.path.getsize(onnx_path) / (1024 * 1024)
    print(f"  ONNX model: {onnx_path} ({size_mb:.1f} MB)")

    # Quantize
    print("Quantizing to INT8...")
    from onnxruntime.quantization import quantize_dynamic, QuantType
    quant_path = "segformer_ade20k_int8.onnx"
    quantize_dynamic(onnx_path, quant_path, weight_type=QuantType.QUInt8)
    quant_size = os.path.getsize(quant_path) / (1024 * 1024)
    print(f"  Quantized: {quant_path} ({quant_size:.1f} MB)")

    # Copy to public/models
    models_dir = os.path.join("..", "public", "models")
    os.makedirs(models_dir, exist_ok=True)
    import shutil
    final_path = os.path.join(models_dir, "unet_mobilenet_satellite.onnx")
    shutil.copy2(quant_path, final_path)
    print(f"\nModel ready at: {final_path}")

    # Verify with onnxruntime
    print("\nVerifying with ONNX Runtime...")
    import onnxruntime as ort
    session = ort.InferenceSession(quant_path)
    inp = {session.get_inputs()[0].name: dummy.numpy()}
    out = session.run(None, inp)
    print(f"  ONNX output shape: {out[0].shape}")
    print(f"  Output classes: {out[0].shape[1]} (ADE20K)")

    print("\nDone!")
    print("\nIMPORTANT: The frontend needs to be updated to:")
    print("  1. Handle 150 ADE20K classes output")
    print("  2. Map ADE20K classes to 7 land cover classes")
    print("  3. Upsample from output resolution to input resolution")


if __name__ == "__main__":
    main()
