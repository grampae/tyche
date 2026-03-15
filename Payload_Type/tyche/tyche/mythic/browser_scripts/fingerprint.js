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

                // Helper: create a key-value table from an object
                function kvTable(obj, title){
                    let rows = [];
                    let keys = Object.keys(obj);
                    for(let i = 0; i < keys.length; i++){
                        let val = obj[keys[i]];
                        if(val === null || val === undefined) val = "N/A";
                        else if(typeof val === "object") val = JSON.stringify(val);
                        else val = String(val);
                        rows.push({
                            "property": {"plaintext": keys[i]},
                            "value": {"plaintext": val, "copyIcon": true},
                            "rowStyle": {}
                        });
                    }
                    if(rows.length > 0){
                        tables.push({
                            "headers": [
                                {"plaintext": "property", "type": "string", "fillWidth": true},
                                {"plaintext": "value", "type": "string", "fillWidth": true}
                            ],
                            "rows": rows,
                            "title": title
                        });
                    }
                }

                // --- Navigator ---
                if(data.navigator){
                    kvTable(data.navigator, "Navigator");
                }

                // --- Screen ---
                if(data.screen){
                    kvTable(data.screen, "Screen & Display");
                }

                // --- Window / Document ---
                if(data.window){
                    kvTable(data.window, "Window & Document");
                }

                // --- Timezone ---
                if(data.timezone){
                    kvTable(data.timezone, "Timezone & Locale");
                }

                // --- Connection ---
                if(data.connection){
                    kvTable(data.connection, "Network Connection");
                }

                // --- WebGL ---
                if(data.webgl && !data.webgl.error){
                    let webglDisplay = Object.assign({}, data.webgl);
                    // Summarize extensions instead of showing full array
                    if(webglDisplay.extensions && Array.isArray(webglDisplay.extensions)){
                        webglDisplay.extensionCount = webglDisplay.extensions.length;
                        webglDisplay.extensions = webglDisplay.extensions.join(", ");
                    }
                    kvTable(webglDisplay, "WebGL");
                }

                // --- Permissions ---
                if(data.permissions && Object.keys(data.permissions).length > 0){
                    let permRows = [];
                    let permKeys = Object.keys(data.permissions);
                    for(let i = 0; i < permKeys.length; i++){
                        let state = data.permissions[permKeys[i]];
                        let bgColor = "";
                        if(state === "granted") bgColor = "#2E4A2E";
                        else if(state === "denied") bgColor = "#4A2E2E";
                        else if(state === "prompt") bgColor = "#4A4A2E";
                        permRows.push({
                            "permission": {"plaintext": permKeys[i]},
                            "state": {"plaintext": state},
                            "rowStyle": bgColor ? {"backgroundColor": bgColor} : {}
                        });
                    }
                    tables.push({
                        "headers": [
                            {"plaintext": "permission", "type": "string", "fillWidth": true},
                            {"plaintext": "state", "type": "string"}
                        ],
                        "rows": permRows,
                        "title": "Permissions"
                    });
                }

                // --- Features ---
                if(data.features){
                    let featRows = [];
                    let featKeys = Object.keys(data.features);
                    for(let i = 0; i < featKeys.length; i++){
                        let supported = data.features[featKeys[i]];
                        featRows.push({
                            "feature": {"plaintext": featKeys[i]},
                            "supported": {"plaintext": supported ? "Yes" : "No"},
                            "rowStyle": supported ? {"backgroundColor": "#2E4A2E"} : {"backgroundColor": "#4A2E2E"}
                        });
                    }
                    tables.push({
                        "headers": [
                            {"plaintext": "feature", "type": "string", "fillWidth": true},
                            {"plaintext": "supported", "type": "string"}
                        ],
                        "rows": featRows,
                        "title": "Feature Detection"
                    });
                }

                // --- Authorized Devices ---
                if(data.devices){
                    let devTotal = data.devices.totalAuthorized || 0;
                    let devRows = [];

                    // Serial ports
                    if(data.devices.serial && data.devices.serial.length > 0){
                        for(let i = 0; i < data.devices.serial.length; i++){
                            let d = data.devices.serial[i];
                            let desc = "";
                            if(d.usbVendorId) desc += "VID:" + d.usbVendorId;
                            if(d.usbProductId) desc += " PID:" + d.usbProductId;
                            if(!desc) desc = "(unknown)";
                            devRows.push({
                                "type": {"plaintext": "Serial"},
                                "device": {"plaintext": desc, "copyIcon": true},
                                "detail": {"plaintext": "readable:" + d.readable + " writable:" + d.writable},
                                "rowStyle": {"backgroundColor": "#8B6914"}
                            });
                        }
                    }

                    // USB devices
                    if(data.devices.usb && data.devices.usb.length > 0){
                        for(let i = 0; i < data.devices.usb.length; i++){
                            let d = data.devices.usb[i];
                            let name = d.productName || ("VID:" + d.vendorId + " PID:" + d.productId);
                            let detail = "";
                            if(d.manufacturerName) detail += d.manufacturerName;
                            if(d.serialNumber) detail += " S/N:" + d.serialNumber;
                            if(d.opened) detail += " [OPEN]";
                            devRows.push({
                                "type": {"plaintext": "USB"},
                                "device": {"plaintext": name, "copyIcon": true},
                                "detail": {"plaintext": detail},
                                "rowStyle": {"backgroundColor": "#8B6914"}
                            });
                        }
                    }

                    // HID devices
                    if(data.devices.hid && data.devices.hid.length > 0){
                        for(let i = 0; i < data.devices.hid.length; i++){
                            let d = data.devices.hid[i];
                            let name = d.productName || ("VID:" + d.vendorId + " PID:" + d.productId);
                            let detail = "collections:" + d.collections;
                            if(d.opened) detail += " [OPEN]";
                            devRows.push({
                                "type": {"plaintext": "HID"},
                                "device": {"plaintext": name, "copyIcon": true},
                                "detail": {"plaintext": detail},
                                "rowStyle": {"backgroundColor": "#8B6914"}
                            });
                        }
                    }

                    // Bluetooth devices
                    if(data.devices.bluetooth && data.devices.bluetooth.length > 0){
                        for(let i = 0; i < data.devices.bluetooth.length; i++){
                            let d = data.devices.bluetooth[i];
                            let detail = "id:" + d.id;
                            if(d.gattConnected) detail += " [GATT CONNECTED]";
                            devRows.push({
                                "type": {"plaintext": "Bluetooth"},
                                "device": {"plaintext": d.name || "(unnamed)", "copyIcon": true},
                                "detail": {"plaintext": detail},
                                "rowStyle": {"backgroundColor": "#8B6914"}
                            });
                        }
                    }

                    if(devRows.length > 0){
                        tables.push({
                            "headers": [
                                {"plaintext": "type", "type": "string"},
                                {"plaintext": "device", "type": "string", "fillWidth": true},
                                {"plaintext": "detail", "type": "string", "fillWidth": true}
                            ],
                            "rows": devRows,
                            "title": "Authorized Devices (" + devTotal + " found — previously granted, no user gesture needed)"
                        });
                    }
                }

                // --- WebRTC IPs ---
                if(data.webrtcIPs && data.webrtcIPs.length > 0){
                    let ipRows = [];
                    for(let i = 0; i < data.webrtcIPs.length; i++){
                        ipRows.push({
                            "ip": {"plaintext": data.webrtcIPs[i], "copyIcon": true},
                            "rowStyle": {"backgroundColor": "#8B6914"}
                        });
                    }
                    tables.push({
                        "headers": [
                            {"plaintext": "ip", "type": "string", "fillWidth": true}
                        ],
                        "rows": ipRows,
                        "title": "WebRTC Local IPs"
                    });
                }

                // --- Media Devices ---
                if(data.mediaDevices && data.mediaDevices.length > 0){
                    let devRows = [];
                    for(let i = 0; i < data.mediaDevices.length; i++){
                        let d = data.mediaDevices[i];
                        devRows.push({
                            "kind": {"plaintext": d.kind},
                            "label": {"plaintext": d.label || "(unlabeled)"},
                            "deviceId": {"plaintext": d.deviceId || ""},
                            "rowStyle": {}
                        });
                    }
                    tables.push({
                        "headers": [
                            {"plaintext": "kind", "type": "string"},
                            {"plaintext": "label", "type": "string", "fillWidth": true},
                            {"plaintext": "deviceId", "type": "string"}
                        ],
                        "rows": devRows,
                        "title": "Media Devices"
                    });
                }

                // --- Plugins ---
                if(data.plugins && data.plugins.length > 0){
                    let plugRows = [];
                    for(let i = 0; i < data.plugins.length; i++){
                        let p = data.plugins[i];
                        plugRows.push({
                            "name": {"plaintext": p.name},
                            "filename": {"plaintext": p.filename || ""},
                            "description": {"plaintext": p.description || ""},
                            "rowStyle": {}
                        });
                    }
                    tables.push({
                        "headers": [
                            {"plaintext": "name", "type": "string", "fillWidth": true},
                            {"plaintext": "filename", "type": "string"},
                            {"plaintext": "description", "type": "string", "fillWidth": true}
                        ],
                        "rows": plugRows,
                        "title": "Plugins"
                    });
                }

                // --- Fonts ---
                if(data.fonts && data.fonts.length > 0){
                    let fontRows = [];
                    for(let i = 0; i < data.fonts.length; i++){
                        fontRows.push({
                            "font": {"plaintext": data.fonts[i]},
                            "rowStyle": {}
                        });
                    }
                    tables.push({
                        "headers": [
                            {"plaintext": "font", "type": "string", "fillWidth": true}
                        ],
                        "rows": fontRows,
                        "title": "Detected Fonts (" + data.fonts.length + ")"
                    });
                }

                // --- Math Fingerprint ---
                if(data.math && Object.keys(data.math).length > 0){
                    kvTable(data.math, "Math Fingerprint (engine-specific)");
                }

                // --- Vendor Flavors ---
                if(data.vendorFlavors && data.vendorFlavors.length > 0){
                    let vfRows = [];
                    for(let i = 0; i < data.vendorFlavors.length; i++){
                        vfRows.push({
                            "browser": {"plaintext": data.vendorFlavors[i], "copyIcon": true},
                            "rowStyle": {"backgroundColor": "#2E4A2E"}
                        });
                    }
                    tables.push({
                        "headers": [
                            {"plaintext": "browser", "type": "string", "fillWidth": true}
                        ],
                        "rows": vfRows,
                        "title": "Detected Browser Vendor Flavors"
                    });
                }

                // --- Speech Voices ---
                if(data.speechVoices && data.speechVoices.length > 0){
                    let voiceRows = [];
                    for(let i = 0; i < data.speechVoices.length; i++){
                        let v = data.speechVoices[i];
                        voiceRows.push({
                            "name": {"plaintext": v.name},
                            "lang": {"plaintext": v.lang},
                            "local": {"plaintext": v.local ? "Yes" : "No"},
                            "rowStyle": {}
                        });
                    }
                    tables.push({
                        "headers": [
                            {"plaintext": "name", "type": "string", "fillWidth": true},
                            {"plaintext": "lang", "type": "string"},
                            {"plaintext": "local", "type": "string"}
                        ],
                        "rows": voiceRows,
                        "title": "Speech Synthesis Voices (" + data.speechVoices.length + ")"
                    });
                }

                // --- GPU Adapter ---
                if(data.gpu){
                    let gpuObj = {
                        "vendor": data.gpu.vendor || "N/A",
                        "architecture": data.gpu.architecture || "N/A",
                        "device": data.gpu.device || "N/A",
                        "description": data.gpu.description || "N/A"
                    };
                    if(data.gpu.features && data.gpu.features.length > 0){
                        gpuObj["features"] = data.gpu.features.join(", ");
                    }
                    kvTable(gpuObj, "WebGPU Adapter");
                }

                // --- Media Preferences (CSS) ---
                if(data.mediaPreferences && Object.keys(data.mediaPreferences).length > 0){
                    let mpRows = [];
                    let mpKeys = Object.keys(data.mediaPreferences);
                    for(let i = 0; i < mpKeys.length; i++){
                        let val = data.mediaPreferences[mpKeys[i]];
                        mpRows.push({
                            "preference": {"plaintext": mpKeys[i]},
                            "value": {"plaintext": val ? "Yes" : "No"},
                            "rowStyle": val ? {"backgroundColor": "#2E4A2E"} : {}
                        });
                    }
                    tables.push({
                        "headers": [
                            {"plaintext": "preference", "type": "string", "fillWidth": true},
                            {"plaintext": "value", "type": "string"}
                        ],
                        "rows": mpRows,
                        "title": "Media Preferences & Display"
                    });
                }

                // --- Keyboard Layout ---
                if(data.keyboardLayout){
                    let klObj = data.keyboardLayout;
                    // Show a subset of interesting keys
                    let klDisplay = {};
                    let interestingKeys = ["KeyQ","KeyW","KeyY","KeyZ","KeyA","Semicolon","Quote","BracketLeft","BracketRight","Minus","Backslash"];
                    let klKeys = Object.keys(klObj);
                    for(let i = 0; i < klKeys.length; i++){
                        if(interestingKeys.indexOf(klKeys[i]) !== -1){
                            klDisplay[klKeys[i]] = klObj[klKeys[i]];
                        }
                    }
                    if(Object.keys(klDisplay).length > 0){
                        kvTable(klDisplay, "Keyboard Layout (locale-identifying keys)");
                    }
                }

                // --- Navigation History ---
                if(data.navigationHistory && data.navigationHistory.length > 0){
                    let navRows = [];
                    for(let i = 0; i < data.navigationHistory.length; i++){
                        let n = data.navigationHistory[i];
                        navRows.push({
                            "index": {"plaintext": String(n.index)},
                            "url": {"plaintext": n.url, "copyIcon": true},
                            "rowStyle": {}
                        });
                    }
                    tables.push({
                        "headers": [
                            {"plaintext": "index", "type": "number"},
                            {"plaintext": "url", "type": "string", "fillWidth": true}
                        ],
                        "rows": navRows,
                        "title": "Navigation History (" + data.navigationHistory.length + " entries)"
                    });
                }

                // --- Storage & Battery & Canvas/Audio & Architecture & Privacy (misc) ---
                let miscObj = {};
                if(data.architecture) miscObj["CPU architecture signature"] = data.architecture;
                if(data.privateBrowsing !== null && data.privateBrowsing !== undefined){
                    miscObj["incognito/private mode"] = data.privateBrowsing ? "LIKELY" : "No";
                }
                if(data.storageQuotaMB) miscObj["storage quota (MB)"] = data.storageQuotaMB;
                if(data.storage){
                    miscObj["localStorage available"] = data.storage.localStorage;
                    miscObj["sessionStorage available"] = data.storage.sessionStorage;
                    miscObj["indexedDB available"] = data.storage.indexedDB;
                    if(data.storage.quota) miscObj["storage quota"] = data.storage.quota;
                    if(data.storage.usage) miscObj["storage usage"] = data.storage.usage;
                }
                if(data.battery){
                    miscObj["battery charging"] = data.battery.charging;
                    miscObj["battery level"] = (data.battery.level * 100) + "%";
                }
                if(data.canvasHash) miscObj["canvas fingerprint"] = data.canvasHash;
                if(data.audioFingerprint) miscObj["audio fingerprint"] = data.audioFingerprint;
                if(data.cookies !== undefined) miscObj["cookie count"] = data.cookies;
                if(Object.keys(miscObj).length > 0){
                    kvTable(miscObj, "Storage, Battery, Architecture & Fingerprint Hashes");
                }

                if(tables.length > 0){
                    return {"table": tables};
                }else{
                    return {"plaintext": responses[0]};
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