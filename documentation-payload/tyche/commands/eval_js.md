+++
title = "eval_js"
chapter = false
weight = 100
hidden = false
+++

## Summary

Execute JavaScript in the browser context via `eval()` and return the result.
- Needs Admin: False  
- Version: 1  
- Author: @grampae  

### Arguments

#### code

- Description: JavaScript code to execute in the browser context
- Required Value: True  
- Default Value: None  

## Usage

```
eval_js alert('hello')
```

## MITRE ATT&CK Mapping

- T1059.007  

## Detailed Summary

Evaluates the provided JavaScript in the current page context and returns the result or any error output.
