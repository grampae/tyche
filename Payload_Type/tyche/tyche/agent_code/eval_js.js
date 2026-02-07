COMMANDS['eval_js'] = async function(task) {
    var code = task.parameters;
    if (typeof code === 'string') {
        try {
            code = JSON.parse(code).code;
        } catch (e) {
            // parameters is the raw code string, use as-is
        }
    } else if (code && code.code) {
        code = code.code;
    }
    var result = eval(code);
    if (result !== undefined && result !== null) {
        return String(result);
    }
    return 'executed (no return value)';
};
