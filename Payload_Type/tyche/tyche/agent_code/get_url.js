COMMANDS['get_url'] = async function(task) {
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

    try {
        var opts = {method: 'GET', headers: headers};
        // Try cors first, fall back to no-cors
        var resp;
        try {
            resp = await fetch(url, opts);
        } catch (e) {
            opts.mode = 'no-cors';
            resp = await fetch(url, opts);
        }

        var body = '';
        try {
            body = await resp.text();
        } catch (e) {
            body = '(opaque response - no-cors mode)';
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
            bodyLength: body.length,
            body: body.length > 50000 ? body.substring(0, 50000) + '\n...(truncated)' : body
        }, null, 2);
    } catch (e) {
        return JSON.stringify({url: url, error: e.message}, null, 2);
    }
};
