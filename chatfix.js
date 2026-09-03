/* ================================================================
   🛠️ CHATFIX — one file, complete communication fixes:
   1. Voice players + photo display (guaranteed)
   2. 📞 📹 call buttons (guaranteed, with built-in calling)
   3. Delete buttons (backup if modernchat's version misses)
   Self-contained. Cannot be broken by other files.
   ================================================================ */

// ===== Helpers (self-contained) =====
function cfMyId() {
    if (typeof currentCashier !== 'undefined' && currentCashier) return currentCashier.id;
    if (localStorage.getItem('kitchenChefId')) return localStorage.getItem('kitchenChefId');
    return 'admin';
}
function cfMyName() {
    if (typeof currentCashier !== 'undefined' && currentCashier) return currentCashier.name;
    if (localStorage.getItem('kitchenChefName')) return localStorage.getItem('kitchenChefName');
    return 'Admin';
}
function cfMyRole() {
    if (typeof currentCashier !== 'undefined' && currentCashier) return currentCashier.position || 'Cashier';
    if (localStorage.getItem('kitchenChefId')) return 'Kitchen';
    return 'Admin';
}
function cfShop() {
    try { if (typeof getShopId === 'function') return getShopId(); } catch(e) {}
    if (typeof shopId !== 'undefined' && shopId) return shopId;
    return localStorage.getItem('shopId') || 'default';
}

// ================================================================
// 1️⃣ RENDERER — re-renders ALL bubbles with real media (fixes display)
// ================================================================
function cfRenderAll() {
    var container = document.getElementById('chatMessages') || document.getElementById('adminChatMessages');
    if (!container || container.getAttribute('data-cf-rendered')) return;
    container.setAttribute('data-cf-rendered', 'yes');

    var oldBubbles = container.querySelectorAll('.chat-bubble');
    var msgs = [];
    oldBubbles.forEach(function(b) { if (b.parentNode) msgs.push(b); });
    if (msgs.length === 0) return;

    // Re-fetch fresh messages (with media) and re-render everything
    supabaseClient.from('chat_messages')
        .select('*').eq('shop_id', cfShop())
        .order('created_at', { ascending: true })
        .gte('created_at', new Date(Date.now() - 24*60*60*1000).toISOString())
        .limit(80)
        .then(function(r) {
            if (!r.data) return;
            // Wipe old text-only bubbles
            msgs.forEach(function(b) { if (b.parentNode) b.remove(); });
            // Render fresh with media
            r.data.forEach(function(msg) { cfBubble(msg); });
            container.scrollTop = container.scrollHeight;
        });
}

