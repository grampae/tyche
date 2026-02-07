+++
title = "OPSEC"
chapter = false
weight = 10
pre = "<b>1. </b>"
+++

## Considerations

- Tyche runs inside a browser tab and is subject to browser security controls, site CSP, and user permissions.
- Commands that inject UI elements (like `phish`, `iframe`, and `fakemalware`) are visible to the user.
- Commands that hook APIs (`hook_ajax`, `keylogger`, `form_grabber`) modify page behavior while active.

### Potential Prompts and Permissions

The following commands can trigger browser permission prompts or require HTTPS:
- `clipboard` (clipboard access)
- `geolocation`
- `media_record` (microphone and/or camera)
- `webcam_snap` (camera)
- `notifications` (notification permission)

### Network and External Resources

- `screenshot` loads `https://html2canvas.hertzen.com/dist/html2canvas.min.js` if the library is not already present.
- `inject_script`, `get_url`, `post_url`, and `drive_download` generate outbound network requests from the victim browser.
- `portscan` issues many outbound requests and can be noisy in network logs.
