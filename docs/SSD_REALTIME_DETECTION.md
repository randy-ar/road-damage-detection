# Real-Time SSD MobileNet Object Detection - Implementation Guide

## Overview

Implementasi real-time object detection menggunakan SSD MobileNet untuk mendeteksi kerusakan jalan melalui webcam/kamera. Model ini berbeda dari classifier karena menghasilkan **bounding boxes** dengan koordinat, class ID, dan confidence score.

## Model Output Format

SSD MobileNet menghasilkan 4 output tensor:

```python
outputs[0] = boxes       # [1, num_detections, 4] - [ymin, xmin, ymax, xmax] (normalized 0-1)
outputs[1] = scores      # [1, num_detections] - confidence scores
outputs[2] = classes     # [1, num_detections] - class IDs
outputs[3] = num_detections  # [1] - jumlah deteksi
```

### Contoh Output:
```
Prediksi: 5: 0.70
```
- **Class ID**: 5 (Alligator Crack)
- **Confidence**: 0.70 (70%)
- **Bounding Box**: [ymin, xmin, ymax, xmax] dalam koordinat normalized

## File Structure

```
lib/
  ├── ssd-detector.ts          # Utilities untuk SSD MobileNet
  └── onnx-utils.ts            # Utilities untuk classifier (existing)

components/pages/
  └── RealtimeDetection.tsx    # Komponen real-time detection

public/models/
  └── ssd_mobilenet.onnx       # Model SSD MobileNet
```

## Implementation Details

### 1. Preprocessing (`ssd-detector.ts`)

**Input Format**: `uint8` dengan shape `[1, 300, 300, 3]` (NHWC format)

```typescript
export function preprocessVideoForSSD(
  video: HTMLVideoElement,
  inputSize: number = 300
): Tensor {
  // 1. Resize video frame ke 300x300
  // 2. Convert ke Uint8Array (RGB channels)
  // 3. Return ONNX Tensor dengan format NHWC
}
```

**Perbedaan dengan Classifier**:
- Classifier: `float32`, normalized dengan ImageNet mean/std
- SSD: `uint8`, raw pixel values (0-255)

### 2. Output Parsing

```typescript
export function parseSSDOutput(
  outputs: any,
  threshold: number = 0.5,
  videoWidth: number,
  videoHeight: number
): DetectionBox[] {
  // 1. Extract boxes, scores, classes, num_detections
  // 2. Filter berdasarkan confidence threshold
  // 3. Convert normalized coordinates ke pixel coordinates
  // 4. Return array of DetectionBox
}
```

### 3. Drawing Bounding Boxes

```typescript
export function drawDetections(
  ctx: CanvasRenderingContext2D,
  detections: DetectionBox[]
): void {
  // 1. Loop through detections
  // 2. Draw bounding box dengan warna sesuai class
  // 3. Draw label dengan confidence score
}
```

## Class Labels

```typescript
export const DAMAGE_LABEL_MAP: { [key: number]: string } = {
  0: "Berat",
  1: "Ringan",
  2: "Sedang",
  3: "Longitudinal Crack",
  4: "Transverse Crack",
  5: "Alligator Crack",  // ← Class ID dari gambar contoh
  6: "Pothole",
  7: "Other",
};
```

## Color Coding

Setiap class memiliki warna berbeda untuk visualisasi:

| Class | Color | Hex Code |
|-------|-------|----------|
| Berat | Red | #FF0000 |
| Sedang | Orange | #FFA500 |
| Ringan | Yellow | #FFFF00 |
| Longitudinal Crack | Green | #00FF00 |
| Transverse Crack | Cyan | #00FFFF |
| Alligator Crack | Magenta | #FF00FF |
| Pothole | Red | #FF0000 |
| Other | White | #FFFFFF |

## Real-Time Detection Loop

### Flow:

1. **Video Frame Ready** → Check if video is ready (readyState === 4)
2. **Preprocessing** → Convert video frame to uint8 tensor (300x300)
3. **Inference** → Run model inference
4. **Parse Output** → Extract boxes, scores, classes
5. **Filter** → Apply confidence threshold (default: 0.5)
6. **Draw** → Draw bounding boxes and labels on canvas
7. **Update Stats** → Calculate FPS and detection count
8. **Repeat** → requestAnimationFrame for next frame

### Performance Optimization:

```typescript
let isProcessing = false;

const detectFrame = async () => {
  if (!isProcessing && video.readyState === 4) {
    isProcessing = true;
    try {
      // ... inference code
    } finally {
      isProcessing = false;
    }
  }
  requestAnimationFrame(detectFrame);
};
```

**Why?** Prevents frame queue buildup if inference is slower than video FPS.

## UI Components

### 1. Loading State
```tsx
{isLoading && <p className="text-blue-600">Memuat Model...</p>}
```

