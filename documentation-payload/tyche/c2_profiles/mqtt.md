+++
title = "mqtt"
chapter = false
weight = 100
hidden = false
+++

## Summary

Tyche uses the Mythic `mqtt` profile and communicates over MQTT WebSockets. All profile configuration (broker host, TLS, topics, and authentication) is defined in the Mythic C2 profile and injected at build time.

## Usage

Select the `mqtt` profile when generating a Tyche payload and configure the profile settings in Mythic as needed for your environment.
