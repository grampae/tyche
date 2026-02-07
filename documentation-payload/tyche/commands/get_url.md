+++
title = "get_url"
chapter = false
weight = 100
hidden = false
+++

## Summary

Perform an HTTP GET from the victim browser and return status, headers, and response body.
- Needs Admin: False  
- Version: 1  
- Author: @grampae  

### Arguments

#### url

- Description: URL to fetch (for example, http://169.254.169.254/latest/meta-data/)
- Required Value: True  
- Default Value: None  

#### headers

- Description: Optional request headers as JSON
- Required Value: False  
- Default Value: None  

## Usage

```
get_url https://example.com/
```

```
get_url {"url":"https://example.com/","headers":{"X-Test":"1"}}
```

## MITRE ATT&CK Mapping

- T1090  
- T1552.005  

## Detailed Summary

Uses `fetch` to perform the request. If CORS blocks the request, it retries with `no-cors`, which may return an opaque response. Output includes status, headers (when available), and a truncated body.
