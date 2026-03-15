+++
title = "jobs"
chapter = false
weight = 100
hidden = false
+++

## Summary

List or kill running background tasks.
- Needs Admin: False
- Version: 1
- Author: @grampae

### Arguments

#### action

- Description: Action to perform (list or kill)
- Required Value: False
- Default Value: "list"

#### task_id

- Description: Task ID to kill (required for kill action)
- Required Value: False
- Default Value: ""

## Usage

```
jobs
```

```
jobs {"action":"kill","task_id":"abc123"}
```

## Detailed Summary

Lists all currently active tasks — both short-lived commands still executing and long-running background tasks (keylogger, form_grabber, hook_ajax). Background tasks are flagged as `killable` and can be cancelled by task ID. When a background task is killed, it immediately stops capturing and returns whatever data was collected up to that point. Non-background tasks (e.g. a stalled fingerprint) are visible in the listing but cannot be killed via this command.
