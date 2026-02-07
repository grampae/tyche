COMMANDS['exit'] = async function(task) {
    shutdown();
    return 'Agent shutting down';
};
