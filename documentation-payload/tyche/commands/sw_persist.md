+++
title = "sw_persist"
chapter = false
weight = 100
hidden = false
+++

## Summary

Manage service worker persistence in the current origin.
- Needs Admin: False  
- Version: 2
- Author: @grampae

### Arguments

#### action

- Description: Action to perform: `install`, `status`, or `remove`
- Required Value: False
- Default Value: "install"

#### url

- Description: Same-origin URL of the service worker JS file to register (required for install)
- Required Value: False
- Default Value: ""

#### scope

- Description: Scope path for the service worker registration
- Required Value: False
- Default Value: "/"

## Usage

```
sw_persist {"action":"status"}
```

```
sw_persist {"action":"install","url":"/sw.js"}
```

```
sw_persist {"action":"install","url":"/assets/worker.js","scope":"/app/"}
```

```
sw_persist {"action":"remove"}
```

## MITRE ATT&CK Mapping

- T1176

## Detailed Summary

Uses the Service Worker API to register, list, or remove service workers. Requires HTTPS.

**Important:** Browsers only allow service worker registration from same-origin HTTP/HTTPS URLs — blob and data URIs are rejected. You must host your SW script at a path on the target origin. Options include:

- Upload a JS file to the target via file upload functionality
- Find a reflected/stored XSS endpoint that returns JS with `Content-Type: application/javascript`
- Use `inject_script` to serve a SW file from your infrastructure if CORS allows it

Running `install` without a `url` parameter returns recon: existing SW registrations, origin, and whether it's a secure context.

**Actions:**
- `install` — Register a service worker from the given URL and scope
- `status` — List all existing service worker registrations (scope, script URL, state)
- `remove` — Unregister all service workers on the origin