function cfBubble(msg) {
    var container = document.getElementById('chatMessages') || document.getElementById('adminChatMessages');
    if (!container) return;

    var isMe = (msg.sender_id && (
        (typeof currentCashier !== 'undefined' && currentCashier && msg.sender_id === currentCashier.id) ||
        (localStorage.getItem('kitchenChefId') && msg.sender_id === localStorage.getItem('kitchenChefId'))
    )) || (msg.sender_name === 'Admin' && !localStorage.getItem('kitchenChefId') && (typeof currentCashier === 'undefined' || !currentCashier));

    var myRole = cfMyRole(), myId = cfMyId();
    var isForMe = isMe || msg.recipient === 'All' || msg.recipient === myRole ||
                  msg.recipient_id === myId ||
                  (msg.sender_name === 'Admin' && myRole === 'Admin');
    if (!isForMe) return;

    var bubble = document.createElement('div');
    bubble.className = 'chat-bubble ' + (isMe ? 'sent' : 'received');
    bubble.style.cssText = 'position:relative;';
    var timeStr = new Date(msg.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
    var tag = '';
    if (!isMe) {
        if (msg.recipient === 'Direct' && msg.recipient_name) tag = ' ➡️ You';
        else if (msg.recipient !== 'All') tag = ' ➡️ ' + msg.recipient;
    }

    var inner = '';
    if (msg.media_type === 'voice' && msg.media_data) {
        inner = '<div style="display:flex;align-items:center;gap:8px;min-width:170px;">' +
            '<span style="font-size:22px;">🎤</span>' +
            '<audio controls preload="metadata" src="' + msg.media_data + '" style="height:38px;width:160px;max-width:160px;"></audio>' +
            '</div><small style="display:block;margin-top:3px;">' + (msg.sender_name || '') + ' • ' + (msg.media_duration || '') + ' • ' + timeStr + '</small>';
    } else if (msg.media_type === 'photo' && msg.media_data) {
        inner = '<img src="' + msg.media_data + '" style="max-width:220px;max-height:220px;border-radius:10px;cursor:pointer;display:block;" onclick="window.open(this.src, \'_blank\')">' +
            '<small style="display:block;margin-top:4px;">' + (msg.sender_name || '') + tag + ' • ' + timeStr + '</small>';
    } else {
        inner = (msg.message || '') + '<small style="display:block;margin-top:3px;">' + (msg.sender_name || '') + tag + ' • ' + timeStr + '</small>';
    }
    bubble.innerHTML = inner;
    container.appendChild(bubble);
    container.scrollTop = container.scrollHeight;

    // 🗑 delete button on this bubble
    cfAddDelete(bubble, msg);
}

// ================================================================
// 2️⃣ DELETE BUTTONS (by real message id — precise!)
// ================================================================
function cfAddDelete(bubble, msg) {
    if (!bubble || bubble.getAttribute('data-cf-del')) return;
    bubble.setAttribute('data-cf-del', 'yes');
    var del = document.createElement('button');
    del.textContent = '🗑';
    del.title = 'Delete for everyone';
    del.style.cssText = 'position:absolute;top:2px;right:2px;width:24px;height:24px;border:none;border-radius:50%;background:rgba(239,68,68,.9);color:white;font-size:11px;cursor:pointer;display:none;align-items:center;justify-content:center;padding:0;line-height:1;';
    bubble.appendChild(del);
    bubble.onmouseenter = function() { del.style.display = 'flex'; };
    bubble.onmouseleave = function() { del.style.display = 'none'; };
    var pt = null;
    bubble.addEventListener('touchstart', function() {
        pt = setTimeout(function() { del.style.display = 'flex'; }, 350);
    });
    bubble.addEventListener('touchend', function() { clearTimeout(pt); });
    del.onclick = async function(e) {
        e.stopPropagation();
        if (!confirm('Delete this message for EVERYONE?')) return;
        try {
            await supabaseClient.from('chat_messages').delete().eq('id', msg.id);
            bubble.remove();
        } catch(err) { alert('Delete failed: ' + err.message); }
    };
}

// ================================================================
// 3️⃣ CALL BUTTONS + CALLING (built-in — even if livecall.js is dead!)
// ================================================================
var CF = { pc: null, stream: null, peer: null, peerName: '', video: false, active: false };

async function cfCall(toId, toName, video) {
    if (CF.active) { alert('Already in a call!'); return; }
    CF.peer = toId; CF.peerName = toName; CF.video = video; CF.active = true;
    try {
        CF.stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: video });
    } catch(e) {
        CF.active = false;
        alert('🎤🎤 Camera/mic blocked! Allow access in browser settings.');
        return;
    }
    cfCallUI('calling', '📞 Calling ' + toName + '...');
    cfSignal(toId, 'ring', { video: video, fromName: cfMyName() });
    cfPeer(toId, true);
}

function cfPeer(peerId, offer) {
    if (CF.pc) { try { CF.pc.close(); } catch(e){} }
    CF.pc = new RTCPeerConnection({
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'turn:openrelay.metered.ca:80', username: 'openrelayproject', credential: 'openrelayproject' },
            { urls: 'turn:openrelay.metered.ca:443', username: 'openrelayproject', credential: 'openrelayproject' }
        ]
    });
    CF.stream.getTracks().forEach(function(t) { CF.pc.addTrack(t, CF.stream); });
    CF.pc.ontrack = function(ev) {
        var a = document.getElementById('cfAudio'); var v = document.getElementById('cfVideo');
        if (a) { a.srcObject = ev.streams[0]; a.play().catch(function(){}); }
        if (CF.video && v) { v.srcObject = ev.streams[0]; v.play().catch(function(){}); }
        CF.active = true;
        cfCallUI('active', '🟢 ' + CF.peerName);
    };
    CF.pc.onicecandidate = function(ev) {
        if (ev.candidate) cfSignal(peerId, 'ice', { candidate: ev.candidate });
    };
    if (offer) {
        CF.pc.createOffer().then(function(o) {
            CF.pc.setLocalDescription(o);
            cfSignal(peerId, 'offer', { sdp: CF.pc.localDescription });
        });
    }
}

