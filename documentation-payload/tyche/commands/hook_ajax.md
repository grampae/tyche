+++
title = "hook_ajax"
chapter = false
weight = 100
hidden = false
+++

## Summary

Intercept `XMLHttpRequest` and `fetch` traffic for a specified duration and return captured requests.
- Needs Admin: False  
- Version: 1  
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

Temporarily hooks `XMLHttpRequest` and `fetch` to log request metadata, headers, and response previews. Restores the original implementations after the duration expires.
