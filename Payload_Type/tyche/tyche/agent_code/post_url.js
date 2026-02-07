COMMANDS['post_url'] = async function(task) {
    var params = task.parameters;
    if (typeof params === 'string') {
        try { params = JSON.parse(params); } catch (e) { params = {}; }
    }
    var url = (params && params.url) ? params.url : '';
    if (!url) return 'error: url parameter required';

    var headers = {};
    if (params && params.headers) {
        if (typeof params.headers === 'string') {
            try { headers = JSON.parse(params.headers); } catch (e) {}
        } else {
            headers = params.headers;
        }
    }

    var body = '';
    if (params && params.body) {
        body = (typeof params.body === 'string') ? params.body : JSON.stringify(params.body);
    }

    // Auto-set Content-Type if body looks like JSON and no Content-Type set
    if (body && body[0] === '{' && !headers['Content-Type'] && !headers['content-type']) {
        headers['Content-Type'] = 'application/json';
    }

    try {
        var opts = {method: 'POST', headers: headers, body: body || undefined};
        var resp;
        try {
            resp = await fetch(url, opts);
        } catch (e) {
            opts.mode = 'no-cors';
            resp = await fetch(url, opts);
        }

        var respBody = '';
        try {
            respBody = await resp.text();
        } catch (e) {
            respBody = '(opaque response - no-cors mode)';
        }

        var respHeaders = {};
        try {
            resp.headers.forEach(function(val, key) {
                respHeaders[key] = val;
            });
        } catch (e) {}

        return JSON.stringify({
            url: url,
            status: resp.status,
            statusText: resp.statusText,
            responseHeaders: respHeaders,
            bodyLength: respBody.length,
            body: respBody.length > 50000 ? respBody.substring(0, 50000) + '\n...(truncated)' : respBody
        }, null, 2);
    } catch (e) {
        return JSON.stringify({url: url, error: e.message}, null, 2);
    }
};
