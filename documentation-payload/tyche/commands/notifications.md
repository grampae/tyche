+++
title = "notifications"
chapter = false
weight = 100
hidden = false
+++

## Summary

Send browser notifications with a customizable title, body, icon, and click URL.
- Needs Admin: False  
- Version: 1  
- Author: @grampae  

### Arguments

#### title

- Description: Notification title
- Required Value: False  
- Default Value: "IT Security Alert"  

#### body

- Description: Notification body text
- Required Value: False  
- Default Value: "Unusual login detected on your account. Click to verify your identity."  

#### icon

- Description: Icon URL to display in the notification
- Required Value: False  
- Default Value: ""  

#### url

- Description: URL to open when the notification is clicked
- Required Value: False  
- Default Value: ""  

#### count

- Description: Number of notifications to send
- Required Value: False  
- Default Value: 1  

## Usage

```
notifications
```

```
notifications {"title":"System Alert","body":"Click to review.","url":"https://example.com/"}
```

## MITRE ATT&CK Mapping

- T1204.001  

## Detailed Summary

Uses the browser Notification API. If permission is not yet granted, the browser will prompt the user. Optionally opens a URL when the notification is clicked.
