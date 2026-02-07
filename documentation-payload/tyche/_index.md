+++
title = "tyche"
chapter = false
weight = 5
+++

![logo](/agents/tyche/tyche.svg?width=200px)
## Summary

Tyche is a browser-based JavaScript agent designed for XSS contexts. It communicates over MQTT WebSockets and supports dynamic loading in Mythic.

### Highlighted Agent Features
- Browser-native tasking: all commands execute in the active page context.
- Designed for XSS operations with a focus on data access, user interaction, and browser capabilities.
- Uses Mythic encryption and supports dynamic command loading.
- Optional payload obfuscation during build (none, light, medium, heavy).

### Important Notes
- Tyche runs inside a browser and is constrained by the target site's CSP, permissions, and same-origin rules.
- Some commands require user permission prompts (geolocation, notifications, clipboard, microphone, camera).
- The `screenshot` command loads `html2canvas` from a public CDN if it is not already present.

## Authors
@grampae
