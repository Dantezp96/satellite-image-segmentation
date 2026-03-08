"""
Export FLAIR-INC land cover segmentation model to ONNX.

Model: IGNF/FLAIR-INC_rgb_15cl_resnet34-unet
Architecture: U-Net + ResNet34 encoder (segmentation_models_pytorch)
Dataset: FLAIR-INC (French aerial imagery, 0.2m/px)
Classes: 19 output channels (15 active land cover classes)
Input: 512x512 RGB, normalized with specific mean/std (0-255 range)

Active classes (1-indexed in output):
  1: Building           8: Brushwood
  2: Pervious surface   9: Vineyard
  3: Impervious surface 10: Herbaceous vegetation
  4: Bare soil          11: Agricultural land
  5: Water              12: Plowed land
  6: Coniferous         13: Swimming pool
  7: Deciduous          14: Snow
                        15: Greenhouse
"""

import os
import torch
import numpy as np
from segmentation_models_pytorch import Unet

WEIGHTS_PATH = "./hf_cache/models--IGNF--FLAIR-INC_rgb_15cl_resnet34-unet/snapshots/d8a81bc5bc46357677ba0569e83c4c68d3f78b89/FLAIR-INC_rgb_15cl_resnet34-unet_weights.pth"
INPUT_SIZE = 512
NUM_CLASSES = 19  # 15 active + 4 disabled


def main():
    print("Loading FLAIR model (U-Net + ResNet34)...")
    model = Unet(
        encoder_name="resnet34",
        encoder_weights=None,  # We'll load FLAIR weights
        in_channels=3,
        classes=NUM_CLASSES,
    )

    # Load FLAIR weights (strip 'model.seg_model.' prefix from keys)
    raw_state_dict = torch.load(WEIGHTS_PATH, map_location="cpu", weights_only=True)
    state_dict = {}
    for k, v in raw_state_dict.items():
        if k.startswith("model.seg_model."):
            state_dict[k[len("model.seg_model."):]] = v
    model.load_state_dict(state_dict)
    model.eval()

    total_params = sum(p.numel() for p in model.parameters()) / 1e6
    print(f"Parameters: {total_params:.1f}M")

    # Test forward pass
    dummy = torch.randn(1, 3, INPUT_SIZE, INPUT_SIZE)
    with torch.no_grad():
        out = model(dummy)
        print(f"Output shape: {out.shape}")  # [1, 19, 512, 512]

    # Export to ONNX
    print("\nExporting to ONNX...")
    onnx_path = "flair_resnet34_unet.onnx"

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

    quant_path = "flair_resnet34_unet_int8.onnx"
    quantize_dynamic(onnx_path, quant_path, weight_type=QuantType.QUInt8)
    quant_size = os.path.getsize(quant_path) / (1024 * 1024)
    print(f"  Quantized: {quant_path} ({quant_size:.1f} MB)")

    # Copy to public/models
    models_dir = os.path.join("..", "public", "models")
    os.makedirs(models_dir, exist_ok=True)
    import shutil
    final_path = os.path.join(models_dir, "flair_landcover.onnx")
    shutil.copy2(quant_path, final_path)
    print(f"\nModel ready at: {final_path}")

    # Verify with onnxruntime
    print("\nVerifying with ONNX Runtime...")
    import onnxruntime as ort

    session = ort.InferenceSession(quant_path)
    print(f"  Input: {session.get_inputs()[0].name} {session.get_inputs()[0].shape}")
    print(f"  Output: {session.get_outputs()[0].name} {session.get_outputs()[0].shape}")

    inp = {session.get_inputs()[0].name: dummy.numpy()}
    out = session.run(None, inp)
    print(f"  ONNX output shape: {out[0].shape}")

    # Check argmax distribution
    argmax = np.argmax(out[0][0], axis=0)
    unique, counts = np.unique(argmax, return_counts=True)
    print(f"  Classes in output: {unique.tolist()}")

    print("\nDone! FLAIR land cover model exported successfully.")


if __name__ == "__main__":
    main()
