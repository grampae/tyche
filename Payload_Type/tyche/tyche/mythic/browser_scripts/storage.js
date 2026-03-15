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

                // --- Interesting Tokens (show first for visibility) ---
                if(data.interestingTokens && data.interestingTokens.items && data.interestingTokens.items.length > 0){
                    let tokenRows = [];
                    for(let i = 0; i < data.interestingTokens.items.length; i++){
                        let t = data.interestingTokens.items[i];
                        let preview = t.preview || "";
                        // Attempt to decode JWT header for additional context
                        let extra = "";
                        if(t.type === "JWT" && preview.startsWith("eyJ")){
                            try{
                                let headerB64 = preview.split(".")[0];
                                headerB64 = headerB64.replace(/-/g, "+").replace(/_/g, "/");
                                let decoded = JSON.parse(atob(headerB64));
                                extra = " [alg=" + (decoded.alg || "?") + ", typ=" + (decoded.typ || "?") + "]";
                            }catch(e){}
                        }
                        tokenRows.push({
                            "type": {"plaintext": t.type + extra, "copyIcon": true},
                            "source": {"plaintext": t.source},
                            "key": {"plaintext": t.key, "copyIcon": true},
                            "preview": {"plaintext": preview, "copyIcon": true},
                            "rowStyle": {"backgroundColor": "#8B6914"}
                        });
                    }
                    tables.push({
                        "headers": [
                            {"plaintext": "type", "type": "string", "fillWidth": true},
                            {"plaintext": "source", "type": "string"},
                            {"plaintext": "key", "type": "string", "fillWidth": true},
                            {"plaintext": "preview", "type": "string", "fillWidth": true}
                        ],
                        "rows": tokenRows,
                        "title": "Interesting Tokens (" + data.interestingTokens.count + " found) - " + data.domain
                    });
                }

                // --- Cookies ---
                if(data.cookies && data.cookies.items && data.cookies.items.length > 0){
                    let cookieRows = [];
                    for(let i = 0; i < data.cookies.items.length; i++){
                        let c = data.cookies.items[i];
                        cookieRows.push({
                            "name": {"plaintext": c.name, "copyIcon": true},
                            "value": {"plaintext": c.value, "copyIcon": true},
                            "rowStyle": {}
                        });
                    }
                    tables.push({
                        "headers": [
                            {"plaintext": "name", "type": "string", "fillWidth": true},
                            {"plaintext": "value", "type": "string", "fillWidth": true}
                        ],
                        "rows": cookieRows,
                        "title": "Cookies (" + data.cookies.count + ")"
                    });
                }

                // --- localStorage ---
                if(data.localStorage && data.localStorage.items && data.localStorage.items.length > 0){
                    let lsRows = [];
                    for(let i = 0; i < data.localStorage.items.length; i++){
                        let item = data.localStorage.items[i];
                        if(item.error){
                            lsRows.push({
                                "key": {"plaintext": "ERROR"},
                                "value": {"plaintext": item.error},
                                "length": {"plaintext": ""},
                                "rowStyle": {"backgroundColor": "#8B0000"}
                            });
                        }else{
                            let val = item.value || "";
                            let displayVal = val.length > 200 ? val.substring(0, 200) + "..." : val;
                            lsRows.push({
                                "key": {"plaintext": item.key, "copyIcon": true},
                                "value": {"plaintext": displayVal, "copyIcon": true},
                                "length": {"plaintext": String(item.length)},
                                "rowStyle": {}
                            });
                        }
                    }
                    tables.push({
                        "headers": [
                            {"plaintext": "key", "type": "string", "fillWidth": true},
                            {"plaintext": "value", "type": "string", "fillWidth": true},
                            {"plaintext": "length", "type": "number"}
                        ],
                        "rows": lsRows,
                        "title": "localStorage (" + data.localStorage.count + ")"
                    });
                }

                // --- sessionStorage ---
                if(data.sessionStorage && data.sessionStorage.items && data.sessionStorage.items.length > 0){
                    let ssRows = [];
                    for(let i = 0; i < data.sessionStorage.items.length; i++){
                        let item = data.sessionStorage.items[i];
                        if(item.error){
                            ssRows.push({
                                "key": {"plaintext": "ERROR"},
                                "value": {"plaintext": item.error},
                                "length": {"plaintext": ""},
                                "rowStyle": {"backgroundColor": "#8B0000"}
                            });
                        }else{
                            let val = item.value || "";
                            let displayVal = val.length > 200 ? val.substring(0, 200) + "..." : val;
                            ssRows.push({
                                "key": {"plaintext": item.key, "copyIcon": true},
                                "value": {"plaintext": displayVal, "copyIcon": true},
                                "length": {"plaintext": String(item.length)},
                                "rowStyle": {}
                            });
                        }
                    }
                    tables.push({
                        "headers": [
                            {"plaintext": "key", "type": "string", "fillWidth": true},
                            {"plaintext": "value", "type": "string", "fillWidth": true},
                            {"plaintext": "length", "type": "number"}
                        ],
                        "rows": ssRows,
                        "title": "sessionStorage (" + data.sessionStorage.count + ")"
                    });
                }

                // --- IndexedDB ---
                if(data.indexedDB && data.indexedDB.databases && data.indexedDB.databases.length > 0){
                    let idbRows = [];
                    for(let i = 0; i < data.indexedDB.databases.length; i++){
                        let db = data.indexedDB.databases[i];
                        idbRows.push({
                            "name": {"plaintext": db.name, "copyIcon": true},
                            "version": {"plaintext": String(db.version)},
                            "rowStyle": {}
                        });
                    }
                    tables.push({
                        "headers": [
                            {"plaintext": "name", "type": "string", "fillWidth": true},
                            {"plaintext": "version", "type": "number"}
                        ],
                        "rows": idbRows,
                        "title": "IndexedDB (" + data.indexedDB.count + ")"
                    });
                }

                // --- Cache Storage ---
                if(data.cacheStorage && data.cacheStorage.caches && data.cacheStorage.caches.length > 0){
                    let cacheRows = [];
                    for(let i = 0; i < data.cacheStorage.caches.length; i++){
                        let c = data.cacheStorage.caches[i];
                        let urlPreview = c.urls && c.urls.length > 0 ? c.urls.slice(0, 5).join(", ") : "";
                        if(c.entries > 5) urlPreview += " (+" + (c.entries - 5) + " more)";
                        cacheRows.push({
                            "name": {"plaintext": c.name, "copyIcon": true},
                            "entries": {"plaintext": String(c.entries)},
                            "urls": {"plaintext": urlPreview},
                            "rowStyle": {}
                        });
                    }
                    tables.push({
                        "headers": [
                            {"plaintext": "name", "type": "string", "fillWidth": true},
                            {"plaintext": "entries", "type": "number"},
                            {"plaintext": "urls", "type": "string", "fillWidth": true}
                        ],
                        "rows": cacheRows,
                        "title": "Cache Storage (" + data.cacheStorage.count + ")"
                    });
                }

                // --- OPFS ---
                if(data.opfs && data.opfs.entries && data.opfs.entries.length > 0){
                    let opfsRows = [];
                    for(let i = 0; i < data.opfs.entries.length; i++){
                        let o = data.opfs.entries[i];
                        opfsRows.push({
                            "name": {"plaintext": o.name, "copyIcon": true},
                            "kind": {"plaintext": o.kind},
                            "size": {"plaintext": o.size !== undefined ? String(o.size) : ""},
                            "modified": {"plaintext": o.lastModified || ""},
                            "rowStyle": {}
                        });
                    }
                    tables.push({
                        "headers": [
                            {"plaintext": "name", "type": "string", "fillWidth": true},
                            {"plaintext": "kind", "type": "string"},
                            {"plaintext": "size", "type": "number"},
                            {"plaintext": "modified", "type": "string"}
                        ],
                        "rows": opfsRows,
                        "title": "Origin Private File System (" + data.opfs.count + " entries)"
                    });
                }

                // --- Saved Credentials ---
                if(data.savedCredentials && data.savedCredentials.items && data.savedCredentials.items.length > 0){
                    let credRows = [];
                    for(let i = 0; i < data.savedCredentials.items.length; i++){
                        let c = data.savedCredentials.items[i];
                        credRows.push({
                            "type": {"plaintext": c.type},
                            "id": {"plaintext": c.id, "copyIcon": true},
                            "name": {"plaintext": c.name || ""},
                            "rowStyle": {"backgroundColor": "#8B6914"}
                        });
                    }
                    tables.push({
                        "headers": [
                            {"plaintext": "type", "type": "string"},
                            {"plaintext": "id", "type": "string", "fillWidth": true},
                            {"plaintext": "name", "type": "string", "fillWidth": true}
                        ],
                        "rows": credRows,
                        "title": "Saved Credentials (browser-stored, " + data.savedCredentials.count + " found)"
                    });
                }

                if(tables.length > 0){
                    return {"table": tables};
                }else{
                    return {"plaintext": "No storage data found on " + (data.domain || "unknown") + " (" + (data.origin || "") + ")"};
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