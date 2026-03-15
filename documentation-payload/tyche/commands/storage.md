+++
title = "storage"
chapter = false
weight = 100
hidden = false
+++

## Summary

Dump browser storage and scan for common token patterns.
- Needs Admin: False  
- Version: 1  
- Author: @grampae  

### Arguments

## Usage

```
storage
```

## MITRE ATT&CK Mapping

- T1539  
- T1005  

## Detailed Summary

Collects cookies, localStorage, sessionStorage, IndexedDB database names, and Cache Storage contents. It also scans values and meta tags for common token patterns such as JWTs, bearer tokens, and API keys.

**Cache Storage** — Enumerates all caches via the Cache API, opens each, and lists cached URLs (up to 50 per cache). Cache URLs are also scanned for token patterns.

**Origin Private File System (OPFS)** — Enumerates files in the origin's private filesystem via `navigator.storage.getDirectory()`. No user gesture needed. Files stored here are invisible in DevTools and survive cache clears.

**Saved Credentials** — Silently queries the Credential Management API (`navigator.credentials.get({password: true, mediation: 'silent'})`) for browser-stored passwords on the current origin. Returns credentials without any user prompt if the browser allows silent mediation.

All cookies, tokens, and saved credentials are automatically stored in Mythic's Credentials tab. Output is rendered as interactive tables in the Mythic UI via browser script, with interesting tokens highlighted for quick identification.
