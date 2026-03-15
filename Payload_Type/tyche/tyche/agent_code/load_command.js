COMMANDS['load_command'] = async function(task) {
    var params = parseParams(task);
    var code = (params && params.code) ? params.code : '';
    if (!code) return 'error: code parameter required';

    var result = loadDynamicCommand(code);
    if (result === true) {
        // Extract command name from the code for feedback
        var match = code.match(/COMMANDS\s*\[\s*['"]([^'"]+)['"]\s*\]/);
        var name = match ? match[1] : 'unknown';
        return 'Command "' + name + '" loaded successfully';
    } else {
        return 'error: failed to load command — ' + result;
    }
};
