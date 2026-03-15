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
                let tables = [];

                // --- Capture Summary ---
                let summaryRows = [
                    {"property": {"plaintext": "Duration"}, "value": {"plaintext": data.duration || ""}, "rowStyle": {}},
                    {"property": {"plaintext": "Cancelled"}, "value": {"plaintext": data.cancelled ? "Yes" : "No"}, "rowStyle": data.cancelled ? {"backgroundColor": "#4A4A2E"} : {}},
                    {"property": {"plaintext": "Hooks Active"}, "value": {"plaintext": data.hooked ? data.hooked.join(", ") : "XHR, fetch"}, "rowStyle": {}},
                    {"property": {"plaintext": "Total Intercepted"}, "value": {"plaintext": String(data.intercepted || 0)}, "rowStyle": data.intercepted > 0 ? {"backgroundColor": "#2E4A2E"} : {}}
                ];
                // Add per-type breakdown
                if(data.breakdown){
                    let bKeys = Object.keys(data.breakdown);
                    for(let b = 0; b < bKeys.length; b++){
                        summaryRows.push({
                            "property": {"plaintext": "  " + bKeys[b]},
                            "value": {"plaintext": String(data.breakdown[bKeys[b]])},
                            "rowStyle": {}
                        });
                    }
                }
                tables.push({
                    "headers": [
                        {"plaintext": "property", "type": "string"},
                        {"plaintext": "value", "type": "string", "fillWidth": true}
                    ],
                    "rows": summaryRows,
                    "title": "Capture Summary"
                });

                // --- Intercepted Requests ---
                if(data.requests && data.requests.length > 0){
                    let reqRows = [];
                    for(let i = 0; i < data.requests.length; i++){
                        let r = data.requests[i];
                        // Color-code by type and status
                        let bgColor = "";
                        let status = String(r.status || "");
                        let statusNum = parseInt(status);
                        if(!isNaN(statusNum)){
                            if(statusNum >= 200 && statusNum < 300) bgColor = "#2E4A2E";
                            else if(statusNum >= 400 && statusNum < 500) bgColor = "#4A4A2E";
                            else if(statusNum >= 500) bgColor = "#4A2E2E";
                        }else if(status.includes("error")){
                            bgColor = "#4A2E2E";
                        }else if(r.type === "WebSocket"){
                            bgColor = status === "inbound" ? "#2E3A4A" : "#3A2E4A";
                        }else if(r.type === "postMessage"){
                            bgColor = status === "inbound" ? "#2E4A3A" : "#4A3A2E";
                        }

                        let method = r.method || "";

                        // Truncate URL for display
                        let url = r.url || "";
                        let displayUrl = url.length > 120 ? url.substring(0, 120) + "..." : url;

                        // Format timestamp to just time portion
                        let ts = r.ts || "";
                        if(ts.indexOf("T") > -1){
                            ts = ts.split("T")[1].replace("Z", "");
                        }

                        reqRows.push({
                            "time": {"plaintext": ts},
                            "type": {"plaintext": r.type || ""},
                            "method": {"plaintext": method},
                            "url": {"plaintext": displayUrl, "copyIcon": true},
                            "status": {"plaintext": status},
                            "size": {"plaintext": r.responseLength ? String(r.responseLength) : ""},
                            "rowStyle": bgColor ? {"backgroundColor": bgColor} : {}
                        });
                    }
                    tables.push({
                        "headers": [
                            {"plaintext": "time", "type": "string"},
                            {"plaintext": "type", "type": "string"},
                            {"plaintext": "method", "type": "string"},
                            {"plaintext": "url", "type": "string", "fillWidth": true},
                            {"plaintext": "status", "type": "string"},
                            {"plaintext": "size", "type": "number"}
                        ],
                        "rows": reqRows,
                        "title": "Intercepted Traffic (" + data.intercepted + ")"
                    });

                    // --- Requests/messages with body content ---
                    let bodyRows = [];
                    for(let i = 0; i < data.requests.length; i++){
                        let r = data.requests[i];
                        if(r.requestBody || (r.responsePreview && r.responsePreview.length > 0)){
                            let label = (r.type || "") + " " + (r.method || "") + " " + (r.url || "").substring(0, 80);
                            bodyRows.push({
                                "source": {"plaintext": label},
                                "request_body": {"plaintext": r.requestBody || "(none)", "copyIcon": true},
                                "response_preview": {"plaintext": r.responsePreview || "(none)", "copyIcon": true},
                                "rowStyle": {}
                            });
                        }
                    }
                    if(bodyRows.length > 0){
                        tables.push({
                            "headers": [
                                {"plaintext": "source", "type": "string"},
                                {"plaintext": "request_body", "type": "string", "fillWidth": true},
                                {"plaintext": "response_preview", "type": "string", "fillWidth": true}
                            ],
                            "rows": bodyRows,
                            "title": "Message Bodies"
                        });
                    }
                }

                if(tables.length > 0){
                    return {"table": tables};
                }else{
                    return {"plaintext": "No traffic intercepted during " + (data.duration || "unknown") + " capture window"};
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
        return {"plaintext": "Capturing traffic..."};
    }
}