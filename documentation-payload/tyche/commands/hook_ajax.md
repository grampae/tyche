+++
title = "hook_ajax"
chapter = false
weight = 100
hidden = false
+++

## Summary

Intercept all browser network traffic for a specified duration. Auto-hooks XHR, fetch, WebSocket, and postMessage.
- Needs Admin: False
- Version: 2
- Author: @grampae

### Arguments

#### duration

- Description: Capture duration in seconds (default 60)
- Required Value: False
- Default Value: 60

## Usage

```
hook_ajax
```

```
hook_ajax {"duration":180}
```

## MITRE ATT&CK Mapping

- T1557

## Detailed Summary

Automatically hooks all available browser communication APIs:

- **XMLHttpRequest** — Intercepts `open`, `send`, and `setRequestHeader` to capture request method, URL, headers, body, and response previews.
- **fetch** — Wraps `window.fetch` to capture the same metadata as XHR hooks.
- **WebSocket** — Wraps the `WebSocket` constructor to intercept `send()` calls and incoming `message` events on any new WebSocket connections. Captures message direction (SEND/RECV), target URL, and message content previews. Does not intercept WebSocket connections that were opened before the hook started.
- **postMessage** — Wraps `window.postMessage` for outbound messages and listens for incoming `message` events. Captures cross-origin communication including SSO tokens, OAuth flows, and cross-iframe data.

All hooks are auto-detected and applied based on API availability. The output summary shows which APIs were hooked and a per-type breakdown of intercepted traffic.

Restores all original implementations after the duration expires or when cancelled via the `jobs` command. Captured data collected before cancellation is still returned.
