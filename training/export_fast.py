"""
Fast export: create U-Net + MobileNetV2 model and export to ONNX.
Uses torchvision's MobileNetV2 (PyTorch hub, faster download) as encoder.
Trains briefly on synthetic data then exports.
"""

import os
import sys
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
import torchvision.models as models
from PIL import Image

INPUT_SIZE = 512
NUM_CLASSES = 7


class MobileUNet(nn.Module):
    """Lightweight U-Net with MobileNetV2 encoder."""

    def __init__(self, num_classes=7):
        super().__init__()
        # Use torchvision's MobileNetV2 (downloads from PyTorch CDN, more reliable)
        mobilenet = models.mobilenet_v2(weights=models.MobileNet_V2_Weights.IMAGENET1K_V1)
        features = mobilenet.features

        # Encoder blocks (capture at different resolutions)
        self.enc1 = features[:2]    # 1/2
        self.enc2 = features[2:4]   # 1/4
        self.enc3 = features[4:7]   # 1/8
        self.enc4 = features[7:14]  # 1/16
        self.enc5 = features[14:]   # 1/32

        # Decoder with skip connections
        self.up5 = self._up_block(1280, 96)
        self.up4 = self._up_block(96 + 96, 64)
        self.up3 = self._up_block(64 + 32, 32)
        self.up2 = self._up_block(32 + 24, 24)
        self.up1 = self._up_block(24 + 16, 16)

        self.final = nn.Conv2d(16, num_classes, 1)

    def _up_block(self, in_ch, out_ch):
        return nn.Sequential(
            nn.ConvTranspose2d(in_ch, out_ch, 2, stride=2),
            nn.BatchNorm2d(out_ch),
            nn.ReLU(inplace=True),
            nn.Conv2d(out_ch, out_ch, 3, padding=1),
            nn.BatchNorm2d(out_ch),
            nn.ReLU(inplace=True),
        )

    def forward(self, x):
        # Encoder
        e1 = self.enc1(x)        # [B, 16, H/2, W/2]
        e2 = self.enc2(e1)       # [B, 24, H/4, W/4]
        e3 = self.enc3(e2)       # [B, 32, H/8, W/8]
        e4 = self.enc4(e3)       # [B, 96, H/16, W/16]
        e5 = self.enc5(e4)       # [B, 1280, H/32, W/32]

        # Decoder with skip connections
        d5 = self.up5(e5)                              # [B, 96, H/16, W/16]
        d4 = self.up4(torch.cat([d5, e4], dim=1))     # [B, 64, H/8, W/8]
        d3 = self.up3(torch.cat([d4, e3], dim=1))     # [B, 32, H/4, W/4]
        d2 = self.up2(torch.cat([d3, e2], dim=1))     # [B, 24, H/2, W/2]
        d1 = self.up1(torch.cat([d2, e1], dim=1))     # [B, 16, H, W]

        return self.final(d1)


# Training data generation
CLASS_RGB_MEANS = {
    0: np.array([160, 140, 130]),  # Urban
    1: np.array([140, 170, 80]),   # Agriculture
    2: np.array([170, 160, 100]),  # Rangeland
    3: np.array([40, 100, 40]),    # Forest
    4: np.array([30, 60, 120]),    # Water
    5: np.array([200, 190, 170]),  # Barren
    6: np.array([80, 80, 80]),     # Unknown
}

CLASS_COLORS = {
    0: (239, 68, 68),     # Urban - red
    1: (245, 158, 11),    # Agriculture - amber
    2: (251, 146, 60),    # Rangeland - orange
    3: (16, 185, 129),    # Forest - green
    4: (14, 165, 233),    # Water - blue
    5: (146, 64, 14),     # Barren - brown
    6: (100, 116, 139),   # Unknown - gray
}


