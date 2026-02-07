+++
title = "iframe"
chapter = false
weight = 100
hidden = false
+++

## Summary

Display a full-page overlay iframe pointing to a specified URL.
- Needs Admin: False  
- Version: 1  
- Author: @grampae  

### Arguments

#### url

- Description: URL to display in the full-page overlay iframe
- Required Value: True  
- Default Value: None  

## Usage

```
iframe https://example.com/login
```

```
iframe {"url":"https://example.com/login"}
```

## MITRE ATT&CK Mapping

- T1185  

## Detailed Summary

Injects a full-screen overlay with a sandboxed iframe. Any existing Tyche overlay is removed before inserting a new one.
