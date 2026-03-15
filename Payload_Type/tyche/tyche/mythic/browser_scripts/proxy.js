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

                if(data.error){
                    let rows = [
                        {"field": {"plaintext": "URL"}, "value": {"plaintext": data.url || "", "copyIcon": true}},
                        {"field": {"plaintext": "Method"}, "value": {"plaintext": data.method || ""}},
                        {"field": {"plaintext": "Error"}, "value": {"plaintext": data.error, "copyIcon": true}},
                        {"field": {"plaintext": "Elapsed"}, "value": {"plaintext": data.elapsed || ""}},
                    ];
                    if(data.hint){
                        rows.push({"field": {"plaintext": "Hint"}, "value": {"plaintext": data.hint}});
                    }
                    return {"table": [{
                        "headers": [
                            {"plaintext": "field", "type": "string"},
                            {"plaintext": "value", "type": "string", "fillWidth": true}
                        ],
                        "rows": rows,
                        "title": "Proxy Request Failed"
                    }]};
                }

                let tables = [];

                // Response summary
                let statusColor = "#2E7D32";
                if(data.status >= 400 && data.status < 500) statusColor = "#F57F17";
                if(data.status >= 500) statusColor = "#C62828";

                let summaryRows = [
                    {"field": {"plaintext": "URL"}, "value": {"plaintext": data.url || "", "copyIcon": true}, "rowStyle": {}},
                    {"field": {"plaintext": "Status"}, "value": {"plaintext": data.status + " " + (data.statusText || "")}, "rowStyle": {"backgroundColor": statusColor}},
                    {"field": {"plaintext": "Content-Type"}, "value": {"plaintext": data.contentType || ""}, "rowStyle": {}},
                    {"field": {"plaintext": "Body Size"}, "value": {"plaintext": String(data.bodySize || 0) + " bytes"}, "rowStyle": {}},
                    {"field": {"plaintext": "Elapsed"}, "value": {"plaintext": data.elapsed || ""}, "rowStyle": {}},
                    {"field": {"plaintext": "Redirected"}, "value": {"plaintext": String(data.redirected || false)}, "rowStyle": {}},
                ];
                if(data.file_id){
                    summaryRows.push({"field": {"plaintext": "File"}, "value": {"plaintext": "Response saved as file (large response)"}, "rowStyle": {}});
                }
                tables.push({
                    "headers": [
                        {"plaintext": "field", "type": "string"},
                        {"plaintext": "value", "type": "string", "fillWidth": true}
                    ],
                    "rows": summaryRows,
                    "title": "Response Summary"
                });

                // Response headers
                if(data.headers && Object.keys(data.headers).length > 0){
                    let headerRows = [];
                    for(let key of Object.keys(data.headers)){
                        headerRows.push({
                            "header": {"plaintext": key, "copyIcon": true},
                            "value": {"plaintext": data.headers[key], "copyIcon": true},
                            "rowStyle": {}
                        });
                    }
                    tables.push({
                        "headers": [
                            {"plaintext": "header", "type": "string"},
                            {"plaintext": "value", "type": "string", "fillWidth": true}
                        ],
                        "rows": headerRows,
                        "title": "Response Headers (" + Object.keys(data.headers).length + ")"
                    });
                }

                // Response body (if not saved as file)
                if(data.body && !data.file_id){
                    return {"table": tables, "plaintext": "\n--- Response Body ---\n" + data.body};
                }

                return {"table": tables};

            }catch(error){
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
