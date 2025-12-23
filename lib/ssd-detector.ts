import { Tensor } from "onnxruntime-web";

// Label map untuk class detection
export const DAMAGE_LABEL_MAP: { [key: number]: string } = {
  0: "Berat",
  1: "Ringan",
  2: "Sedang",
  3: "Longitudinal Crack",
  4: "Transverse Crack",
  5: "Alligator Crack",
  6: "Pothole",
  7: "Other",
};

export interface DetectionBox {
  classId: number;
  className: string;
  confidence: number;
  bbox: {
    xmin: number;
    ymin: number;
    xmax: number;
    ymax: number;
  };
}

/**
 * Preprocess video frame untuk SSD MobileNet
 * Input: HTMLVideoElement
 * Output: ONNX Tensor dengan shape [1, 300, 300, 3] (NHWC format, uint8)
 */
export function preprocessVideoForSSD(
  video: HTMLVideoElement,
  inputSize: number = 300
): Tensor {
  // 1. Buat canvas untuk resize
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = inputSize;
  canvas.height = inputSize;

  if (!ctx) throw new Error("Canvas context failed");

  // 2. Gambar video ke canvas (resize ke 300x300)
  ctx.drawImage(video, 0, 0, inputSize, inputSize);
  const imgData = ctx.getImageData(0, 0, inputSize, inputSize).data;

  // 3. Konversi ke Uint8Array (NHWC format: [1, 300, 300, 3])
  // SSD MobileNet menggunakan uint8, bukan float32 yang sudah dinormalisasi
  const uint8Data = new Uint8Array(1 * inputSize * inputSize * 3);

  for (let i = 0; i < inputSize * inputSize; i++) {
    uint8Data[i * 3] = imgData[i * 4]; // R
    uint8Data[i * 3 + 1] = imgData[i * 4 + 1]; // G
    uint8Data[i * 3 + 2] = imgData[i * 4 + 2]; // B
  }

  // 4. Return ONNX Tensor dengan format NHWC
  return new Tensor("uint8", uint8Data, [1, inputSize, inputSize, 3]);
}

/**
 * Parse output dari SSD MobileNet
 * Output biasanya: [boxes, scores, classes, num_detections]
 */
export function parseSSDOutput(
  outputs: Record<string, Tensor>,
  threshold: number = 0.5,
  videoWidth: number,
  videoHeight: number
): DetectionBox[] {
  const detections: DetectionBox[] = [];

  // Get output tensor names (outputs is an object, not an array)
  const outputNames = Object.keys(outputs);

  // SSD MobileNet typically has these outputs (names may vary):
  // - detection_boxes or boxes: [1, num_detections, 4] - format [ymin, xmin, ymax, xmax] (normalized 0-1)
  // - detection_scores or scores: [1, num_detections]
  // - detection_classes or classes: [1, num_detections]
  // - num_detections: [1]

  // Try to find the correct output tensors by name
  const boxesKey = outputNames.find(
    (name) => name.includes("boxes") || name.includes("detection_boxes")
  );
  const scoresKey = outputNames.find(
    (name) => name.includes("scores") || name.includes("detection_scores")
  );
  const classesKey = outputNames.find(
    (name) => name.includes("classes") || name.includes("detection_classes")
  );
  const numDetectionsKey = outputNames.find(
    (name) => name.includes("num_detections") || name.includes("num")
  );

  // If we can't find the outputs by name, use the order (fallback)
  const boxesTensor = boxesKey ? outputs[boxesKey] : outputs[outputNames[0]];
  const scoresTensor = scoresKey ? outputs[scoresKey] : outputs[outputNames[1]];
  const classesTensor = classesKey
    ? outputs[classesKey]
    : outputs[outputNames[2]];
  const numDetectionsTensor = numDetectionsKey
    ? outputs[numDetectionsKey]
    : outputs[outputNames[3]];

  if (!boxesTensor || !scoresTensor || !classesTensor) {
    console.warn(
      "Missing required output tensors. Available outputs:",
      outputNames
    );
    return detections;
  }

  const boxes = boxesTensor.data as Float32Array;
  const scores = scoresTensor.data as Float32Array;
  const classes = classesTensor.data as Float32Array | Int32Array;
  const numDetections = numDetectionsTensor
    ? Math.min(Math.floor((numDetectionsTensor.data as Float32Array)[0]), 100)
    : Math.min(scores.length, 100); // Fallback: use scores length

  for (let i = 0; i < numDetections; i++) {
    const score = scores[i];

    // Filter berdasarkan threshold
    if (score >= threshold) {
      // Boxes dalam format [ymin, xmin, ymax, xmax] (normalized 0-1)
      const ymin = boxes[i * 4];
      const xmin = boxes[i * 4 + 1];
      const ymax = boxes[i * 4 + 2];
      const xmax = boxes[i * 4 + 3];

      const classId = Math.floor(classes[i]);
      const className = DAMAGE_LABEL_MAP[classId] || `Class ${classId}`;

      detections.push({
        classId,
        className,
        confidence: score,
        bbox: {
          xmin: xmin * videoWidth,
          ymin: ymin * videoHeight,
          xmax: xmax * videoWidth,
          ymax: ymax * videoHeight,
        },
      });
    }
  }

  return detections;
}

/**
 * Gambar bounding boxes ke canvas
 */
export function drawDetections(
  ctx: CanvasRenderingContext2D,
  detections: DetectionBox[]
): void {
  detections.forEach((detection) => {
    const { bbox, className, confidence } = detection;
    const { xmin, ymin, xmax, ymax } = bbox;

    const width = xmax - xmin;
    const height = ymax - ymin;

    // Warna berbeda untuk setiap class
    const colors: { [key: string]: string } = {
      Berat: "#FF0000", // Red
      Sedang: "#FFA500", // Orange
      Ringan: "#FFFF00", // Yellow
      "Longitudinal Crack": "#00FF00",
      "Transverse Crack": "#00FFFF",
      "Alligator Crack": "#FF00FF",
      Pothole: "#FF0000",
      Other: "#FFFFFF",
    };

    const color = colors[className] || "#00FF00";

    // Gambar bounding box
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.strokeRect(xmin, ymin, width, height);

    // Gambar label background
    const label = `${className}: ${(confidence * 100).toFixed(0)}%`;
    ctx.font = "16px Arial";
    const textMetrics = ctx.measureText(label);
    const textHeight = 20;

    ctx.fillStyle = color;
    ctx.fillRect(
      xmin,
      ymin - textHeight - 4,
      textMetrics.width + 8,
      textHeight + 4
    );

    // Gambar label text
    ctx.fillStyle = "#000000";
    ctx.fillText(label, xmin + 4, ymin - 8);
  });
}
