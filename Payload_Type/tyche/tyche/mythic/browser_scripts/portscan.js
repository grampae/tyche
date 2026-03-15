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

                // --- Scan Summary ---
                let summaryRows = [
                    {"property": {"plaintext": "Targets"}, "value": {"plaintext": data.targets || "", "copyIcon": true}, "rowStyle": {}},
                    {"property": {"plaintext": "Ports"}, "value": {"plaintext": data.ports || ""}, "rowStyle": {}},
                    {"property": {"plaintext": "Timeout"}, "value": {"plaintext": data.timeout || ""}, "rowStyle": {}},
                    {"property": {"plaintext": "Hosts Scanned"}, "value": {"plaintext": String(data.hostsScanned || 0)}, "rowStyle": {}},
                    {"property": {"plaintext": "Ports Per Host"}, "value": {"plaintext": String(data.portsPerHost || 0)}, "rowStyle": {}},
                    {"property": {"plaintext": "Total Probes"}, "value": {"plaintext": String(data.totalProbes || 0)}, "rowStyle": {}},
                    {"property": {"plaintext": "Open Ports Found"}, "value": {"plaintext": String(data.openPorts || 0)}, "rowStyle": data.openPorts > 0 ? {"backgroundColor": "#2E4A2E"} : {}}
                ];
                tables.push({
                    "headers": [
                        {"plaintext": "property", "type": "string"},
                        {"plaintext": "value", "type": "string", "fillWidth": true}
                    ],
                    "rows": summaryRows,
                    "title": "Scan Summary"
                });

                // --- Results (open ports) ---
                if(data.results && data.results.length > 0){
                    let resultRows = [];
                    // Common port names for context
                    let portNames = {
                        21: "FTP", 22: "SSH", 25: "SMTP", 53: "DNS", 80: "HTTP",
                        110: "POP3", 143: "IMAP", 443: "HTTPS", 445: "SMB",
                        993: "IMAPS", 995: "POP3S", 1433: "MSSQL", 1521: "Oracle",
                        3000: "Dev/Grafana", 3306: "MySQL", 3389: "RDP",
                        5432: "PostgreSQL", 5900: "VNC", 6379: "Redis",
                        8000: "HTTP-Alt", 8080: "HTTP-Proxy", 8443: "HTTPS-Alt",
                        8888: "HTTP-Alt", 9090: "HTTP-Alt", 9200: "Elasticsearch",
                        27017: "MongoDB"
                    };
                    for(let i = 0; i < data.results.length; i++){
                        let r = data.results[i];
                        let bgColor = "";
                        if(r.state === "open") bgColor = "#2E4A2E";
                        else if(r.state === "closed") bgColor = "#4A2E2E";
                        else if(r.state === "filtered") bgColor = "#4A4A2E";
                        let service = portNames[r.port] || "";
                        resultRows.push({
                            "host": {"plaintext": r.host, "copyIcon": true},
                            "port": {"plaintext": String(r.port), "copyIcon": true},
                            "service": {"plaintext": service},
                            "state": {"plaintext": r.state},
                            "time": {"plaintext": r.time + "ms"},
                            "rowStyle": bgColor ? {"backgroundColor": bgColor} : {}
                        });
                    }
                    tables.push({
                        "headers": [
                            {"plaintext": "host", "type": "string", "fillWidth": true},
                            {"plaintext": "port", "type": "number"},
                            {"plaintext": "service", "type": "string"},
                            {"plaintext": "state", "type": "string"},
                            {"plaintext": "time", "type": "string"}
                        ],
                        "rows": resultRows,
                        "title": "Open Ports (" + data.openPorts + ")"
                    });
                }

                if(tables.length > 0){
                    return {"table": tables};
                }else{
                    return {"plaintext": "No results from scan"};
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
        return {"plaintext": "Scan in progress..."};
    }
}