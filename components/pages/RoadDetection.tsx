"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  detectRoadDamage,
  getImageMetadata,
  initializeModel,
} from "@/lib/road-damage-detector";
import { Loader2, Upload, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

interface DetectionResults {
  damageClass: string;
  confidence: number;
  size: string;
  width: number;
  height: number;
  processingTime: number;
}

const RoadDetector = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<DetectionResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modelLoaded, setModelLoaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize ONNX model on mount
  useEffect(() => {
    const loadModel = async () => {
      try {
        await initializeModel();
        setModelLoaded(true);
        console.log("Model initialized successfully");
      } catch (err) {
        console.error("Failed to initialize model:", err);
        setError("Failed to load detection model");
      }
    };

    loadModel();
  }, []);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (!validTypes.includes(file.type)) {
      setError("Please select a valid image file (JPG, JPEG, or PNG)");
      return;
    }

    setError(null);
    setSelectedFile(file);
    setResults(null);

    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  // Handle process button click
  const handleProcess = async () => {
    if (!selectedFile) {
      setError("Please select an image first");
      return;
    }

    if (!modelLoaded) {
      setError("Model is still loading, please wait...");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Get image metadata
      const metadata = await getImageMetadata(selectedFile);

      // Run detection
      const detection = await detectRoadDamage(selectedFile);

      // Update results
      setResults({
        damageClass: detection.class,
        confidence: detection.confidence,
        size: metadata.size,
        width: metadata.width,
        height: metadata.height,
        processingTime: detection.processingTime,
      });
    } catch (err) {
      console.error("Processing error:", err);
      setError("Failed to process image. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <div className="size-full flex flex-col items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">
            Road Damage Detector
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {/* Image Preview */}
          {previewUrl ? (
            <div className="relative w-full aspect-[2/3] rounded-lg overflow-hidden border">
              <Image
                src={previewUrl}
                alt="Selected road image"
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="w-full aspect-[2/3] rounded-lg border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <Upload className="w-12 h-12" />
              <p className="text-sm">No image selected</p>
            </div>
          )}

          {/* Results Table */}
          {results && (
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Result</TableCell>
                  <TableCell>{results.damageClass}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Confidence</TableCell>
                  <TableCell>{results.confidence.toFixed(2)}%</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Size</TableCell>
                  <TableCell>{results.size}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Resolution</TableCell>
                  <TableCell>
                    {results.width}px{" "}
                    <X className="inline text-primary my-auto" size={14} />{" "}
                    {results.height}px
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Processing Time</TableCell>
                  <TableCell>{results.processingTime.toFixed(0)} ms</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}

          {/* Model Loading Status */}
          {!modelLoaded && !error && (
            <div className="p-3 rounded-lg bg-muted text-sm flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading detection model...
            </div>
          )}

          {/* File Input */}
          <Input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png"
            onChange={handleFileChange}
            disabled={isProcessing}
          />

          {/* Process Button */}
          <Button
            className="w-full"
            onClick={handleProcess}
            disabled={!selectedFile || isProcessing || !modelLoaded}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              "Process"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default RoadDetector;
