+++
title = "geolocation"
chapter = false
weight = 100
hidden = false
+++

## Summary

Get the victim's physical location via the Geolocation API. May trigger a browser permission prompt.
- Needs Admin: False  
- Version: 1  
- Author: @grampae  

### Arguments

## Usage

```
geolocation
```

## MITRE ATT&CK Mapping

- T1614  

## Detailed Summary

Uses the browser Geolocation API with high accuracy enabled and returns coordinates, accuracy, and a Google Maps URL if access is granted.
