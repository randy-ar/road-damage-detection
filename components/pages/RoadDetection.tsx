"use client";

import LocationComponent from "@/components/pages/location/LocationComponent";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import {
  detectRoadDamage,
  getImageMetadata,
  initializeModel,
} from "@/lib/road-damage-detector";
import { Loader2, Upload, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface DetectionResults {
  damageClass: string;
  confidence: number;
  size: string;
  width: number;
  height: number;
  processingTime: number;
}

interface LocationResponse {
  data: Location[];
}

interface Location {
  code: string;
  name: string;
}

const RoadDetector = () => {
  const router = useRouter();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState<DetectionResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modelLoaded, setModelLoaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPredicted, setIsPredicted] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Stored detection data for submit
  const [detectionData, setDetectionData] = useState<{
    class: string;
    confidence: number;
    processingTime: number;
  } | null>(null);
  const [imageMetadata, setImageMetadata] = useState<{
    size: string;
    width: number;
    height: number;
  } | null>(null);

  // Location state
  const [cities, setCities] = useState<Location[]>([]);
  const [districts, setDistricts] = useState<Location[]>([]);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  // Handle location change from LocationComponent
  const handleLocationChange = (lat: number, lng: number) => {
    setLatitude(lat);
    setLongitude(lng);
  };

  // Fetch cities on mount
  useEffect(() => {
    const fetchCities = async () => {
      try {
        const response = await fetch("/api/location/cities?code=32");
        const data = await response.json();
        setCities(data.data || []);
      } catch (err) {
        console.error("Failed to fetch cities:", err);
      }
    };
    fetchCities();
  }, []);

  // Fetch districts when city is selected
  useEffect(() => {
    if (!selectedCity) {
      setDistricts([]);
      setSelectedDistrict(null);
      return;
    }

    const fetchDistricts = async () => {
      try {
        const response = await fetch(
          `/api/location/districts?code=${selectedCity}`,
        );
        const data = await response.json();
        setDistricts(data.data || []);
      } catch (err) {
        console.error("Failed to fetch districts:", err);
      }
    };
    fetchDistricts();
  }, [selectedCity]);

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

  // Handle predict button click - only run prediction
  const handlePredict = async () => {
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
    setIsPredicted(false);
    setSubmitSuccess(false);

    try {
      // Get image metadata
      const metadata = await getImageMetadata(selectedFile);

      // Run detection
      const detection = await detectRoadDamage(selectedFile);

      // Update results
      const detectionResults = {
        damageClass: detection.class,
        confidence: detection.confidence,
        size: metadata.size,
        width: metadata.width,
        height: metadata.height,
        processingTime: detection.processingTime,
      };
      setResults(detectionResults);

      // Store detection data for later submit
      setDetectionData({
        class: detection.class,
        confidence: detection.confidence,
        processingTime: detection.processingTime,
      });
      setImageMetadata(metadata);

      setIsPredicted(true);
      toast.success(
        "Prediction completed! Please fill in the location details.",
      );
    } catch (err) {
      console.error("Processing error:", err);
      setError("Failed to process image. Please try again.");
      toast.error("Failed to process image. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle submit data - save to database
  const handleSubmitData = async () => {
    if (!selectedCity || !selectedDistrict) {
      setError("Please select city and district first");
      return;
    }

    if (!detectionData || !imageMetadata) {
      setError("No prediction data available. Please run prediction first.");
      return;
    }

    // Validate GPS coordinates - ensure they are valid numbers
    if (latitude === null || longitude === null) {
      setError("GPS coordinates are required. Please enable location access.");
      return;
    }

    // Validate coordinate ranges (Indonesia approximate bounds)
    if (latitude < -11 || latitude > 6 || longitude < 95 || longitude > 141) {
      setError(
        "GPS coordinates appear to be outside Indonesia. Please check your location.",
      );
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Get selected city and district names
      const selectedCityData = cities.find((c) => c.code === selectedCity);
      const selectedDistrictData = districts.find(
        (d) => d.code === selectedDistrict,
      );

      // Create FormData to send file and data
      const formData = new FormData();
      formData.append("kode_provinsi", "32");
      formData.append("nama_provinsi", "Jawa Barat");
      formData.append("kode_kabupaten_kota", selectedCity);
      formData.append("nama_kabupaten_kota", selectedCityData?.name || "");
      formData.append("kode_kecamatan", selectedDistrict);
      formData.append("nama_kecamatan", selectedDistrictData?.name || "");
      // Send coordinates with full precision (up to 17 significant digits)
      // toFixed(15) ensures maximum precision for GPS coordinates
      formData.append("latitude", latitude.toPrecision());
      formData.append("longitude", longitude.toPrecision());
      formData.append("damage_class", detectionData.class);
      formData.append("confidence", String(detectionData.confidence));
      formData.append("image_size", imageMetadata.size);
      formData.append("image_width", String(imageMetadata.width));
      formData.append("image_height", String(imageMetadata.height));
      formData.append("processing_time", String(detectionData.processingTime));

      // Append image file if available
      if (selectedFile) {
        formData.append("image", selectedFile);
      }

      // Save to database with image upload
      const saveResponse = await fetch("/api/road-damages", {
        method: "POST",
        body: formData,
      });

      const saveResult = await saveResponse.json();

      if (!saveResult.success) {
        console.error("Failed to save:", saveResult.error);
        setError(`Failed to save data: ${saveResult.error}`);
        toast.error(`Failed to save data: ${saveResult.error}`);
      } else {
        toast.success("Data saved successfully!");
        console.log("Saved successfully:", saveResult.data);
        setSubmitSuccess(true);
      }
    } catch (err) {
      console.error("Submit error:", err);
      setError("Failed to submit data. Please try again.");
      toast.error("Failed to submit data. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setSelectedCity(null);
    setSelectedDistrict(null);
    setIsProcessing(false);
    setIsSubmitting(false);
    setIsPredicted(false);
    setSubmitSuccess(false);
    setError(null);
    setResults(null);
    setDetectionData(null);
    setImageMetadata(null);
    setLatitude(null);
    setLongitude(null);
    setPreviewUrl(null);
    // Clear the file input element
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
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
            <div className="relative w-full aspect-2/3 rounded-lg overflow-hidden border">
              <Image
                src={previewUrl}
                alt="Selected road image"
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="w-full aspect-2/3 rounded-lg border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center gap-2 text-muted-foreground">
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

          {/* File Input - Only show when not predicted yet */}
          {!isPredicted && (
            <Input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png"
              onChange={handleFileChange}
              disabled={isProcessing}
            />
          )}

          {/* Predict Button - Show when file selected but not predicted */}
          {!isPredicted && !submitSuccess && (
            <Button
              className="w-full"
              onClick={handlePredict}
              disabled={!selectedFile || isProcessing || !modelLoaded}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Predicting...
                </>
              ) : (
                "Predict"
              )}
            </Button>
          )}

          {/* Location Form - Only show after prediction */}
          {isPredicted && !submitSuccess && (
            <>
              {/* City Select */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Kota/Kabupaten</label>
                <Select
                  value={selectedCity || undefined}
                  onValueChange={setSelectedCity}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih Kota/Kabupaten" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {cities.map((city) => (
                        <SelectItem key={city.code} value={city.code}>
                          {city.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              {/* District Select */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Kecamatan</label>
                <Select
                  value={selectedDistrict || undefined}
                  onValueChange={setSelectedDistrict}
                  disabled={!selectedCity}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih Kecamatan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {districts.map((district) => (
                        <SelectItem key={district.code} value={district.code}>
                          {district.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <LocationComponent
                cityCode={selectedCity || undefined}
                districtCode={selectedDistrict || undefined}
                onChange={handleLocationChange}
              />

              {/* Submit Button */}
              <Button
                className="w-full"
                onClick={handleSubmitData}
                disabled={!selectedCity || !selectedDistrict || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Data"
                )}
              </Button>
            </>
          )}

          {/* Process Again Button - Show after successful submit */}
          {submitSuccess && (
            <Button variant="outline" className="w-full" onClick={resetForm}>
              Process Again
            </Button>
          )}
        </CardContent>
      </Card>

      <Button
        className="w-fit mt-4"
        variant="outline"
        onClick={() => {
          router.push("/login");
        }}
        disabled={isProcessing}
      >
        Login
      </Button>
      <div className="text-center text-xs p-3">
        Login untuk melihat hasil deteksi
      </div>
    </div>
  );
};

export default RoadDetector;
