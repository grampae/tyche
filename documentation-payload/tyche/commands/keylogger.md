+++
title = "keylogger"
chapter = false
weight = 100
hidden = false
+++

## Summary

Capture keystrokes in the current page for a specified duration.
- Needs Admin: False  
- Version: 1  
- Author: @grampae  

### Arguments

#### duration

- Description: Capture duration in seconds (default 60)
- Required Value: False  
- Default Value: 60  

## Usage

```
keylogger
```

```
keylogger {"duration":120}
```

## MITRE ATT&CK Mapping

- T1056.001  

## Detailed Summary

Installs a keydown listener and records keystrokes along with field focus changes. Output includes a structured list of events and a human-readable text stream.