def make_batch(batch_size, img_size=INPUT_SIZE):
    imgs = np.zeros((batch_size, img_size, img_size, 3), dtype=np.float32)
    masks = np.zeros((batch_size, img_size, img_size), dtype=np.int64)

    for b in range(batch_size):
        base_cls = np.random.choice([1, 3])
        base_color = CLASS_RGB_MEANS[base_cls].astype(np.float32)
        noise = np.random.randn(img_size, img_size, 3).astype(np.float32) * 15
        imgs[b] = np.clip(base_color + noise, 0, 255)
        masks[b] = base_cls

        for _ in range(np.random.randint(3, 8)):
            cls_id = np.random.randint(0, NUM_CLASSES)
            color = CLASS_RGB_MEANS[cls_id].astype(np.float32)
            cx, cy = np.random.randint(0, img_size, 2)
            rw, rh = np.random.randint(40, img_size // 2, 2)

            y_coords, x_coords = np.ogrid[:img_size, :img_size]
            if np.random.random() > 0.5:
                region = ((x_coords - cx) ** 2 / max(rw ** 2, 1) +
                         (y_coords - cy) ** 2 / max(rh ** 2, 1)) < 1
            else:
                x1, y1 = max(0, cx - rw), max(0, cy - rh)
                x2, y2 = min(img_size, cx + rw), min(img_size, cy + rh)
                region = np.zeros((img_size, img_size), dtype=bool)
                region[y1:y2, x1:x2] = True

            noise = np.random.randn(img_size, img_size, 3).astype(np.float32) * 20
            imgs[b][region] = np.clip(color + noise[region], 0, 255)
            masks[b][region] = cls_id

    imgs = imgs / 255.0
    imgs = np.transpose(imgs, (0, 3, 1, 2))  # BHWC -> BCHW
    return torch.from_numpy(imgs), torch.from_numpy(masks)


def main():
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Device: {device}")

    print("Creating MobileUNet model...")
    model = MobileUNet(num_classes=NUM_CLASSES).to(device)
    total_params = sum(p.numel() for p in model.parameters()) / 1e6
    print(f"Parameters: {total_params:.1f}M")

    # Quick training to align decoder
    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=1e-3)

    print("\nTraining (10 epochs)...")
    for epoch in range(10):
        model.train()
        total_loss = 0
        for _ in range(20):  # 20 batches per epoch
            imgs, masks = make_batch(4, INPUT_SIZE)
            imgs, masks = imgs.to(device), masks.to(device)
            out = model(imgs)
            loss = criterion(out, masks)
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()
            total_loss += loss.item()

        avg_loss = total_loss / 20
        print(f"  Epoch {epoch+1}/10 | Loss: {avg_loss:.4f}")

    # Export to ONNX
    print("\nExporting to ONNX...")
    model.eval()
    model = model.to("cpu")

    dummy = torch.randn(1, 3, INPUT_SIZE, INPUT_SIZE)
    onnx_path = "unet_mobilenet_satellite.onnx"

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
    quant_path = "unet_mobilenet_satellite_int8.onnx"
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

    # Generate demo images
    print("\nGenerating demo images...")
    demo_dir = os.path.join("..", "public", "demo")
    os.makedirs(demo_dir, exist_ok=True)

    for i in range(5):
        imgs, masks = make_batch(1, INPUT_SIZE)
        img_np = (imgs[0].numpy().transpose(1, 2, 0) * 255).astype(np.uint8)
        Image.fromarray(img_np).save(os.path.join(demo_dir, f"demo_{i+1}.jpg"), quality=90)

        with torch.no_grad():
            out = model(imgs)
            pred = out.argmax(dim=1).squeeze().numpy()

        mask_colored = np.zeros((INPUT_SIZE, INPUT_SIZE, 3), dtype=np.uint8)
        for cls_id, color in CLASS_COLORS.items():
            mask_colored[pred == cls_id] = color
        Image.fromarray(mask_colored).save(os.path.join(demo_dir, f"demo_{i+1}_mask.png"))

    print(f"Generated 5 demo images in {demo_dir}")
    print("\nDone!")


if __name__ == "__main__":
    main()
