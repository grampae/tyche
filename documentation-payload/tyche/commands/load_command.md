+++
title = "load_command"
chapter = false
weight = 100
hidden = false
+++

## Summary

Dynamically load a new command into the running agent at runtime.
- Needs Admin: False
- Version: 1
- Author: @grampae

### Arguments

#### code

- Description: JavaScript code that registers a new command via `COMMANDS['name'] = async function(task) { ... }`
- Required Value: True

## Usage

```
load_command {"code":"COMMANDS['hello'] = async function(task) { return 'Hello from dynamic command!'; };"}
```

## MITRE ATT&CK Mapping

- T1059.007

## Detailed Summary

Loads and registers a new command into the running agent without rebuilding or redeploying. The provided JavaScript code is evaluated using `new Function()` and has access to these agent utilities:

- `parseParams(task)` — Parse task parameters from JSON
- `downloadFile(fileId)` — Download a file from Mythic
- `registerBackgroundTask(taskId, name, cancelFn)` — Register a long-running task
- `unregisterBackgroundTask(taskId)` — Unregister a background task
- `checkCSP(directive)` — Check Content Security Policy for a directive
- `log(msg)` — Debug logging (when debug mode is enabled)

The code must register itself by assigning to `COMMANDS['command_name']`. Once loaded, the new command can be tasked normally.
