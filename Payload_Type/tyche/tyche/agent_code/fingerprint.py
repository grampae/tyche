from mythic_container.MythicCommandBase import *
from mythic_container.MythicRPC import *


class FingerprintArguments(TaskArguments):
    def __init__(self, command_line, **kwargs):
        super().__init__(command_line, **kwargs)
        self.args = []

    async def parse_arguments(self):
        pass


class FingerprintCommand(CommandBase):
    cmd = "fingerprint"
    needs_admin = False
    help_cmd = "fingerprint"
    description = "Collect comprehensive browser fingerprint: navigator, screen, WebGL, canvas, audio, WebRTC IPs, fonts, permissions, media devices, battery, and feature detection."
    version = 1
    author = "@grampae"
    attackmapping = ["T1082", "T1016"]
    argument_class = FingerprintArguments
    attributes = CommandAttributes(
        supported_os=[SupportedOS.Browser]
    )

    async def create_tasking(self, task: MythicTask) -> MythicTask:
        return task

    async def process_response(self, task: PTTaskMessageAllData, response: any) -> PTTaskProcessResponseMessageResponse:
        resp = PTTaskProcessResponseMessageResponse(TaskID=task.Task.ID, Success=True)
        return resp
