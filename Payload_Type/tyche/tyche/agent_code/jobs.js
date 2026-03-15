COMMANDS['jobs'] = async function(task) {
    var params = parseParams(task);
    var action = (params && params.action) ? params.action : 'list';
    var taskId = (params && params.task_id) ? params.task_id : '';

    if (action === 'kill' || action === 'stop') {
        if (!taskId) return JSON.stringify({error: 'task_id parameter required for kill action'}, null, 2);
        var killed = cancelBackgroundTask(taskId);
        if (killed) {
            return JSON.stringify({
                action: 'kill',
                task_id: taskId,
                result: 'Task cancelled successfully'
            }, null, 2);
        } else {
            return JSON.stringify({
                action: 'kill',
                task_id: taskId,
                result: 'Task not found or already completed'
            }, null, 2);
        }
    }

    // Default: list
    var bgJobs = getBackgroundTasks();
    var allActive = getActiveTasks();
    return JSON.stringify({
        action: 'list',
        active_tasks: allActive.length,
        background_tasks: bgJobs.length,
        tasks: allActive,
        killable: bgJobs
    }, null, 2);
};
