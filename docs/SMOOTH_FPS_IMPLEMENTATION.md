# Smooth FPS with Interval-Based Inference

## Implementation Strategy

To achieve **smooth video rendering** (60 FPS) while **controlling inference frequency** (1-5 seconds), we need to **separate two loops**:

### 1. **Rendering Loop** (runs every frame ~60 FPS)
- Uses `requestAnimationFrame()`
- Draws video frame to canvas
- Draws last detection results (bounding boxes)
- Calculates and displays FPS
- **Does NOT run inference** - just displays results

### 2. **Inference Loop** (runs at selected interval)
- Uses `setInterval()` with user-selected interval
- Runs model inference
- Updates detection results in state
- **Does NOT draw** - just computes

## Code Structure

```typescript
// State to store last detection results
const [lastDetections, setLastDetections] = useState<DetectionBox[]>([]);

// Rendering Loop - Smooth 60 FPS
useEffect(() => {
  if (!session || !ort) return;
  
  let requestID: number;
  let lastTime = performance.now();
  let frameCount = 0;

  const renderFrame = () => {
    if (videoRef.current && canvasRef.current && videoRef.current.readyState === 4) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      if (ctx) {
        // Update canvas size
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw video frame
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Draw last detection results (if any)
        if (lastDetections.length > 0) {
          drawDetections(ctx, lastDetections);
        }

        // Calculate FPS
        frameCount++;
        const currentTime = performance.now();
        if (currentTime - lastTime >= 1000) {
          setFps(frameCount);
          frameCount = 0;
          lastTime = currentTime;
        }
      }
    }

    requestID = requestAnimationFrame(renderFrame);
  };

  renderFrame();
  return () => cancelAnimationFrame(requestID);
}, [session, ort, lastDetections]); // Re-render when detections change

// Inference Loop - Runs at selected interval
useEffect(() => {
  if (!session || !ort) return;

  let isProcessing = false;
  let intervalID: NodeJS.Timeout;

  const runInference = async () => {
    if (
      videoRef.current &&
      canvasRef.current &&
      !isProcessing &&
      videoRef.current.readyState === 4
    ) {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      isProcessing = true;

      try {
        // Preprocessing
        const inputTensor = preprocessVideoForSSD(video, 300);

        // Run Inference
        const inputName = session.inputNames[0];
        const feeds = { [inputName]: inputTensor };
        const outputs = await session.run(feeds);

        // Parse results
        const detections = parseSSDOutput(
          outputs,
          0.5,
          canvas.width,
          canvas.height
        );

        // Update state (will trigger re-render)
        setLastDetections(detections);
        setDetectionCount(detections.length);

        if (detections.length > 0) {
          console.log(`Detected ${detections.length} object(s):`, detections);
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown detection error";
        console.warn("Error during detection:", errorMessage);
      } finally {
        isProcessing = false;
      }
    }
  };

  // Run inference at selected interval
  intervalID = setInterval(runInference, inferenceInterval);

  // Run first inference immediately
  runInference();

  return () => clearInterval(intervalID);
}, [session, ort, inferenceInterval]);
```

## Benefits

### ✅ Smooth UI
- Video renders at 60 FPS
- No stuttering or lag
- Bounding boxes stay visible between inferences

### ✅ Controlled Resource Usage
- Inference only runs at selected interval (1-5 seconds)
- CPU/GPU usage is predictable
- Battery-friendly for mobile devices

### ✅ Better UX
- User sees smooth video feed
- Detection results persist until next inference
- Clear visual feedback of detection frequency

## Implementation Steps

1. Add `lastDetections` state
2. Split existing `detectFrame` into two functions:
   - `renderFrame()` - for smooth rendering
   - `runInference()` - for model inference
3. Use `requestAnimationFrame()` for rendering loop
4. Use `setInterval()` for inference loop
5. Update state when new detections are available
6. Render loop automatically picks up new detections

## Result

- **FPS Display**: Shows actual rendering FPS (~60)
- **Inference**: Runs at user-selected interval (1-5 seconds)
- **Bounding Boxes**: Stay visible until next inference update
- **Performance**: Much better resource usage
