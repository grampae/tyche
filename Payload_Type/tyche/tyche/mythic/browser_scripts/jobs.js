function(task, responses){
  if(task.status.includes("error")){
      const combined = responses.reduce( (prev, cur) => {
          return prev + cur;
      }, "");
      return {'plaintext': combined};
  }else if(task.completed){
      if(responses.length > 0){
          try{
                  let data = JSON.parse(responses[0]);

                  if (data.action === 'kill') {
                      return {'plaintext': 'Kill ' + data.task_id + ': ' + data.result};
                  }

                  let tasks = data["tasks"] || [];
                  let killable = data["killable"] || [];
                  let killableIds = {};
                  for(let k = 0; k < killable.length; k++){
                      killableIds[killable[k].task_id] = true;
                  }

                  let output_table = [];
                  for(let i = 0; i < tasks.length; i++){
                      let t = tasks[i];
                      let bgLabel = t.background ? "yes" : "no";
                      let rowStyle = t.background
                          ? {"backgroundColor": "mediumpurple"}
                          : {};
                      output_table.push({
                          "command":{"plaintext": t.command},
                          "task_id": {"plaintext": t.task_id, "copyIcon": true},
                          "start_time": {"plaintext": t.start_time},
                          "background": {"plaintext": bgLabel},
                          "rowStyle": rowStyle
                      })
                  }

                  let title = "Active: " + (data.active_tasks || 0) + " | Background (killable): " + (data.background_tasks || 0);

                  if (output_table.length === 0) {
                      return {'plaintext': 'No active tasks'};
                  }

                  return {
                      "table": [
                          {
                              "headers": [
                                  {"plaintext": "command", "type": "string", "fillWidth": true},
                                  {"plaintext": "task_id", "type": "string", "fillWidth": true},
                                  {"plaintext": "start_time", "type": "string", "fillWidth": true},
                                  {"plaintext": "background", "type": "string"},
                              ],
                              "rows": output_table,
                              "title": title
                          }
                      ]
                  }
          }catch(error){
                  console.log(error);
                  const combined = responses.reduce( (prev, cur) => {
                      return prev + cur;
                  }, "");
                  return {'plaintext': combined};
          }
      }else{
          return {"plaintext": "No output from command"};
      }
  }else{
      return {"plaintext": "No data to display..."};
  }
}
