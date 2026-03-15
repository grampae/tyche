from mythic_container.MythicCommandBase import *
from mythic_container.MythicRPC import *


class ScreenshotArguments(TaskArguments):
    def __init__(self, command_line, **kwargs):
        super().__init__(command_line, **kwargs)
        self.args = []

    async def parse_arguments(self):
        pass

    async def parse_dictionary(self, dictionary_arguments):
        self.load_args_from_dictionary(dictionary_arguments)


class ScreenshotCommand(CommandBase):
    cmd = "screenshot"
    needs_admin = False
    help_cmd = "screenshot"
    description = "Capture page screenshot via html2canvas"
    version = 2
    author = "@grampae"
    parameters = []
    attackmapping = ["T1113"]
    argument_class = ScreenshotArguments
    browser_script = BrowserScript(script_name="screenshot", author="@its_a_feature_", for_new_ui=True)
    attributes = CommandAttributes(
        supported_os=[SupportedOS("Browser")]
    )

    async def create_tasking(self, task: MythicTask) -> MythicTask:
        return task

    async def process_response(self, task: PTTaskMessageAllData, response: any) -> PTTaskProcessResponseMessageResponse:
        resp = PTTaskProcessResponseMessageResponse(TaskID=task.Task.ID, Success=True)

        try:
            await SendMythicRPCArtifactCreate(MythicRPCArtifactCreateMessage(
                TaskID=task.Task.ID,
                ArtifactMessage="Screenshot captured via html2canvas",
                BaseArtifactType="DOM Modification"
            ))
        except Exception:
            pass

        return resp
