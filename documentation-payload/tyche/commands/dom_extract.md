+++
title = "dom_extract"
chapter = false
weight = 100
hidden = false
+++

## Summary

Scrape the page DOM for sensitive data such as forms, hidden inputs, email addresses, meta tags, HTML comments, external scripts, and iframes.
- Needs Admin: False  
- Version: 1  
- Author: @grampae  

### Arguments

## Usage

```
dom_extract
```

## MITRE ATT&CK Mapping

- T1005  
- T1213  

## Detailed Summary

Collects a snapshot of the current DOM, including form fields, hidden inputs (commonly CSRF tokens), a sample of links, discovered email addresses, meta tags, external script sources, comments, and iframe sources.
