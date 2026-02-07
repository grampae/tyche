+++
title = "sw_persist"
chapter = false
weight = 100
hidden = false
+++

## Summary

Manage service worker persistence in the current origin.
- Needs Admin: False  
- Version: 1  
- Author: @grampae  

### Arguments

#### action

- Description: Action to perform: `install`, `status`, or `remove`
- Required Value: False  
- Default Value: "install"  

## Usage

```
sw_persist
```

```
sw_persist {"action":"status"}
```

```
sw_persist {"action":"remove"}
```

## MITRE ATT&CK Mapping

- T1176  

## Detailed Summary

Uses the Service Worker API to register, list, or remove service workers. Install attempts may fail in most browsers when registering from a blob URL, and typically require HTTPS and a same-origin script path.
