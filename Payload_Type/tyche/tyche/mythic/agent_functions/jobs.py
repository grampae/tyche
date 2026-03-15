from mythic_container.MythicCommandBase import *
from mythic_container.MythicRPC import *


class JobsArguments(TaskArguments):
    def __init__(self, command_line, **kwargs):
        super().__init__(command_line, **kwargs)
        self.args = [
            CommandParameter(
                name="action",
                type=ParameterType.ChooseOne,
                choices=["list", "kill"],
                parameter_group_info=[ParameterGroupInfo(
                    required=False
                )],
                default_value="list",
                description="Action to perform: list running jobs or kill a specific one",
            ),
            CommandParameter(
                name="task_id",
                type=ParameterType.String,
                parameter_group_info=[ParameterGroupInfo(
                    required=False
                )],
                default_value="",
                description="Task ID to kill (required for kill action)",
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


class JobsCommand(CommandBase):
    cmd = "jobs"
    needs_admin = False
    help_cmd = "jobs"
    description = "List or kill running background tasks (keylogger, form_grabber, hook_ajax, etc.)"
    version = 1
    author = "@grampae"
    attackmapping = []
    argument_class = JobsArguments
    browser_script = BrowserScript(script_name="jobs", author="@grampae", for_new_ui=True)
    attributes = CommandAttributes(
        supported_os=[SupportedOS("Browser")]
    )

    async def create_tasking(self, task: MythicTask) -> MythicTask:
        action = task.args.get_arg("action") or "list"
        task_id = task.args.get_arg("task_id") or ""
        if action == "kill" and task_id:
            task.display_params = "kill {}".format(task_id)
        else:
            task.display_params = "list"
        return task

    async def process_response(self, task: PTTaskMessageAllData, response: any) -> PTTaskProcessResponseMessageResponse:
        resp = PTTaskProcessResponseMessageResponse(TaskID=task.Task.ID, Success=True)
        return resp
