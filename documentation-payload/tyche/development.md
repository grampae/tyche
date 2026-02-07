+++
title = "Development"
chapter = false
weight = 20
pre = "<b>3. </b>"
+++

## Development Environment

Tyche commands are plain JavaScript and run in a browser context. For local testing, use the browser devtools console or a controlled test page where you can safely inject the code.

## Adding Commands

Command implementations live in `Payload_Type/tyche/tyche/agent_code` as `.js` files. Each file registers a command in the global `COMMANDS` map, for example:

```JavaScript
COMMANDS['example'] = async function(task) {
    return 'hello from tyche';
};
```

Mythic command definitions live in `Payload_Type/tyche/tyche/mythic/agent_functions`. These files define the command metadata, parameters, and argument parsing.

## Modifying Base Agent Behavior

The base agent code is in `Payload_Type/tyche/tyche/agent_code/base_agent/base_agent.js`. This file contains the tasking loop, MQTT WebSocket wiring, and shared helper functions (such as file upload/download helpers).

## Build Parameters

Build options are defined in `Payload_Type/tyche/tyche/mythic/agent_functions/builder.py`. The builder supports output format selection, optional obfuscation, debug logging, and whether to embed the MQTT library.

## C2 Profiles

Tyche uses the Mythic `mqtt` profile and communicates over MQTT WebSockets. Profile-specific parameters are configured in Mythic and injected at build time.
