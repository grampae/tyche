COMMANDS['drive_download'] = async function(task) {
    var params = task.parameters;
    if (typeof params === 'string') {
        try { params = JSON.parse(params); } catch (e) { params = {}; }
    }
    var url = (params && params.url) ? params.url : '';
    var filename = (params && params.filename) ? params.filename : '';
    if (!url) return 'error: url parameter required';

    // Derive filename from URL if not provided
    if (!filename) {
        var parts = url.split('/');
        filename = parts[parts.length - 1].split('?')[0] || 'download';
    }

    // Try fetch + blob for reliable cross-origin download with custom filename
    try {
        var resp = await fetch(url, {mode: 'cors', credentials: 'omit'});
        if (resp.ok) {
            var blob = await resp.blob();
            var blobUrl = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = blobUrl;
            a.download = filename;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(function() { URL.revokeObjectURL(blobUrl); }, 5000);
            return 'Download triggered (blob): ' + filename;
        }
    } catch (e) {
        // CORS blocked — fall through to direct link method
    }

    // Fallback: direct anchor click (browser may open instead of download)
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return 'Download triggered (direct): ' + filename;
};
