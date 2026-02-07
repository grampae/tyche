+++
title = "portscan"
chapter = false
weight = 100
hidden = false
+++

## Summary

Perform a browser-based port scan by timing HTTP requests.
- Needs Admin: False  
- Version: 1  
- Author: @grampae  

### Arguments

#### targets

- Description: Target IPs (single, comma-separated, or CIDR /24)
- Required Value: False  
- Default Value: "127.0.0.1"  

#### ports

- Description: Ports list or ranges (for example, "80,443,8000-8100")
- Required Value: False  
- Default Value: "80,443,8080,8443,3000,3389,5900,22,21,25,8000,8888,9090"  

#### timeout

- Description: Timeout per probe in milliseconds
- Required Value: False  
- Default Value: 2000  

## Usage

```
portscan
```

```
portscan {"targets":"192.168.1.0/24","ports":"22,80,443","timeout":1500}
```

## MITRE ATT&CK Mapping

- T1046  

## Detailed Summary

Issues timed HTTP requests to infer open ports from the browser context. Only ports determined as open are returned in the results. This can generate substantial network noise.
