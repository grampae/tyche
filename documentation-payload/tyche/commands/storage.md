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

Collects cookies, localStorage, sessionStorage, and IndexedDB database names. It also scans values and meta tags for common token patterns such as JWTs, bearer tokens, and API keys.
