COMMANDS['fingerprint'] = async function(task) {
    var fp = {};

    // --- Navigator ---
    var nav = navigator;
    fp.navigator = {
        userAgent: nav.userAgent,
        platform: nav.platform,
        language: nav.language,
        languages: nav.languages ? Array.from(nav.languages) : [],
        cookieEnabled: nav.cookieEnabled,
        doNotTrack: nav.doNotTrack,
        hardwareConcurrency: nav.hardwareConcurrency,
        maxTouchPoints: nav.maxTouchPoints,
        deviceMemory: nav.deviceMemory || null,
        vendor: nav.vendor,
        appVersion: nav.appVersion,
        product: nav.product,
        oscpu: nav.oscpu || null,
        buildID: nav.buildID || null,
        webdriver: nav.webdriver,
        pdfViewerEnabled: nav.pdfViewerEnabled
    };

    // --- Screen ---
    var s = window.screen;
    fp.screen = {
        width: s.width,
        height: s.height,
        availWidth: s.availWidth,
        availHeight: s.availHeight,
        colorDepth: s.colorDepth,
        pixelDepth: s.pixelDepth,
        devicePixelRatio: window.devicePixelRatio,
        orientation: s.orientation ? s.orientation.type : null
    };

    // --- Window / Document ---
    fp.window = {
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        outerWidth: window.outerWidth,
        outerHeight: window.outerHeight,
        locationHref: window.location.href,
        locationOrigin: window.location.origin,
        referrer: document.referrer,
        title: document.title,
        documentMode: document.documentMode || null,
        characterSet: document.characterSet
    };

    // --- Timezone ---
    fp.timezone = {
        offset: new Date().getTimezoneOffset(),
        name: Intl.DateTimeFormat().resolvedOptions().timeZone,
        locale: Intl.DateTimeFormat().resolvedOptions().locale
    };

    // --- Connection ---
    if (nav.connection) {
        fp.connection = {
            effectiveType: nav.connection.effectiveType,
            downlink: nav.connection.downlink,
            rtt: nav.connection.rtt,
            saveData: nav.connection.saveData,
            type: nav.connection.type || null
        };
    }

    // --- Plugins ---
    fp.plugins = [];
    if (nav.plugins) {
        for (var i = 0; i < nav.plugins.length; i++) {
            fp.plugins.push({
                name: nav.plugins[i].name,
                filename: nav.plugins[i].filename,
                description: nav.plugins[i].description
            });
        }
    }

    // --- Mime Types ---
    fp.mimeTypes = [];
    if (nav.mimeTypes) {
        for (var j = 0; j < nav.mimeTypes.length; j++) {
            fp.mimeTypes.push(nav.mimeTypes[j].type);
        }
    }

    // --- WebGL ---
    try {
        var canvas = document.createElement('canvas');
        var gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (gl) {
            var dbg = gl.getExtension('WEBGL_debug_renderer_info');
            fp.webgl = {
                vendor: gl.getParameter(gl.VENDOR),
                renderer: gl.getParameter(gl.RENDERER),
                version: gl.getParameter(gl.VERSION),
                shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
                unmaskedVendor: dbg ? gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL) : null,
                unmaskedRenderer: dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : null,
                maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
                maxViewportDims: Array.from(gl.getParameter(gl.MAX_VIEWPORT_DIMS)),
                extensions: gl.getSupportedExtensions()
            };
        }
    } catch (e) {
        fp.webgl = {error: e.message};
    }

    // --- Canvas Fingerprint ---
    try {
        var cv = document.createElement('canvas');
        cv.width = 200;
        cv.height = 50;
        var ctx = cv.getContext('2d');
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillStyle = '#f60';
        ctx.fillRect(0, 0, 200, 50);
        ctx.fillStyle = '#069';
        ctx.fillText('Fingerprint!', 2, 2);
        ctx.fillStyle = 'rgba(102,204,0,0.7)';
        ctx.fillText('Canvas FP', 4, 18);
        fp.canvasHash = cv.toDataURL().length + '_' + cv.toDataURL().slice(-32);
    } catch (e) {
        fp.canvasHash = null;
    }

    // --- Audio Fingerprint ---
    try {
        if (typeof OfflineAudioContext !== 'undefined' || typeof webkitOfflineAudioContext !== 'undefined') {
            var AudioCtx = OfflineAudioContext || webkitOfflineAudioContext;
            var actx = new AudioCtx(1, 44100, 44100);
            var osc = actx.createOscillator();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(10000, actx.currentTime);
            var comp = actx.createDynamicsCompressor();
            comp.threshold.setValueAtTime(-50, actx.currentTime);
            comp.knee.setValueAtTime(40, actx.currentTime);
            comp.ratio.setValueAtTime(12, actx.currentTime);
            comp.attack.setValueAtTime(0, actx.currentTime);
            comp.release.setValueAtTime(0.25, actx.currentTime);
            osc.connect(comp);
            comp.connect(actx.destination);
            osc.start(0);
            var audioBuffer = await actx.startRendering();
            var data = audioBuffer.getChannelData(0);
            var sum = 0;
            for (var k = 4500; k < 5000; k++) sum += Math.abs(data[k]);
            fp.audioFingerprint = sum.toString();
        }
    } catch (e) {
        fp.audioFingerprint = null;
    }

    // --- Storage ---
    fp.storage = {
        localStorage: typeof localStorage !== 'undefined',
        sessionStorage: typeof sessionStorage !== 'undefined',
        indexedDB: typeof indexedDB !== 'undefined',
        openDatabase: typeof openDatabase !== 'undefined'
    };

    if (navigator.storage && navigator.storage.estimate) {
        try {
            var est = await navigator.storage.estimate();
            fp.storage.quota = est.quota;
            fp.storage.usage = est.usage;
        } catch (e) {}
    }

    // --- Battery ---
    if (navigator.getBattery) {
        try {
            var bat = await navigator.getBattery();
            fp.battery = {
                charging: bat.charging,
                level: bat.level,
                chargingTime: bat.chargingTime,
                dischargingTime: bat.dischargingTime
            };
        } catch (e) {}
    }

    // --- Media Devices ---
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        try {
            var devices = await navigator.mediaDevices.enumerateDevices();
            fp.mediaDevices = devices.map(function(d) {
                return {kind: d.kind, label: d.label, deviceId: d.deviceId ? d.deviceId.substring(0, 8) + '...' : ''};
            });
        } catch (e) {}
    }

    // --- WebRTC Local IPs ---
    fp.webrtcIPs = [];
    try {
        var pc = new RTCPeerConnection({iceServers: []});
        pc.createDataChannel('');
        var offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await new Promise(function(resolve) {
            var timeout = setTimeout(resolve, 3000);
            pc.onicecandidate = function(e) {
                if (!e.candidate) {
                    clearTimeout(timeout);
                    resolve();
                    return;
                }
                var parts = e.candidate.candidate.split(' ');
                var ip = parts[4];
                if (ip && fp.webrtcIPs.indexOf(ip) === -1) {
                    fp.webrtcIPs.push(ip);
                }
            };
        });
        pc.close();
    } catch (e) {}

    // --- Permissions ---
    fp.permissions = {};
    if (navigator.permissions) {
        var permNames = ['geolocation', 'notifications', 'camera', 'microphone', 'accelerometer', 'gyroscope', 'magnetometer', 'clipboard-read', 'clipboard-write'];
        for (var p = 0; p < permNames.length; p++) {
            try {
                var result = await navigator.permissions.query({name: permNames[p]});
                fp.permissions[permNames[p]] = result.state;
            } catch (e) {}
        }
    }

    // --- Font Detection ---
    fp.fonts = [];
    var testFonts = [
        'Arial', 'Verdana', 'Times New Roman', 'Courier New', 'Georgia',
        'Comic Sans MS', 'Impact', 'Trebuchet MS', 'Lucida Console',
        'Tahoma', 'Palatino Linotype', 'Segoe UI', 'Roboto', 'Helvetica',
        'Calibri', 'Cambria', 'Consolas', 'Menlo', 'Monaco',
        'SF Pro', 'Ubuntu', 'Cantarell', 'Noto Sans'
    ];
    try {
        var span = document.createElement('span');
        span.style.position = 'absolute';
        span.style.left = '-9999px';
        span.style.fontSize = '72px';
        span.textContent = 'mmmmmmmmmmlli';
        document.body.appendChild(span);
        span.style.fontFamily = 'monospace';
        var defaultW = span.offsetWidth;
        var defaultH = span.offsetHeight;
        for (var f = 0; f < testFonts.length; f++) {
            span.style.fontFamily = '"' + testFonts[f] + '", monospace';
            if (span.offsetWidth !== defaultW || span.offsetHeight !== defaultH) {
                fp.fonts.push(testFonts[f]);
            }
        }
        document.body.removeChild(span);
    } catch (e) {}

    // --- Features Detection ---
    fp.features = {
        serviceWorker: 'serviceWorker' in navigator,
        webSocket: 'WebSocket' in window,
        webWorker: 'Worker' in window,
        sharedWorker: 'SharedWorker' in window,
        webAssembly: typeof WebAssembly !== 'undefined',
        webGL2: (function() { try { return !!document.createElement('canvas').getContext('webgl2'); } catch(e) { return false; } })(),
        bluetooth: 'bluetooth' in navigator,
        usb: 'usb' in navigator,
        serial: 'serial' in navigator,
        hid: 'hid' in navigator,
        credentials: 'credentials' in navigator,
        speechSynthesis: 'speechSynthesis' in window,
        speechRecognition: 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window,
        mediaRecorder: typeof MediaRecorder !== 'undefined',
        rtcPeerConnection: typeof RTCPeerConnection !== 'undefined',
        intersectionObserver: typeof IntersectionObserver !== 'undefined',
        resizeObserver: typeof ResizeObserver !== 'undefined',
        performance: typeof performance !== 'undefined',
        crypto: typeof crypto !== 'undefined' && typeof crypto.subtle !== 'undefined'
    };

    // --- Cookies (existing) ---
    fp.cookies = document.cookie ? document.cookie.split(';').length : 0;

    return JSON.stringify(fp, null, 2);
};
