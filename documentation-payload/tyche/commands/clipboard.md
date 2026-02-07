+++
title = "clipboard"
chapter = false
weight = 100
hidden = false
+++

## Summary

Read the victim's clipboard contents using the Clipboard API and fallback methods. Requires HTTPS and may prompt the user for permission.
- Needs Admin: False  
- Version: 1  
- Author: @grampae  

### Arguments

## Usage

```
clipboard
```

## MITRE ATT&CK Mapping

- T1115  

## Detailed Summary

Attempts to read clipboard data in the browser context. The command tries the Clipboard API first and falls back to `execCommand`-style access when available. Output includes the captured clipboard contents or an error if permission is denied.
