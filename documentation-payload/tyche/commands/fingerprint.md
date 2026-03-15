+++
title = "fingerprint"
chapter = false
weight = 100
hidden = false
+++

## Summary

Collect a detailed browser fingerprint including navigator data, screen info, WebGL, canvas, audio, WebRTC IPs, fonts, permissions, media devices, battery, feature detection, and authorized hardware devices.
- Needs Admin: False
- Version: 2
- Author: @grampae

### Arguments

## Usage

```
fingerprint
```

## MITRE ATT&CK Mapping

- T1082  
- T1016  

## Detailed Summary

Collects a large set of fingerprinting signals from standard browser APIs. Output includes navigator and screen details, WebGL information, canvas and audio fingerprints, storage capability indicators, battery status (when available), media device enumeration, WebRTC local IPs, permission states, and detected fonts.

**Authorized Device Enumeration:** Silently queries Web Serial, Web USB, Web HID, and Web Bluetooth APIs for devices the victim has previously authorized on this origin. These calls use `.getDevices()` / `.getPorts()` which do **not** require a user gesture — if the victim previously granted access (e.g., using a web-based serial terminal, Arduino IDE, or BLE tool), those devices are immediately accessible. Authorized devices are highlighted in the browser script output.

- **Serial**: Shows USB vendor/product IDs, readable/writable state
- **USB**: Shows product name, manufacturer, serial number, open state
- **HID**: Shows product name, HID collection count, open state
- **Bluetooth**: Shows device name, ID, GATT connection state

**Advanced Fingerprinting Signals (v2):**
- **Math fingerprint** — Evaluates 12 math functions that produce different results across JS engines (V8 vs SpiderMonkey vs JSCore)
- **Vendor flavors** — Detects real browser identity via engine-specific globals (`window.chrome`, `window.safari`, `navigator.brave`, etc.)
- **Speech synthesis voices** — Enumerates OS-specific TTS voice list (highly unique per OS/locale)
- **CPU architecture** — Detects 32-bit vs 64-bit via Float32Array NaN byte pattern
- **Private browsing detection** — Checks storage quota to detect incognito/private mode
- **Keyboard layout** — Maps physical keys to locale-specific characters via `navigator.keyboard.getLayoutMap()`
- **WebGPU adapter** — GPU vendor, architecture, device name, and feature list via `navigator.gpu.requestAdapter()`
- **CSS media preferences** — Dark mode, HDR, color gamut (sRGB/P3/Rec2020), forced colors, inverted colors, reduced motion, contrast preference, monochrome
- **Navigation history** — Full tab navigation history via Navigation API `navigation.entries()`
