# Road Damage Detection Labels

## Overview

This document explains the label mapping used in the Road Damage Detection system, based on the [Sekilab RoadDamageDetector](https://github.com/sekilab/RoadDamageDetector) dataset.

## Standard Labels

The Road Damage Detection Challenge focuses on **4 main categories** of road damage:

| Class ID | Label Code | Full Name | Description (Bahasa Indonesia) |
|----------|------------|-----------|--------------------------------|
| 0 | D00 | Longitudinal Crack | Retakan memanjang sejajar arah lalu lintas |
| 1 | D10 | Transverse Crack | Retakan melintang tegak lurus arah lalu lintas |
| 2 | D20 | Alligator Crack | Retakan bercabang membentuk pola seperti kulit buaya |
| 3 | D40 | Pothole | Lubang besar di permukaan jalan |

### Detailed Descriptions

#### D00 - Longitudinal Crack
- **Type**: Linear crack
- **Direction**: Parallel to traffic flow
- **Severity**: Minor to Moderate
- **Color**: 🟢 Green
- **Causes**: Thermal expansion/contraction, poor construction joints

#### D10 - Transverse Crack
- **Type**: Linear crack
- **Direction**: Perpendicular to traffic flow
- **Severity**: Moderate
- **Color**: 🟡 Yellow
- **Causes**: Thermal stress, reflection cracking, poor drainage

#### D20 - Alligator Crack
- **Type**: Interconnected cracks
- **Pattern**: Resembles alligator skin
- **Severity**: Severe
- **Color**: 🟠 Orange
- **Causes**: Fatigue failure, structural weakness, heavy traffic load

#### D40 - Pothole
- **Type**: Surface depression/hole
- **Severity**: Critical
- **Color**: 🔴 Red
- **Causes**: Water infiltration, freeze-thaw cycles, traffic stress

## Additional Labels

Some models may include additional labels for construction joints and road markings:

| Class ID | Label Code | Full Name | Description |
|----------|------------|-----------|-------------|
| 4 | D01 | Construction Joint (Longitudinal) | Linear crack at construction joint, parallel to traffic |
| 5 | D11 | Construction Joint (Transverse) | Linear crack at construction joint, perpendicular to traffic |
| 6 | D43 | Crosswalk Blur | Faded or worn zebra crossing markings |
| 7 | D44 | White Line Blur | Faded or worn white road markings |

> **Note**: Labels D01, D11, D43, and D44 are **less commonly used** in most implementations because:
> - Unbalanced distribution in datasets
> - Different standards across countries
> - Focus on structural damage rather than markings

## Color Coding System

The bounding box colors are assigned based on severity:

```
🔴 Red (#FF0000)      - Critical: D40 (Pothole)
🟠 Orange (#FFA500)   - Severe: D20 (Alligator Crack)
🟡 Yellow (#FFFF00)   - Moderate: D10 (Transverse Crack)
🟢 Green (#00FF00)    - Minor: D00 (Longitudinal Crack)
🔵 Cyan (#00FFFF)     - Markings: D43, D44
```

## Model Output Format

Each detection includes:

```typescript
{
  classId: number,        // 0-7
  className: string,      // e.g., "D00 - Longitudinal Crack"
  confidence: number,     // 0.0 - 1.0
  bbox: {
    xmin: number,        // pixels
    ymin: number,        // pixels
    xmax: number,        // pixels
    ymax: number         // pixels
  }
}
```

## Dataset References

- **Primary Source**: [Sekilab RoadDamageDetector](https://github.com/sekilab/RoadDamageDetector)
- **Challenge**: Road Damage Detection Challenge (RDD2020, ORDDC2024)
- **Label Map File**: `label_map.pbtxt` in the repository
- **Focus**: 4 main classes (D00, D10, D20, D40) for cross-country generalization

## Implementation Notes

### In `ssd-detector.ts`

```typescript
export const DAMAGE_LABEL_MAP: { [key: number]: string } = {
  0: "D00 - Longitudinal Crack",
  1: "D10 - Transverse Crack",
  2: "D20 - Alligator Crack",
  3: "D40 - Pothole",
  // Additional labels (optional)
  4: "D01 - Construction Joint (Long.)",
  5: "D11 - Construction Joint (Trans.)",
  6: "D43 - Crosswalk Blur",
  7: "D44 - White Line Blur",
};
```

### Model Training

If you're training your own model:
- Focus on the **4 main classes** for better generalization
- Ensure balanced dataset across all classes
- Consider regional differences in road construction standards
- Validate on diverse weather and lighting conditions

## Severity Assessment

Based on the detected damage type, you can assess repair priority:

| Priority | Damage Types | Action Required |
|----------|--------------|-----------------|
| 🔴 **Critical** | D40 (Pothole) | Immediate repair required |
| 🟠 **High** | D20 (Alligator Crack) | Repair within 1-2 weeks |
| 🟡 **Medium** | D10 (Transverse Crack) | Repair within 1-2 months |
| 🟢 **Low** | D00 (Longitudinal Crack) | Monitor and schedule maintenance |

## References

1. Sekilab RoadDamageDetector: https://github.com/sekilab/RoadDamageDetector
2. Road Damage Detection Challenge: https://rdd2020.sekilab.global/
3. ORDDC 2024: https://orddc2024.sekilab.global/
