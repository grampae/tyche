COMMANDS['portscan'] = async function(task) {
    var params = task.parameters;
    if (typeof params === 'string') {
        try { params = JSON.parse(params); } catch (e) { params = {}; }
    }
    var targets = (params && params.targets) ? params.targets : '127.0.0.1';
    var ports = (params && params.ports) ? params.ports : '80,443,8080,8443,3000,3389,5900,22,21,25,8000,8888,9090';
    var timeout = (params && params.timeout) ? parseInt(params.timeout) : 2000;

    // Parse targets: supports single IP, comma-separated, or CIDR /24
    function parseTargets(input) {
        var hosts = [];
        var parts = input.split(',');
        for (var i = 0; i < parts.length; i++) {
            var t = parts[i].trim();
            if (t.indexOf('/24') > -1) {
                var base = t.replace('/24', '');
                var octets = base.split('.');
                var prefix = octets[0] + '.' + octets[1] + '.' + octets[2] + '.';
                for (var j = 1; j < 255; j++) hosts.push(prefix + j);
            } else {
                hosts.push(t);
            }
        }
        return hosts;
    }

    function parsePorts(input) {
        var result = [];
        var parts = input.toString().split(',');
        for (var i = 0; i < parts.length; i++) {
            var p = parts[i].trim();
            if (p.indexOf('-') > -1) {
                var range = p.split('-');
                var start = parseInt(range[0]);
                var end = parseInt(range[1]);
                for (var j = start; j <= end && j <= 65535; j++) result.push(j);
            } else {
                var pn = parseInt(p);
                if (pn > 0 && pn <= 65535) result.push(pn);
            }
        }
        return result;
    }

    var hostList = parseTargets(targets);
    var portList = parsePorts(ports);
    var results = [];
    var openCount = 0;

    // Scan a single host:port using fetch timing
    function scanPort(host, port) {
        return new Promise(function(resolve) {
            var start = performance.now();
            var controller = new AbortController();
            var timer = setTimeout(function() {
                controller.abort();
                resolve({host: host, port: port, state: 'filtered', time: timeout});
            }, timeout);

            fetch('http://' + host + ':' + port + '/', {
                mode: 'no-cors',
                signal: controller.signal
            }).then(function() {
                clearTimeout(timer);
                var elapsed = Math.round(performance.now() - start);
                resolve({host: host, port: port, state: 'open', time: elapsed});
            }).catch(function(e) {
                clearTimeout(timer);
                var elapsed = Math.round(performance.now() - start);
                if (e.name === 'AbortError') {
                    resolve({host: host, port: port, state: 'filtered', time: timeout});
                } else if (elapsed < timeout * 0.3) {
                    // Very fast rejection usually means connection refused = port closed but host is up
                    resolve({host: host, port: port, state: 'closed', time: elapsed});
                } else {
                    // Slower error could mean open port that rejected the request
                    resolve({host: host, port: port, state: 'open', time: elapsed});
                }
            });
        });
    }

    // Scan in batches to avoid overwhelming the browser
    var batchSize = 20;
    var allScans = [];
    for (var h = 0; h < hostList.length; h++) {
        for (var p = 0; p < portList.length; p++) {
            allScans.push({host: hostList[h], port: portList[p]});
        }
    }

    for (var b = 0; b < allScans.length; b += batchSize) {
        var batch = allScans.slice(b, b + batchSize);
        var promises = [];
        for (var bi = 0; bi < batch.length; bi++) {
            promises.push(scanPort(batch[bi].host, batch[bi].port));
        }
        var batchResults = await Promise.all(promises);
        for (var br = 0; br < batchResults.length; br++) {
            if (batchResults[br].state === 'open') {
                results.push(batchResults[br]);
                openCount++;
            }
        }
    }

    var output = {
        targets: targets,
        ports: ports,
        timeout: timeout + 'ms',
        hostsScanned: hostList.length,
        portsPerHost: portList.length,
        totalProbes: allScans.length,
        openPorts: openCount,
        results: results
    };

    return JSON.stringify(output, null, 2);
};
