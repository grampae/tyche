+++
title = "media_record"
chapter = false
weight = 100
hidden = false
+++

## Summary

Record audio and/or video from the victim browser for a specified duration.
- Needs Admin: False  
- Version: 1  
- Author: @grampae  

### Arguments

#### duration

- Description: Recording duration in seconds
- Required Value: False  
- Default Value: 10  

#### type

- Description: Recording type: `audio`, `video`, or any other value for both
- Required Value: False  
- Default Value: "audio"  

## Usage

```
media_record
```

```
media_record {"duration":15,"type":"video"}
```

## MITRE ATT&CK Mapping

- T1123  
- T1125  

## Detailed Summary

Uses `getUserMedia` and `MediaRecorder` to capture audio and/or video, then uploads a WebM file to Mythic. This command typically prompts the user for microphone and/or camera access.
