+++
title = "post_url"
chapter = false
weight = 100
hidden = false
+++

## Summary

Perform an HTTP POST from the victim browser and return status, headers, and response body.
- Needs Admin: False  
- Version: 1  
- Author: @grampae  

### Arguments

#### url

- Description: URL to POST to
- Required Value: True  
- Default Value: None  

#### body

- Description: POST body (string or JSON)
- Required Value: False  
- Default Value: None  

#### headers

- Description: Optional request headers as JSON
- Required Value: False  
- Default Value: None  

## Usage

```
post_url {"url":"https://example.com/api","body":"hello"}
```

```
post_url {"url":"https://example.com/api","body":{"a":1},"headers":{"X-Test":"1"}}
```

## MITRE ATT&CK Mapping

- T1090  
- T1552.005  

## Detailed Summary

Uses `fetch` to send a POST request. If CORS blocks the request, it retries with `no-cors`, which may return an opaque response. If the body appears to be JSON and no content type is set, it automatically sets `Content-Type: application/json`.