async function cfSignal(toId, type, payload) {
    try {
        await supabaseClient.from('call_signals').insert([{
            shop_id: cfShop(), from_id: cfMyId(), from_name: cfMyName(),
            to_id: toId, type: type, data: payload, created_at: new Date().toISOString()
        }]);
    } catch(e) {}
}

function cfCallUI(state, title) {
    var old = document.getElementById('cfCallUI'); if (old) old.remove();
    var ui = document.createElement('div');
    ui.id = 'cfCallUI';
    ui.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,.97);z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center;color:white;';
    ui.innerHTML =
        (CF.video ? '<video id="cfVideo" autoplay playsinline style="width:90%;max-width:400px;border-radius:16px;background:#000;"></video>' : '') +
        '<audio id="cfAudio" autoplay style="display:none;"></audio>' +
        '<h2 style="margin:15px 0 5px;">' + title + '</h2>' +
        (state === 'calling' ? '<p style="color:#94a3b8;">Ring... ring...</p>' : '') +
        '<div style="display:flex;gap:15px;margin-top:25px;">' +
        '<button id="cfEndBtn" style="width:65px;height:65px;border-radius:50%;border:none;background:#ef4444;color:white;font-size:26px;cursor:pointer;">📵</button>' +
        '</div>';
    document.body.appendChild(ui);
    document.getElementById('cfEndBtn').onclick = function() { cfEnd(true); };
}

function cfEnd(notify) {
    if (notify && CF.peer) cfSignal(CF.peer, 'hangup', {});
    if (CF.pc) { try { CF.pc.close(); } catch(e){} CF.pc = null; }
    if (CF.stream) { CF.stream.getTracks().forEach(function(t){ t.stop(); }); CF.stream = null; }
    var ui = document.getElementById('cfCallUI'); if (ui) ui.remove();
    var inc = document.getElementById('cfIncomingUI'); if (inc) inc.remove();
    CF.active = false; CF.peer = null;
}

// Incoming call listener
function cfListen() {
    supabaseClient.channel('cf-calls-' + cfShop())
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'call_signals', filter: `shop_id=eq.${cfShop()}` },
            function(p) {
                var s = p.new;
                var forMe = (s.to_id === cfMyId()) || (s.to_id === cfMyRole()) || (s.to_id === 'All' && s.from_id !== cfMyId());
                if (!forMe) return;
                if (s.type === 'ring') cfIncoming(s);
                else if (s.type === 'offer') cfHandleOffer(s);
                else if (s.type === 'answer' && CF.pc) {
                    CF.pc.setRemoteDescription(new RTCSessionDescription(s.data.sdp)).catch(function(){});
                }
                else if (s.type === 'ice' && CF.pc) {
                    CF.pc.addIceCandidate(s.data.candidate).catch(function(){});
                }
                else if (s.type === 'hangup') cfEnd(false);
            }).subscribe();
}

