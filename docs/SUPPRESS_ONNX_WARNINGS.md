# How to Suppress ONNX Runtime Console Warnings

## The Warning

You may see this warning in your Next.js development console:

```
[W:onnxruntime:Default, cpuid_info.cc:91 LogEarlyWarning] Unknown CPU vendor. cpuinfo_vendor value: 0
```

## Important: This is HARMLESS ✅

- ✅ Your model loads correctly
- ✅ Inference works perfectly
- ✅ No performance impact
- ✅ This is expected behavior

See `ONNX_CPU_WARNING.md` for full technical explanation.

## Why You Can't Fully Suppress It

This warning comes from **ONNX Runtime's internal C++ code** compiled to WebAssembly. It cannot be completely suppressed because:

1. It's logged before any JavaScript code runs
2. It's part of the WASM binary itself
3. Next.js dev server captures and displays all console output

## Options to Reduce Console Noise

### Option 1: Just Ignore It (Recommended) ✅

The warning appears once when the model loads, then never again. It doesn't affect functionality.

**This is the recommended approach** - the warning is harmless and informational.

### Option 2: Filter Terminal Output

If you really want to hide it from your terminal, you can pipe the output:

```bash
# Linux/Mac
npm run dev 2>&1 | grep -v "Unknown CPU vendor"

# Or use a more sophisticated filter
npm run dev 2>&1 | grep -v -E "(Unknown CPU vendor|cpuid_info)"
```

### Option 3: Use a Custom Dev Script

Create a custom script in `package.json`:

```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "dev:quiet": "next dev --turbopack 2>&1 | grep -v 'Unknown CPU vendor'"
  }
}
```

Then run:
```bash
npm run dev:quiet
```

### Option 4: Disable ONNX Runtime Logging (Partial)

In your code, you can set the log level to error-only:

```typescript
ortRuntime.env.logLevel = "error"; // Only show errors, not warnings
```

**Note**: This only affects some warnings, not the CPU vendor warning which is logged very early.

## What We've Already Done

In `RealtimeDetection.tsx`, we've already:

1. ✅ Set `ortRuntime.env.logLevel = "warning"` to reduce verbose output
2. ✅ Added clear comments explaining the warning is expected
3. ✅ Added success messages so you know the model loaded correctly
4. ✅ Documented everything in `ONNX_CPU_WARNING.md`

## Summary

**Just ignore the warning!** It's harmless, expected, and doesn't indicate any problem with your code or setup.

If you see:
- ✅ "Model loaded successfully!"
- ✅ Green success banner in UI
- ✅ Model inputs/outputs logged

Then **everything is working perfectly**, regardless of the CPU vendor warning.
