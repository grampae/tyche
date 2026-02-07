+++
title = "phish"
chapter = false
weight = 100
hidden = false
+++

## Summary

Inject a fake session-expired login modal and capture submitted credentials.
- Needs Admin: False  
- Version: 1  
- Author: @grampae  

### Arguments

#### title

- Description: Modal title text
- Required Value: False  
- Default Value: "Session Expired"  

#### subtitle

- Description: Modal subtitle/description text
- Required Value: False  
- Default Value: "Your session has timed out. Please sign in again to continue."  

## Usage

```
phish
```

```
phish {"title":"Session Expired","subtitle":"Please sign in again."}
```

## MITRE ATT&CK Mapping

- T1056.002  

## Detailed Summary

Creates a full-screen overlay with a modal login form and waits for the user to submit credentials. Captured username and password values are returned to Mythic.
