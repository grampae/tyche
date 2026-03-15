from mythic_container.MythicCommandBase import *
from mythic_container.MythicRPC import *


class FingerprintArguments(TaskArguments):
    def __init__(self, command_line, **kwargs):
        super().__init__(command_line, **kwargs)
        self.args = []

    async def parse_arguments(self):
        pass

    async def parse_dictionary(self, dictionary_arguments):
        self.load_args_from_dictionary(dictionary_arguments)


class FingerprintCommand(CommandBase):
    cmd = "fingerprint"
    needs_admin = False
    help_cmd = "fingerprint"
    description = "Collect comprehensive browser fingerprint: navigator, screen, WebGL, canvas, audio, WebRTC IPs, fonts, permissions, media devices, battery, and feature detection."
    version = 2
    author = "@grampae"
    attackmapping = ["T1082", "T1016"]
    argument_class = FingerprintArguments
    browser_script = BrowserScript(script_name="fingerprint", author="@grampae", for_new_ui=True)
    attributes = CommandAttributes(
        supported_os=[SupportedOS("Browser")]
    )

    async def create_tasking(self, task: MythicTask) -> MythicTask:
        return task

    async def process_response(self, task: PTTaskMessageAllData, response: any) -> PTTaskProcessResponseMessageResponse:
        resp = PTTaskProcessResponseMessageResponse(TaskID=task.Task.ID, Success=True)
        return resp
