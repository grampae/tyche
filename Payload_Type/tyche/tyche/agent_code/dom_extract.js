COMMANDS['dom_extract'] = async function(task) {
    var result = {
        url: window.location.href,
        title: document.title,
        timestamp: new Date().toISOString()
    };

    // --- Forms and inputs ---
    var forms = [];
    var formEls = document.querySelectorAll('form');
    for (var i = 0; i < formEls.length; i++) {
        var f = formEls[i];
        var fields = [];
        for (var j = 0; j < f.elements.length; j++) {
            var el = f.elements[j];
            if (el.name || el.id) {
                fields.push({
                    tag: el.tagName,
                    type: el.type || '',
                    name: el.name || el.id,
                    value: (el.type === 'password') ? '***' + el.value.length + ' chars***' : el.value
                });
            }
        }
        forms.push({action: f.action, method: f.method, fields: fields});
    }
    result.forms = forms;

    // --- Hidden inputs (often CSRF tokens) ---
    var hidden = [];
    var hiddenEls = document.querySelectorAll('input[type="hidden"]');
    for (var h = 0; h < hiddenEls.length; h++) {
        hidden.push({name: hiddenEls[h].name, value: hiddenEls[h].value});
    }
    result.hiddenInputs = hidden;

    // --- Links ---
    var links = [];
    var anchors = document.querySelectorAll('a[href]');
    for (var a = 0; a < anchors.length && a < 100; a++) {
        links.push({text: anchors[a].textContent.trim().substring(0, 80), href: anchors[a].href});
    }
    result.links = {count: anchors.length, sample: links};

    // --- Email addresses ---
    var emailPattern = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
    var bodyText = document.body.innerText || '';
    var emails = [];
    var match;
    while ((match = emailPattern.exec(bodyText)) !== null) {
        if (emails.indexOf(match[0]) === -1) emails.push(match[0]);
    }
    result.emails = emails;

    // --- Meta tags ---
    var metas = [];
    var metaEls = document.querySelectorAll('meta');
    for (var m = 0; m < metaEls.length; m++) {
        var name = metaEls[m].getAttribute('name') || metaEls[m].getAttribute('property') || metaEls[m].getAttribute('http-equiv');
        var content = metaEls[m].getAttribute('content');
        if (name && content) metas.push({name: name, content: content});
    }
    result.metaTags = metas;

    // --- Scripts (external sources) ---
    var scripts = [];
    var scriptEls = document.querySelectorAll('script[src]');
    for (var s = 0; s < scriptEls.length; s++) {
        scripts.push(scriptEls[s].src);
    }
    result.externalScripts = scripts;

    // --- Comments in DOM (sometimes leak info) ---
    var comments = [];
    var walker = document.createTreeWalker(document, NodeFilter.SHOW_COMMENT, null, false);
    while (walker.nextNode()) {
        var text = walker.currentNode.textContent.trim();
        if (text.length > 0 && text.length < 500) comments.push(text);
    }
    result.htmlComments = comments;

    // --- Iframes ---
    var iframes = [];
    var iframeEls = document.querySelectorAll('iframe');
    for (var fi = 0; fi < iframeEls.length; fi++) {
        iframes.push({src: iframeEls[fi].src, id: iframeEls[fi].id, name: iframeEls[fi].name});
    }
    result.iframes = iframes;

    return JSON.stringify(result, null, 2);
};
