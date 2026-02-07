+++
title = "screenshot"
chapter = false
weight = 100
hidden = false
+++

## Summary

Capture a screenshot of the current page.
- Needs Admin: False  
- Version: 2  
- Author: @grampae  

### Arguments

## Usage

```
screenshot
```

## MITRE ATT&CK Mapping

- T1113  

## Detailed Summary

Uses `html2canvas` to render the current page into a canvas and uploads the resulting PNG to Mythic. If `html2canvas` is not already loaded, it is fetched from a public CDN.