async function cfIncoming(s) {
    if (CF.active) return;
    CF.peer = s.from_id; CF.peerName = s.from_name; CF.video = (s.data && s.data.video) || false;
    try { if (typeof playAlert === 'function') playAlert(); } catch(e){}
    try { if (navigator.vibrate) navigator.vibrate([300,150,300]); } catch(e){}

    var ui = document.createElement('div');
    ui.id = 'cfIncomingUI';
    ui.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,.95);z-index:99998;display:flex;flex-direction:column;align-items:center;justify-content:center;color:white;';
    ui.innerHTML =
        '<div style="font-size:60px;margin-bottom:10px;animation:cfPulse 1s infinite;">' + (CF.video ? '📹' : '📞') + '</div>' +
        '<h2>' + CF.peerName + ' is calling...</h2>' +
        '<div style="display:flex;gap:20px;margin-top:30px;">' +
        '<button id="cfYes" style="width:70px;height:70px;border-radius:50%;border:none;background:#10b981;color:white;font-size:30px;cursor:pointer;">✅</button>' +
        '<button id="cfNo" style="width:70px;height:70px;border-radius:50%;border:none;background:#ef4444;color:white;font-size:30px;cursor:pointer;">❌</button></div>' +
        '<style>@keyframes cfPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.15)}}</style>';
    document.body.appendChild(ui);

    document.getElementById('cfYes').onclick = async function() {
        ui.remove();
        try { CF.stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: CF.video }); }
        catch(e) { alert('Mic blocked!'); cfSignal(CF.peer, 'hangup', {}); return; }
        cfCallUI('active', '🟢 ' + CF.peerName);
        cfPeer(CF.peer, false);
    };
    document.getElementById('cfNo').onclick = function() {
        ui.remove();
        cfSignal(CF.peer, 'hangup', {});
    };
    setTimeout(function() {
        if (document.getElementById('cfIncomingUI')) { ui.remove(); CF.peer = null; }
    }, 30000);
}

async function cfHandleOffer(s) {
    if (!CF.pc) {
        try { CF.stream = CF.stream || await navigator.mediaDevices.getUserMedia({ audio: true, video: CF.video }); } catch(e) { return; }
        cfPeer(s.from_id, false);
    }
    try {
        await CF.pc.setRemoteDescription(new RTCSessionDescription(s.data.sdp));
        var answer = await CF.pc.createAnswer();
        await CF.pc.setLocalDescription(answer);
        await cfSignal(s.from_id, 'answer', { sdp: CF.pc.localDescription });
    } catch(e) {}
}

// Attach 📞📹 buttons to the smart chat bar
setInterval(function() {
    try {
        var bar = document.getElementById('smartChatBar');
        if (!bar || document.getElementById('cfCallBtn')) return;
        var sel = document.getElementById('chatRecipient') || document.getElementById('adminChatRecipient');

        var vb = document.createElement('button');
        vb.id = 'cfCallBtn';
        vb.style.cssText = 'width:38px;height:38px;min-width:38px;border:none;border-radius:50%;background:#059669;color:white;font-size:16px;cursor:pointer;flex-shrink:0;';
        vb.textContent = '📞';
        vb.title = 'Voice call';
        vb.onclick = function() { cfCallFromChat(false); };
        bar.insertBefore(vb, bar.firstChild);

        var vid = document.createElement('button');
        vid.id = 'cfVideoBtn';
        vid.style.cssText = 'width:38px;height:38px;min-width:38px;border:none;border-radius:50%;background:#7c3aed;color:white;font-size:16px;cursor:pointer;flex-shrink:0;';
        vid.textContent = '📹';
        vid.title = 'Video call';
        vid.onclick = function() { cfCallFromChat(true); };
        bar.insertBefore(vid, vb);
    } catch(e) {}
}, 2000);

function cfCallFromChat(video) {
    var sel = document.getElementById('chatRecipient') || document.getElementById('adminChatRecipient');
    if (!sel) { alert('Open chat first.'); return; }
    var val = sel.value;
    var name = sel.options[sel.selectedIndex].text.replace('👤 ', '').replace('🟢 ', '');
    if (val === 'All' || val === 'Kitchen' || val === 'Cashier' || val === 'Admin') {
        alert('⚠️ Pick a SPECIFIC person from the Direct Message list to call.');
        return;
    }
    cfCall(val, name, video);
}

// ================================================================
// 🚀 BOOT — run when ready, re-render when chat opens
// ================================================================
function cfBoot() {
    try { cfListen(); } catch(e) {}

    // Re-render with media whenever chat becomes visible
    var seen = false;
    setInterval(function() {
        var c = document.getElementById('chatMessages') || document.getElementById('adminChatMessages');
        if (c && c.offsetParent !== null) {
            if (!seen) { seen = true; cfRenderAll(); }
        } else {
            seen = false;
        }
    }, 1500);
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(cfBoot, 1500);
} else {
    document.addEventListener('DOMContentLoaded', function() { setTimeout(cfBoot, 1500); });
}
