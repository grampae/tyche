+++
title = "form_grabber"
chapter = false
weight = 100
hidden = false
+++

## Summary

Intercept form submissions for a specified duration and capture field values, including passwords.
- Needs Admin: False  
- Version: 1  
- Author: @grampae  

### Arguments

#### duration

- Description: Capture duration in seconds (default 120)
- Required Value: False  
- Default Value: 120  

## Usage

```
form_grabber
```

```
form_grabber {"duration":300}
```

## MITRE ATT&CK Mapping

- T1056.003  

## Detailed Summary

Hooks form submissions in the current page and records the action, method, and all field values for the specified duration. Returns captured submissions when complete.
