+++
title = "proxy"
chapter = false
weight = 100
hidden = false
+++

## Summary

Make HTTP requests from the victim's browser using their session and cookies.
- Needs Admin: False
- Version: 1
- Author: @grampae

### Arguments

#### url

- Description: URL to request
- Required Value: True

#### method

- Description: HTTP method
- Required Value: False
- Default Value: "GET"
- Choices: GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS

#### body

- Description: Request body (for POST/PUT/PATCH)
- Required Value: False
- Default Value: ""

#### headers

- Description: Request headers as JSON object
- Required Value: False
- Default Value: ""

#### credentials

- Description: Cookie/credential mode
- Required Value: False
- Default Value: "include"
- Choices: include, same-origin, omit

## Usage

```
proxy http://internal.corp:8080/api/users
```

```
proxy {"url":"http://10.0.0.1:8080/admin","method":"GET"}
```

```
proxy {"url":"https://api.internal/v1/users","method":"POST","body":"{\"name\":\"test\"}","headers":"{\"Content-Type\":\"application/json\"}"}
```

## MITRE ATT&CK Mapping

- T1090
- T1552.005

## Detailed Summary

Makes HTTP requests from the victim's browser using `fetch`. Since the request originates from the victim's browser, it carries their cookies/session tokens and has access to internal resources they can reach.

**Key capabilities:**
- Access internal APIs, admin panels, and services behind the corporate network
- Requests include the victim's cookies by default (`credentials: include`)
- Supports all HTTP methods and custom headers
- Binary responses (images, files) are base64-encoded
- Large responses (>100KB) are automatically saved as files in Mythic

**Limitations:**
- CORS policies may block cross-origin responses (the request is still sent, but the browser may not return the response body)
- CSP `connect-src` directives may restrict which URLs can be fetched
- Mixed content: HTTPS pages cannot fetch HTTP URLs
- Each request is a separate task, so there's inherent latency from the tasking loop

**Credential modes:**
- `include` — Send cookies even for cross-origin requests (default, most useful for assessments)
- `same-origin` — Only send cookies for same-origin requests
- `omit` — Never send cookies

**No MQTT changes required** — proxy requests are standard tasks routed through the existing MQTT transport.

This command replaces the previous `get_url` and `post_url` commands, which are now removed. Use `proxy` with the appropriate method instead.