### 2. Error State
```tsx
{error && (
  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
    <p className="font-bold">Error loading model:</p>
    <p className="text-sm">{error}</p>
  </div>
)}
```

### 3. Success State
```tsx
{modelInfo && !isLoading && !error && (
  <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
    <p className="text-sm">✅ {modelInfo}</p>
  </div>
)}
```

### 4. Performance Stats
```tsx
{session && !isLoading && (
  <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 rounded mb-4 flex gap-4 text-sm">
    <div>
      <span className="font-bold">FPS:</span> {fps}
    </div>
    <div>
      <span className="font-bold">Detections:</span> {detectionCount}
    </div>
  </div>
)}
```

### 5. Video + Canvas Overlay
```tsx
<div className="relative">
  <video ref={videoRef} autoPlay muted playsInline />
  <canvas ref={canvasRef} className="absolute top-0 left-0" />
</div>
```

## FPS Calculation

```typescript
let lastTime = performance.now();
let frameCount = 0;

// In detection loop:
frameCount++;
const currentTime = performance.now();
if (currentTime - lastTime >= 1000) {
  setFps(frameCount);
  frameCount = 0;
  lastTime = currentTime;
}
```

Updates FPS every 1 second.

## Configuration Options

### Confidence Threshold

```typescript
const detections = parseSSDOutput(
  outputs,
  0.5, // ← Adjust this value (0.0 - 1.0)
  canvas.width,
  canvas.height
);
```

- **Lower (0.3)**: More detections, more false positives
- **Higher (0.7)**: Fewer detections, more accurate

### Input Size

```typescript
const inputTensor = preprocessVideoForSSD(video, 300); // ← 300x300
```

SSD MobileNet biasanya menggunakan 300x300. Jangan ubah kecuali model Anda dilatih dengan ukuran berbeda.

### Max Detections

```typescript
const numDetections = Math.min(
  Math.floor(outputs[3].data[0]),
  100 // ← Limit to 100 detections
);
```

Prevents performance issues with too many detections.

## Troubleshooting

### Issue: Low FPS

**Possible Causes**:
1. Model inference is slow (using WASM instead of WebGL)
2. Too many detections being drawn
3. Video resolution too high

**Solutions**:
1. Check console for execution provider (should prefer WebGL)
2. Increase confidence threshold
3. Reduce video resolution in camera settings

### Issue: No Detections

**Possible Causes**:
1. Confidence threshold too high
2. Model not trained on similar data
3. Preprocessing mismatch

**Solutions**:
1. Lower threshold to 0.3
2. Check model training data
3. Verify input format (uint8 vs float32)

### Issue: Wrong Bounding Boxes

**Possible Causes**:
1. Coordinate format mismatch
2. Canvas size mismatch

**Solutions**:
1. Verify output format: [ymin, xmin, ymax, xmax]
2. Ensure canvas size matches video size

## Testing

### 1. Check Console Logs

```
Loading ONNX Runtime Web...
ONNX Runtime Web loaded successfully
Loading ONNX model from /models/ssd_mobilenet.onnx...
✅ Model loaded successfully!
🚀 Model ready - Inference session created
📊 Model inputs: ['image_tensor']
📊 Model outputs: ['detection_boxes', 'detection_scores', 'detection_classes', 'num_detections']
Detected 1 object(s): [{classId: 5, className: "Alligator Crack", confidence: 0.70, ...}]
```

### 2. Check UI

- ✅ Green success banner appears
- ✅ FPS counter shows > 0
- ✅ Detection count updates
- ✅ Bounding boxes appear on video
- ✅ Labels show class name and confidence

### 3. Performance Benchmarks

| Backend | FPS | Latency |
|---------|-----|---------|
| WebGL | 15-30 | 30-60ms |
| WASM | 5-15 | 60-200ms |
| CPU | 1-5 | 200-1000ms |

## Next Steps

### Enhancements:

1. **Add Threshold Slider**: Allow users to adjust confidence threshold
2. **Add Class Filter**: Allow users to filter specific damage types
3. **Add Screenshot**: Capture and save detection results
4. **Add Statistics**: Track detection history and analytics
5. **Add Sound Alerts**: Audio notification for high-severity damage

### Example: Threshold Slider

```tsx
const [threshold, setThreshold] = useState(0.5);

<input
  type="range"
  min="0"
  max="1"
  step="0.1"
  value={threshold}
  onChange={(e) => setThreshold(parseFloat(e.target.value))}
/>

// Use in detection:
const detections = parseSSDOutput(outputs, threshold, ...);
```

## References

- [ONNX Runtime Web Documentation](https://onnxruntime.ai/docs/tutorials/web/)
- [SSD MobileNet Paper](https://arxiv.org/abs/1512.02325)
- [TensorFlow Object Detection API](https://github.com/tensorflow/models/tree/master/research/object_detection)
