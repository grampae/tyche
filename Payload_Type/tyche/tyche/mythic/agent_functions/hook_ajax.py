from mythic_container.MythicCommandBase import *
from mythic_container.MythicRPC import *


class HookAjaxArguments(TaskArguments):
    def __init__(self, command_line, **kwargs):
        super().__init__(command_line, **kwargs)
        self.args = [
            CommandParameter(
                name="duration",
                type=ParameterType.Number,
                parameter_group_info=[ParameterGroupInfo(
                    required=False
                )],
                default_value=60,
                description="Capture duration in seconds (default 60)",
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


class HookAjaxCommand(CommandBase):
    cmd = "hook_ajax"
    needs_admin = False
    help_cmd = "hook_ajax"
    description = "Intercept all XMLHttpRequest and fetch calls for a specified duration. Captures request method, URL, headers, body, and response previews."
    version = 1
    author = "@grampae"
    attackmapping = ["T1557"]
    argument_class = HookAjaxArguments
    attributes = CommandAttributes(
        supported_os=[SupportedOS.MacOS, SupportedOS.Linux, SupportedOS.Windows]
    )

    async def create_tasking(self, task: MythicTask) -> MythicTask:
        duration = task.args.get_arg("duration") or 60
        task.display_params = "{}s".format(duration)
        return task

    async def process_response(self, task: PTTaskMessageAllData, response: any) -> PTTaskProcessResponseMessageResponse:
        resp = PTTaskProcessResponseMessageResponse(TaskID=task.Task.ID, Success=True)
        return resp
