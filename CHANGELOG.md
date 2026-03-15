# Changelog

## v2.0.0 — 2026-03-15

### Fixed
- `pendingResponse` concurrency bug — Replaced single-slot callback with a keyed map (`pendingResponses`). Multiple simultaneous file downloads no longer cause tasks to hang.
- `fingerprint` stalling — All async browser API calls (`gpu.requestAdapter`, `keyboard.getLayoutMap`, `permissions.query`, `serial.getPorts`, etc.) now have timeouts (1–3s) so a single unresponsive API can't hang the entire command.
- `fingerprint` OPSEC console warnings — Replaced deprecated `WEBGL_debug_renderer_info` extension access with direct `RENDERER`/`VENDOR` reads (extension used as silent fallback). Replaced deprecated `InstallTrigger` Firefox detection with `MozAppearance` CSS property check.
- `jobs` not showing running tasks — `jobs` only checked the background task registry (keylogger/hook_ajax). Now tracks all active tasks via `activeTasks` map in `executeTask`, so any in-progress command appears in the listing. Background (killable) tasks are highlighted separately.
- `inject_script` CSP check always blocking — `checkCSP()` returns `{allowed, reason}` object, but code tested the object as truthy. Fixed to check `.allowed` property.
- `inject_script` process_response wrong parameter access — `task.Task.Params` gives raw JSON string, not parsed. Fixed with `json.loads()`.
- `keylogger` keylogs not stored in Mythic — `MythicRPCKeylogData.Keystrokes` expects a dict, not a string. Fixed by wrapping keystroke buffer in `{"keys": ...}`.
- `notifications` hanging forever — Permission request waits for a user click, but had no timeout. Added 30s timeout with informative error.
- `media_record` hanging forever — `getUserMedia()` browser permission prompt could be ignored indefinitely. Added 30s timeout.
- `sw_persist` blob URL rejected — Browsers reject `ServiceWorker.register()` with blob URLs. Removed broken blob approach; now requires same-origin URL parameter.

### Improved
- Standardized parameter parsing — Extracted repeated JSON parse boilerplate from 13 command files into a shared `parseParams(task)` utility in `base_agent.js`.
- Consistent error handling in `executeTask` — Commands returning `{error: ...}` objects are now automatically detected and marked with error status. All output is normalized to strings.
- `hook_ajax` now auto-hooks all browser comms: XHR, fetch, WebSocket, postMessage, and Navigation API (intercepts link clicks, form submits, redirects). Auto-detects available APIs. Output includes per-type breakdown and which hooks were active.
- Console suppression — `window.onerror` and `unhandledrejection` handlers suppress errors when debug mode is off, reducing detection surface.
- State persistence — Agent saves/restores state via localStorage for resilience across page reloads.
- Cross-tab leader election — Uses BroadcastChannel API so only one tab runs the agent when multiple tabs have the payload.
- Exponential backoff — MQTT reconnects use exponential backoff (capped) instead of fixed intervals.
- `iframe` — Replaced static `__tyche_overlay` ID with randomized `data-oid` attribute for OPSEC.
- `phish` — Replaced static `__tyche_phish` ID with randomized `data-oid` attribute. Added `trigger` parameter with `tab_switch` mode for tab nabbing. Captured credentials are now auto-stored in Mythic.
- `screenshot` — CSP check before loading html2canvas from CDN. Reports OPSEC error with suggestion to use `embed_html2canvas` build option.
- `inject_script` — CSP check before loading external script. Reports OPSEC warning if `script-src` policy may block the load.
- `storage` — Now enumerates Cache Storage API, Origin Private File System (OPFS), and saved browser credentials (Credential Management API) alongside cookies/localStorage/sessionStorage/IndexedDB. Cookies, tokens, and saved credentials auto-stored in Mythic Credentials.
- `fingerprint` — Major upgrade (v2). Now collects: authorized hardware devices (Serial/USB/HID/Bluetooth via silent `.getDevices()`), math fingerprint (engine-specific precision), vendor flavors (real browser identity beyond UA), speech synthesis voices (OS-specific), CPU architecture (32/64-bit via Float32Array), private browsing detection (storage quota), keyboard layout map (locale fingerprint), WebGPU adapter info (GPU vendor/arch/device/features), and CSS media preferences (dark mode, HDR, color gamut, forced colors, reduced motion, contrast, inverted colors, monochrome).
- `keylogger` — Captured keystrokes are now stored in Mythic's Keylogs, grouped by focused field.
- `notifications` — Permission request now waits for a user click event (browser requirement), instead of failing immediately.
- `sw_persist` — Removed broken blob URL approach. Now requires a `url` parameter pointing to a same-origin SW script. Running install without a URL returns recon. Added `scope` parameter. Version 2.
- MQTT connect — Wrapped in try/catch to handle mixed-content `DOMException` gracefully with an informative log message instead of crashing.

### Added
- Background task registry — Long-running commands (`keylogger`, `form_grabber`, `hook_ajax`) now register themselves and support early cancellation via the new `jobs` command.
- `jobs` command — List running background tasks or kill them by task ID. Killed tasks return data collected up to that point.
- `load_command` command — Dynamically load new commands into the running agent at runtime via `new Function()`. Has access to agent utilities (parseParams, downloadFile, checkCSP, etc.).
- `checkCSP(directive)` utility — Checks Content Security Policy meta tags and headers for a given directive, enabling OPSEC-aware external resource loading.
- Build option: `embed_html2canvas` — Embed html2canvas library into the payload for OPSEC (avoids CDN fetch at runtime).
- Build option: `minify` — Run terser minification before obfuscation to reduce payload size.
- Artifact tracking — `portscan`, `screenshot`, `iframe`, `inject_script`, `phish`, and `load_command` now register artifacts in Mythic for audit trail visibility.
- Browser script for `storage` — Tables for cookies, localStorage, sessionStorage, IndexedDB, Cache Storage, and interesting tokens. JWTs show decoded algorithm/type. Token matches highlighted.
- Browser script for `fingerprint` — Categorized tables for navigator, screen, WebGL, permissions (color-coded by state), feature detection (green/red), WebRTC IPs, media devices, plugins, and fonts.
- Browser script for `portscan` — Scan summary + open ports table with common service labels (SSH, HTTP, RDP, etc.) and color-coded state (open/closed/filtered).
- Browser script for `hook_ajax` — Capture summary + request timeline with HTTP status color-coding and a separate request/response body detail table.
- `proxy` command — Make HTTP requests from the victim's browser using their session/cookies. Replaces `get_url` and `post_url`. Supports all HTTP methods, custom headers, request bodies, credential modes, binary responses, and no-cors fallback. Large responses auto-saved as Mythic files. No MQTT listener changes required.
- Browser script for `proxy` — Response summary with HTTP status color-coding, response headers table, and body preview.

### Removed
- `get_url` command — Superseded by `proxy` with `method: GET`.
- `post_url` command — Superseded by `proxy` with `method: POST`.
