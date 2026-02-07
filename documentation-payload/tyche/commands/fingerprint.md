+++
title = "fingerprint"
chapter = false
weight = 100
hidden = false
+++

## Summary

Collect a detailed browser fingerprint including navigator data, screen info, WebGL, canvas, audio, WebRTC IPs, fonts, permissions, media devices, battery, and feature detection.
- Needs Admin: False  
- Version: 1  
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
