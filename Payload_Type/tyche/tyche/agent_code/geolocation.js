COMMANDS['geolocation'] = async function(task) {
    if (!navigator.geolocation) {
        return JSON.stringify({error: 'Geolocation API not available'}, null, 2);
    }

    try {
        var pos = await new Promise(function(resolve, reject) {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 0
            });
        });

        return JSON.stringify({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy + 'm',
            altitude: pos.coords.altitude,
            altitudeAccuracy: pos.coords.altitudeAccuracy,
            heading: pos.coords.heading,
            speed: pos.coords.speed,
            timestamp: new Date(pos.timestamp).toISOString(),
            mapsUrl: 'https://www.google.com/maps?q=' + pos.coords.latitude + ',' + pos.coords.longitude
        }, null, 2);
    } catch (e) {
        var reason = 'Unknown error';
        if (e.code === 1) reason = 'Permission denied by user';
        if (e.code === 2) reason = 'Position unavailable';
        if (e.code === 3) reason = 'Timeout';
        return JSON.stringify({error: reason, code: e.code, message: e.message}, null, 2);
    }
};
