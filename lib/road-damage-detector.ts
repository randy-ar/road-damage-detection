import * as ort from "onnxruntime-web";
import { preprocessImageFile, softmax } from "./onnx-utils";

// Damage class labels - adjust based on your model's output
const DAMAGE_CLASSES = ["Berat", "Sedang", "Ringan"];

export interface DetectionResult {
  class: string;
  confidence: number;
  processingTime: number;
}

let session: ort.InferenceSession | null = null;

// Initialize ONNX model
export async function initializeModel(): Promise<void> {
  if (session) return;

  // Suppress ONNX Runtime warnings (like CPU vendor detection)
  ort.env.logLevel = "error";

  try {
    session = await ort.InferenceSession.create(
      "/models/road_damage_classifier_single.onnx",
      {
        executionProviders: ["wasm"],
        logVerbosityLevel: 3, // 0 = Verbose, 1 = Info, 2 = Warning, 3 = Error, 4 = Fatal
      }
    );
    console.log("ONNX model loaded successfully");
  } catch (error) {
    console.warn("Failed to load ONNX model:", error);
    throw new Error("Failed to initialize road damage detection model");
  }
}

// Run inference on an image file
export async function detectRoadDamage(
  imageFile: File
): Promise<DetectionResult> {
  if (!session) {
    await initializeModel();
  }

  const startTime = performance.now();

  try {
    // Preprocess the image
    const inputTensor = await preprocessImageFile(imageFile);

    // Run inference
    const feeds = { [session!.inputNames[0]]: inputTensor };
    const results = await session!.run(feeds);

    // Get output tensor
    const outputTensor = results[session!.outputNames[0]];
    const logits = Array.from(outputTensor.data as Float32Array);

    // Apply softmax to get probabilities
    const probabilities = softmax(logits);

    // Find the class with highest probability
    const maxIndex = probabilities.indexOf(Math.max(...probabilities));
    const confidence = probabilities[maxIndex];

    const endTime = performance.now();
    const processingTime = endTime - startTime;
    return {
      class: DAMAGE_CLASSES[maxIndex] || "Unknown",
      confidence: confidence * 100, // Convert to percentage
      processingTime,
    };
  } catch (error) {
    console.error("Error during inference:", error);
    throw new Error("Failed to process image");
  }
}

// Get image metadata
export function getImageMetadata(file: File): Promise<{
  size: string;
  width: number;
  height: number;
}> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
      resolve({
        size: `${sizeInMB} MB`,
        width: img.width,
        height: img.height,
      });
      URL.revokeObjectURL(url);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };

    img.src = url;
  });
}
