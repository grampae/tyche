+++
title = "phish"
chapter = false
weight = 100
hidden = false
+++

## Summary

Inject a fake session-expired login modal and capture submitted credentials.
- Needs Admin: False  
- Version: 2
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

#### trigger

- Description: When to show the modal: immediately or when user switches tabs and returns (tab nabbing)
- Required Value: False
- Default Value: "immediate"
- Choices: immediate, tab_switch

## Usage

```
phish
```

```
phish {"title":"Session Expired","subtitle":"Please sign in again.","trigger":"tab_switch"}
```

## MITRE ATT&CK Mapping

- T1056.002

## Detailed Summary

Creates a full-screen overlay with a modal login form and waits for the user to submit credentials. Captured username and password values are automatically stored as credentials in Mythic.

**Trigger modes:**
- `immediate` — Shows the phishing modal right away.
- `tab_switch` — Waits until the user switches away from the tab and returns (tab nabbing). The modal appears when the user comes back, making it more convincing as a session timeout.

The modal uses randomized DOM attributes instead of static IDs to avoid detection by DOM scanning.
