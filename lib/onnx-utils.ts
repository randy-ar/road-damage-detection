import { Tensor } from "onnxruntime-web";

// Konfigurasi standar ImageNet (biasanya digunakan EfficientNet)
const MEAN = [0.485, 0.456, 0.406];
const STD = [0.229, 0.224, 0.225];
const INPUT_SIZE = 224; // EfficientNet biasanya 224x224

export async function preprocessImage(
  video: HTMLVideoElement
): Promise<Tensor> {
  // 1. Gambar video ke canvas kecil (224x224)
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = INPUT_SIZE;
  canvas.height = INPUT_SIZE;

  if (!ctx) throw new Error("Canvas context failed");

  ctx.drawImage(video, 0, 0, INPUT_SIZE, INPUT_SIZE);
  const imgData = ctx.getImageData(0, 0, INPUT_SIZE, INPUT_SIZE).data;

  // 2. Konversi ke Float32Array dan Normalisasi (CHW Format)
  // Format ONNX biasanya: [1, 3, 224, 224] -> Batch, Channel, Height, Width
  const float32Data = new Float32Array(1 * 3 * INPUT_SIZE * INPUT_SIZE);

  for (let i = 0; i < INPUT_SIZE * INPUT_SIZE; i++) {
    // Pixel asli (0-255)
    const r = imgData[i * 4] / 255.0;
    const g = imgData[i * 4 + 1] / 255.0;
    const b = imgData[i * 4 + 2] / 255.0;

    // Normalisasi: (value - mean) / std
    // Mengisi array Float32 dengan urutan Channel (RRR...GGG...BBB...)
    float32Data[i] = (r - MEAN[0]) / STD[0]; // Channel R
    float32Data[i + INPUT_SIZE * INPUT_SIZE] = (g - MEAN[1]) / STD[1]; // Channel G
    float32Data[i + 2 * INPUT_SIZE * INPUT_SIZE] = (b - MEAN[2]) / STD[2]; // Channel B
  }

  // 3. Return ONNX Tensor
  return new Tensor("float32", float32Data, [1, 3, INPUT_SIZE, INPUT_SIZE]);
}

// Preprocess image from File object (for image uploads)
export async function preprocessImageFile(file: File): Promise<Tensor> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      try {
        // 1. Gambar image ke canvas kecil (224x224)
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = INPUT_SIZE;
        canvas.height = INPUT_SIZE;

        if (!ctx) throw new Error("Canvas context failed");

        ctx.drawImage(img, 0, 0, INPUT_SIZE, INPUT_SIZE);
        const imgData = ctx.getImageData(0, 0, INPUT_SIZE, INPUT_SIZE).data;

        // 2. Konversi ke Float32Array dan Normalisasi (CHW Format)
        const float32Data = new Float32Array(1 * 3 * INPUT_SIZE * INPUT_SIZE);

        for (let i = 0; i < INPUT_SIZE * INPUT_SIZE; i++) {
          const r = imgData[i * 4] / 255.0;
          const g = imgData[i * 4 + 1] / 255.0;
          const b = imgData[i * 4 + 2] / 255.0;

          float32Data[i] = (r - MEAN[0]) / STD[0];
          float32Data[i + INPUT_SIZE * INPUT_SIZE] = (g - MEAN[1]) / STD[1];
          float32Data[i + 2 * INPUT_SIZE * INPUT_SIZE] = (b - MEAN[2]) / STD[2];
        }

        // 3. Cleanup and return tensor
        URL.revokeObjectURL(url);
        resolve(
          new Tensor("float32", float32Data, [1, 3, INPUT_SIZE, INPUT_SIZE])
        );
      } catch (error) {
        URL.revokeObjectURL(url);
        reject(error);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };

    img.src = url;
  });
}

// Fungsi Softmax untuk mengubah output linear menjadi probabilitas %
export function softmax(logits: number[]): number[] {
  const maxLogit = Math.max(...logits);
  const scores = logits.map((l) => Math.exp(l - maxLogit));
  const sumScores = scores.reduce((a, b) => a + b, 0);
  return scores.map((s) => s / sumScores);
}
