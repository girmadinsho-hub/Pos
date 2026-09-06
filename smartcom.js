/* ================================================================
   💬 SMARTCOM — the complete communication system. ONE file.
   Text + Voice messages + Photos + Delete + Live Voice/Video Calls
   + Presence + Typing indicator. Zero dependencies on other files.
   ================================================================ */

var SC = {
    id: null, name: null, role: null, shop: null,
    pc: null, stream: null, peer: null, peerName: '', video: false,
    inCall: false, channel: null, booted: false
};

// ===== WHO AM I / WHERE AM I =====
function scInit() {
    if (typeof currentCashier !== 'undefined' && currentCashier) {
        SC.id = currentCashier.id; SC.name = currentCashier.name; SC.role = currentCashier.position || 'Cashier';
    } else if (localStorage.getItem('kitchenChefId')) {
        SC.id = localStorage.getItem('kitchenChefId'); SC.name = localStorage.getItem('kitchenChefName'); SC.role = 'Kitchen';
    } else {
        SC.id = 'admin'; SC.name = 'Admin'; SC.role = 'Admin';
    }
    try { SC.shop = (typeof getShopId === 'function') ? getShopId() : null; } catch(e) { SC.shop = null; }
    if (!SC.shop && typeof shopId !== 'undefined') SC.shop = shopId;
    if (!SC.shop) SC.shop = localStorage.getItem('shopId') || localStorage.getItem('kitchenShopId') || 'default';
}

// ================================================================
// 🎨 PART 1 — THE SMART INPUT BAR (builds inside the chat modal)
// ================================================================
function scBuildBar() {
    var area = document.querySelector('.chat-input-area');
    if (!area || document.getElementById('scBar')) return;

    // Hide old input row
    var oldRow = area.querySelector('div[style*="display: flex"]');
    if (oldRow) oldRow.style.display = 'none';

    var bar = document.createElement('div');
    bar.id = 'scBar';
    bar.style.cssText = 'display:flex;gap:5px;align-items:center;flex-wrap:nowrap;';
    bar.innerHTML =
        '<button id="scCallBtn" title="Voice call" style="width:38px;height:38px;min-width:38px;border:none;border-radius:50%;background:#059669;color:white;font-size:16px;cursor:pointer;flex-shrink:0;">📞</button>' +
        '<button id="scVideoBtn" title="Video call" style="width:38px;height:38px;min-width:38px;border:none;border-radius:50%;background:#7c3aed;color:white;font-size:16px;cursor:pointer;flex-shrink:0;">📹</button>' +
        '<button id="scPhotoBtn" title="Send photo" style="width:38px;height:38px;min-width:38px;border:none;border-radius:50%;background:#7c3aed;color:white;font-size:15px;cursor:pointer;flex-shrink:0;">📷</button>' +
        '<button id="scFileBtn" title="Send file" style="width:38px;height:38px;min-width:38px;border:none;border-radius:50%;background:#0891b2;color:white;font-size:15px;cursor:pointer;flex-shrink:0;">📎</button>' +
		  	'<button id="scMicBtn" title="Hold to record" style="width:38px;height:38px;min-width:38px;border:none;border-radius:50%;background:#ef4444;color:white;font-size:15px;cursor:pointer;flex-shrink:0;">🎤</button>' +
        '<div style="flex:1;min-width:0;position:relative;">' +
        '<textarea id="scText" rows="1" placeholder="Message..." style="width:100%;box-sizing:border-box;padding:9px 46px 9px 12px;border:1px solid #cbd5e1;border-radius:18px;font-size:14px;outline:none;resize:none;line-height:1.4;max-height:100px;background:#fff;color:#1e293b;font-family:inherit;display:block;"></textarea>' +
        '<button id="scSendBtn" style="position:absolute;right:3px;bottom:3px;width:32px;height:32px;border:none;border-radius:50%;background:#2563eb;color:white;font-size:13px;font-weight:bold;cursor:pointer;">➤</button>' +
        '</div>';
    area.appendChild(bar);

    // Send
    document.getElementById('scSendBtn').onclick = function() {
        var ti = document.getElementById('scText');
        var txt = ti.value.trim();
        if (!txt) return;
        ti.value = ''; ti.style.height = 'auto';
        scSend({ message: txt, media_type: null, media_data: null, media_duration: null });
    };
    // Enter = send, Shift+Enter = newline, auto-grow
    document.getElementById('scText').addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            document.getElementById('scSendBtn').click();
        }
    });
    document.getElementById('scText').addEventListener('input', function() {
        var t = this;
        t.style.height = 'auto';
        t.style.height = Math.min(t.scrollHeight, 100) + 'px';
    });

    // Photo
           document.getElementById('scPhotoBtn').onclick = function() {
        var fi = document.createElement('input');
        fi.type = 'file';
        fi.accept = 'image/*';
        fi.onchange = function() {
            if (this.files && this.files[0]) scPhoto(this.files[0]);
        };
        fi.click();
    };
	    document.getElementById('scFileBtn').onclick = function() {
        var fi = document.createElement('input');
        fi.type = 'file';
        fi.onchange = function() { scFile(this.files[0]); };
        fi.click();
    };
	
    // Voice: hold to record
    var mic = document.getElementById('scMicBtn');
    mic.addEventListener('touchstart', function(e) { e.preventDefault(); scRecStart(); });
    mic.addEventListener('touchend', function(e) { e.preventDefault(); scRecStop(); });
    mic.addEventListener('mousedown', function() { scRecStart(); });
    mic.addEventListener('mouseup', function() { scRecStop(); });

    // Calls
    document.getElementById('scCallBtn').onclick = function() { scCallFromChat(false); };
    document.getElementById('scVideoBtn').onclick = function() { scCallFromChat(true); };
}

// ================================================================
// 🎤 PART 2 — VOICE RECORDING
// ================================================================
var scRec = null, scChunks = [], scT = 0, scStart = 0, scTmr = null;

function scRecStart() {
    if (scRec) return;
    navigator.mediaDevices.getUserMedia({ audio: true }).then(function(stream) {
        scChunks = []; scStart = Date.now(); scT = 0;
        scRec = new MediaRecorder(stream);
        scRec.ondataavailable = function(e) { if (e.data.size > 0) scChunks.push(e.data); };
        scRec.onstop = function() { stream.getTracks().forEach(function(t) { t.stop(); }); };
        scRec.start();
        var mic = document.getElementById('scMicBtn');
        if (mic) { mic.style.background = '#991b1b'; mic.textContent = '⏺'; }
        var ti = document.getElementById('scText');
        scTmr = setInterval(function() {
            scT++;
            if (ti) ti.placeholder = '🔴 ' + scT + 's...';
            if (scT >= 60) scRecStop();
        }, 1000);
    }).catch(function() { alert('🎤 Mic blocked! Allow microphone in browser settings.'); });
}

function scRecStop() {
    if (!scRec) return;
    var r = scRec; scRec = null;
    clearInterval(scTmr);
    var dur = Math.round((Date.now() - scStart) / 1000);
    var ti = document.getElementById('scText');
    if (ti) ti.placeholder = 'Message...';
    var mic = document.getElementById('scMicBtn');
    if (mic) { mic.style.background = '#ef4444'; mic.textContent = '🎤'; }
    r.stop();
    setTimeout(function() {
        if (dur < 1 || scChunks.length === 0) return;
        var blob = new Blob(scChunks, { type: 'audio/webm' });
        var rd = new FileReader();
        rd.onloadend = function() {
            if (rd.result.length > 500000) { alert('Too long! Max ~50 seconds.'); return; }
            scSend({ message: '🎤 Voice', media_type: 'voice', media_data: rd.result, media_duration: dur + 's' });
        };
        rd.readAsDataURL(blob);
    }, 300);
}

// ================================================================
// 📷 PART 3 — PHOTO
// ================================================================
function scPhoto(file) {
    if (!file) return;
    var rd = new FileReader();
    rd.onload = function(e) {
        var img = new Image();
        img.onload = function() {
            var cv = document.createElement('canvas');
            var sc = Math.min(1, 420 / img.width);
            cv.width = img.width * sc; cv.height = img.height * sc;
            cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
            var b64 = cv.toDataURL('image/jpeg', 0.62);
            if (b64.length > 600000) { alert('Photo too large.'); return; }
            scSend({ message: '📷 Photo', media_type: 'photo', media_data: b64, media_duration: null });
        };
        img.src = e.target.result;
    };
    rd.readAsDataURL(file);
}

// ================================================================
// 📎 FILE ATTACHMENT SENDER (PDF, docs, any file — max 1MB)
// ================================================================
function scFile(file) {
    if (!file) return;
    if (file.size > 1000000) { alert('File too large! Max 1 MB.'); return; }
    var rd = new FileReader();
    rd.onloadend = function() {
        if (rd.result.length > 1400000) { alert('File too large after encoding.'); return; }
        scSend({
            message: '📎 ' + file.name,
            media_type: 'file',
            media_data: rd.result,
            media_duration: Math.round(file.size / 1024) + 'KB'
        });
    };
    rd.readAsDataURL(file);
}
// ================================================================
// 📤 PART 4 — SEND (all types)
// ================================================================
function scSend(p) {
    var sel = document.getElementById('chatRecipient') || document.getElementById('adminChatRecipient');
    var val = sel ? sel.value : 'All';
    var nm = sel ? sel.options[sel.selectedIndex].text.replace('👤 ', '').replace('🟢 ', '') : 'Everyone';

    var msg = {
        shop_id: SC.shop,
        message: p.message,
        media_type: p.media_type, media_data: p.media_data, media_duration: p.media_duration,
        sender_name: SC.name, sender_id: SC.id, sender_role: SC.role,
        recipient: 'All'
    };
    if (val === 'All' || val === 'Cashier' || val === 'Kitchen' || val === 'Admin') {
        msg.recipient = val;
    } else {
        msg.recipient = 'Direct'; msg.recipient_id = val; msg.recipient_name = nm;
    }

    supabaseClient.from('chat_messages').insert([msg]).then(function(r) {
        if (r.error) alert('❌ Send failed: ' + r.error.message);
    });
}

// ================================================================
// 🎨 PART 5 — MEDIA BUBBLE RENDERER (voice players + photos + text)
// Takes OVER the apps' renderers — permanently re-applied.
// ================================================================
function scBubble(msg) {
    var container = document.getElementById('chatMessages') || document.getElementById('adminChatMessages');
    if (!container) return;

    var isMe = (msg.sender_id && msg.sender_id === SC.id) ||
               (msg.sender_name === SC.name) ||
               (!SC.id && msg.sender_name === 'Admin');

    var forMe = isMe || msg.recipient === 'All' || msg.recipient === SC.role || msg.recipient_id === SC.id;
    if (!forMe) return;

    var b = document.createElement('div');
    b.className = 'chat-bubble ' + (isMe ? 'sent' : 'received');
    b.style.position = 'relative';
    var ts = new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
    var tag = '';
    if (!isMe) {
        if (msg.recipient === 'Direct' && msg.recipient_name) tag = ' ➡️ You';
        else if (msg.recipient !== 'All') tag = ' ➡️ ' + msg.recipient;
    }

    var in_ = '';

    // 1️⃣ 🎤 VOICE MESSAGE — audio player
    if (msg.media_type === 'voice' && msg.media_data) {
        in_ = '<div style="display:flex;align-items:center;gap:8px;min-width:170px;">' +
            '<span style="font-size:22px;">🎤</span>' +
            '<audio controls preload="metadata" src="' + msg.media_data + '" style="height:36px;width:158px;max-width:158px;"></audio>' +
            '</div>' +
            '<small style="display:block;margin-top:3px;">' + msg.sender_name + ' • ' + (msg.media_duration || '') + ' • ' + ts + '</small>';
    }

        // 2️⃣ 🖼️ PHOTO — with in-page lightbox (NO window.open!)
    else if (msg.media_type === 'photo' && msg.media_data) {
        in_ = '<img src="' + msg.media_data + '" style="max-width:220px;max-height:220px;border-radius:10px;cursor:pointer;display:block;" onclick="scLightbox(\'' + 'media_' + ts.replace(/[^0-9]/g, '') + '\')" data-media="' + msg.media_data + '" id="media_' + ts.replace(/[^0-9]/g, '') + '">' +
            '<small style="display:block;margin-top:4px;">' + msg.sender_name + tag + ' • ' + ts + '</small>';
    }

    // 3️⃣ 📎 FILE — downloadable attachment
    else if (msg.media_type === 'file' && msg.media_data) {
        var fname = (msg.message || 'file').replace('📎 ', '');
        var fsize = msg.media_duration || '';
        in_ = '<a href="' + msg.media_data + '" download="' + fname + '" style="display:flex;align-items:center;gap:10px;text-decoration:none;color:inherit;padding:8px 12px;border:1px solid rgba(255,255,255,.3);border-radius:10px;min-width:170px;">' +
            '<span style="font-size:28px;">📎</span>' +
            '<span style="flex:1;min-width:0;"><b style="display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:130px;">' + fname + '</b>' +
            '<small style="opacity:.7;">' + fsize + ' • Tap to download</small></span>' +
            '<span style="font-size:18px;">⬇️</span></a>' +
            '<small style="display:block;margin-top:3px;">' + msg.sender_name + tag + ' • ' + ts + '</small>';
    }

    // 4️⃣ 📝 TEXT — normal message
    else {
        in_ = (msg.message || '') +
            '<small style="display:block;margin-top:3px;">' + msg.sender_name + tag + ' • ' + ts + '</small>';
    }

    b.innerHTML = in_;
    container.appendChild(b);
    container.scrollTop = container.scrollHeight;

    // 🗑 DELETE — for everyone (hover or long-press to reveal)
    var del = document.createElement('button');
    del.textContent = '🗑';
    del.style.cssText = 'position:absolute;top:1px;right:1px;width:24px;height:24px;border:none;border-radius:50%;background:rgba(239,68,68,.9);color:white;font-size:11px;cursor:pointer;display:none;align-items:center;justify-content:center;padding:0;line-height:1;';
    b.appendChild(del);
    b.onmouseenter = function() { del.style.display = 'flex'; };
    b.onmouseleave = function() { del.style.display = 'none'; };
    var pt = null;
    b.addEventListener('touchstart', function() {
        pt = setTimeout(function() { del.style.display = 'flex'; }, 400);
    });
    b.addEventListener('touchend', function() { clearTimeout(pt); });
    del.onclick = async function(e) {
        e.stopPropagation();
        e.preventDefault();
        if (!confirm('Delete this message for EVERYONE?')) return;
        try {
            await supabaseClient.from('chat_messages').delete().eq('id', msg.id);
            b.remove();
        } catch(err) {
            alert('Delete failed: ' + err.message);
        }
    };
}
// TAKE OVER the app renderers — re-applied forever so nothing overwrites us
function scWire() {
    try {
        window.renderChatBubble = scBubble;
        window.renderAdminChatBubble = scBubble;
    } catch(e) {}
}

// 🔄 Re-render history with media whenever chat opens
function scRerender() {
    var c = document.getElementById('chatMessages') || document.getElementById('adminChatMessages');
    if (!c) return;
    supabaseClient.from('chat_messages')
        .select('*').eq('shop_id', SC.shop)
        .gte('created_at', new Date(Date.now() - 24*60*60*1000).toISOString())
        .order('created_at', { ascending: true }).limit(80)
        .then(function(r) {
            if (!r.data) return;
            var olds = c.querySelectorAll('.chat-bubble');
            olds.forEach(function(b) { if (b.parentNode) b.remove(); });
            r.data.forEach(function(m) { scBubble(m); });
            c.scrollTop = c.scrollHeight;
        });
}

// ================================================================
// 📞 PART 6 — LIVE CALLS (WebRTC, direct + TURN fallback)
// ================================================================

// ================================================================
// 📞 FIXED CALL SYSTEM – reliable WebRTC with proper state & ICE
// ================================================================

let __scCallChannel = null;   // single channel
let __scIceBuffer = [];       // buffer for early ICE candidates
let __scRingStop = false;
let __scCallTimer = null;
let __scRingbackInterval = null;

// ===== CALL CHANNEL SETUP (run once in scBoot) =====
function scInitCallChannel() {
    if (__scCallChannel) return;
    __scCallChannel = supabaseClient.channel('calls-' + SC.shop);
    __scCallChannel
        .on('broadcast', { event: 'sc-signal' }, (msg) => scHandleSignal(msg.payload))
        .subscribe();
}

// ===== SIGNAL DISPATCHER =====
async function scHandleSignal(s) {
    if (!s || String(s.from_id) === String(SC.id)) return;

    const forMe = (String(s.to_id) === String(SC.id)) || (String(s.to_id) === String(SC.role)) || (String(s.to_id) === 'All');
    if (!forMe) return;

    try {
        if (s.type === 'ring') {
            scIncoming(s);
        }
        else if (s.type === 'typing') {
            scShowTyping(s.from_name || 'Someone');
        }
        else if (s.type === 'offer') {
            if (document.getElementById('scIncomingUI')) {
                SC.pendingOffer = s;
            } else if (SC.inCall) {
                await scHandleOffer(s);
            }
        }
        else if (s.type === 'answer') {
            if (SC.pc && SC.pc.signalingState !== 'stable') {
                await SC.pc.setRemoteDescription(new RTCSessionDescription(s.data.sdp));
                // apply any buffered ICE
                if (__scIceBuffer.length) {
                    const buf = __scIceBuffer;
                    __scIceBuffer = [];
                    for (const c of buf) {
                        try { await SC.pc.addIceCandidate(c); } catch(e) {}
                    }
                }
            }
        }
        else if (s.type === 'ice') {
            // apply immediately if possible, else buffer
            if (SC.pc && SC.pc.remoteDescription) {
                try { await SC.pc.addIceCandidate(s.data.candidate); } catch(e) {}
            } else {
                __scIceBuffer.push(s.data.candidate);
            }
        }
        else if (s.type === 'hangup') {
            scEnd(false);
        }
    } catch(e) {
        console.warn('Signal handling error:', e);
    }
}

// ===== SEND SIGNAL =====
async function scSig(toId, type, payload) {
    if (!__scCallChannel) return;
    try {
        await __scCallChannel.send({
            type: 'broadcast',
            event: 'sc-signal',
            payload: {
                shop_id: SC.shop,
                from_id: SC.id,
                from_name: SC.name,
                to_id: toId,
                type: type,
                data: payload
            }
        });
    } catch(e) {
        console.warn('Signal send failed:', e.message);
    }
}

// ===== OUTGOING CALL =====
async function scCall(toId, toName, video) {
    if (SC.inCall) { alert('Already in a call!'); return; }
    scInit();

    SC.inCall = true;
    SC.peer = toId;
    SC.peerName = toName;
    SC.video = video;

    try {
        SC.stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: video });
    } catch(e) {
        SC.inCall = false;
        alert('🎤/📷 Blocked! Allow access in browser settings.');
        return;
    }

    scCallUI('calling', '📞 Calling ' + toName + '...');

    // Ringback sound
    __scRingStop = false;
    try {
        const ctx = window.__scRingCtx || new (window.AudioContext || window.webkitAudioContext)();
        window.__scRingCtx = ctx;
        __scRingbackInterval = setInterval(() => {
            if (__scRingStop) { clearInterval(__scRingbackInterval); return; }
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.type = 'sine';
            o.frequency.value = 440;
            g.gain.setValueAtTime(0.15, ctx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
            o.connect(g);
            g.connect(ctx.destination);
            o.start();
            o.stop(ctx.currentTime + 0.85);
        }, 2000);
    } catch(e) {}

    // Send ring and create peer connection
    await scSig(toId, 'ring', { video: video, fromName: SC.name });
    scPeer(toId, true);

    // Auto-cancel after 40 seconds
    setTimeout(() => {
        if (SC.inCall && document.getElementById('scCallUI') && !SC.pc.connectionState) {
            scEnd(true);
        }
    }, 40000);
}

// ===== CREATE PEER CONNECTION =====
function scPeer(peerId, isOfferer) {
    if (SC.pc) { try { SC.pc.close(); } catch(e) {} }

    SC.pc = new RTCPeerConnection({
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'turn:openrelay.metered.ca:80', username: 'openrelayproject', credential: 'openrelayproject' },
            { urls: 'turn:openrelay.metered.ca:443', username: 'openrelayproject', credential: 'openrelayproject' }
        ]
    });

    SC.stream.getTracks().forEach(track => SC.pc.addTrack(track, SC.stream));

    SC.pc.ontrack = (ev) => {
        SC.remoteStream = ev.streams[0];
        __scRingStop = true;
        clearInterval(__scCallTimer);
        clearInterval(__scRingbackInterval);
        const h2 = document.querySelector('#scCallUI h2');
        if (h2) h2.textContent = '🟢 ' + SC.peerName;

        const audio = document.getElementById('scRemoteAudio');
        const video = document.getElementById('scRemoteVideo');
        if (audio) {
            audio.srcObject = SC.remoteStream;
            audio.volume = 1.0;
            audio.play().catch(() => {
                // Add a tap-to-play button if browser blocks autoplay
                const btn = document.createElement('button');
                btn.textContent = '🔊 TAP TO HEAR';
                btn.style.cssText = 'padding:12px 24px;border:none;border-radius:10px;background:#2563eb;color:white;font-weight:bold;font-size:16px;cursor:pointer;';
                btn.onclick = () => { audio.play(); btn.remove(); };
                audio.parentNode.appendChild(btn);
            });
        }
        if (video) {
            video.srcObject = SC.remoteStream;
            video.play().catch(() => {});
        }
    };

    SC.pc.onicecandidate = (ev) => {
        if (ev.candidate) scSig(peerId, 'ice', { candidate: ev.candidate });
    };

    SC.pc.onconnectionstatechange = () => {
        if (SC.pc.connectionState === 'failed' || SC.pc.connectionState === 'disconnected') {
            scEnd(false);
        }
    };

    if (isOfferer) {
        SC.pc.createOffer()
            .then(offer => SC.pc.setLocalDescription(offer))
            .then(() => scSig(peerId, 'offer', { sdp: SC.pc.localDescription }))
            .catch(e => console.warn('Offer failed:', e.message));
    }
}

// ===== HANDLE INCOMING OFFER (callee side, after user answers) =====
async function scHandleOffer(s) {
    if (!SC.stream) {
        try {
            SC.stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: SC.video });
        } catch(e) {
            alert('🎤 Mic blocked!');
            scSig(SC.peer, 'hangup', {});
            scEnd(false);
            return;
        }
    }

    if (!SC.pc) {
        SC.pc = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'turn:openrelay.metered.ca:80', username: 'openrelayproject', credential: 'openrelayproject' },
                { urls: 'turn:openrelay.metered.ca:443', username: 'openrelayproject', credential: 'openrelayproject' }
            ]
        });

        SC.stream.getTracks().forEach(track => SC.pc.addTrack(track, SC.stream));

        SC.pc.ontrack = (ev) => {
            SC.remoteStream = ev.streams[0];
            __scRingStop = true;
            const h2 = document.querySelector('#scCallUI h2');
            if (h2) h2.textContent = '🟢 ' + SC.peerName;

            const audio = document.getElementById('scRemoteAudio');
            const video = document.getElementById('scRemoteVideo');
            if (audio) {
                audio.srcObject = SC.remoteStream;
                audio.play().catch(() => {
                    const btn = document.createElement('button');
                    btn.textContent = '🔊 TAP TO HEAR';
                    btn.style.cssText = 'padding:12px 24px;border:none;border-radius:10px;background:#2563eb;color:white;font-weight:bold;font-size:16px;cursor:pointer;';
                    btn.onclick = () => { audio.play(); btn.remove(); };
                    audio.parentNode.appendChild(btn);
                });
            }
            if (video) {
                video.srcObject = SC.remoteStream;
                video.play().catch(() => {});
            }
        };

        SC.pc.onicecandidate = (ev) => {
            if (ev.candidate) scSig(SC.peer, 'ice', { candidate: ev.candidate });
        };

        SC.pc.onconnectionstatechange = () => {
            if (SC.pc.connectionState === 'failed' || SC.pc.connectionState === 'disconnected') {
                scEnd(false);
            }
        };
    }

    try {
        await SC.pc.setRemoteDescription(new RTCSessionDescription(s.data.sdp));
        const answer = await SC.pc.createAnswer();
        await SC.pc.setLocalDescription(answer);
        await scSig(s.from_id, 'answer', { sdp: SC.pc.localDescription });

        // Apply any buffered ICE candidates now
        if (__scIceBuffer.length) {
            const buf = __scIceBuffer;
            __scIceBuffer = [];
            for (const c of buf) {
                try { await SC.pc.addIceCandidate(c); } catch(e) {}
            }
        }
    } catch(e) {
        console.warn('Answer creation failed:', e.message);
    }
}

// ===== INCOMING CALL UI =====
function scIncoming(s) {
    if (SC.inCall) return;
    scInit();
    SC.inCall = true;           // 🔧 set state immediately
    SC.peer = s.from_id;
    SC.peerName = s.from_name;
    SC.video = (s.data && s.data.video) || false;

    // Vibration
    try { if (navigator.vibrate) navigator.vibrate([400,200,400,200,400,200,400]); } catch(e) {}

    // Ring sound
    __scRingStop = false;
    try {
        const ctx = window.__scRingCtx || new (window.AudioContext || window.webkitAudioContext)();
        window.__scRingCtx = ctx;
        function ringOnce() {
            if (__scRingStop) return;
            [0, 0.35].forEach(offset => {
                const o = ctx.createOscillator();
                const g = ctx.createGain();
                o.type = 'sine';
                o.frequency.value = 880;
                const o2 = ctx.createOscillator();
                const g2 = ctx.createGain();
                o2.type = 'sine';
                o2.frequency.value = 1245;
                const t = ctx.currentTime + offset;
                g.gain.setValueAtTime(0.4, t);
                g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
                g2.gain.setValueAtTime(0.25, t);
                g2.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
                o.connect(g); g.connect(ctx.destination);
                o2.connect(g2); g2.connect(ctx.destination);
                o.start(t); o.stop(t + 0.3);
                o2.start(t); o2.stop(t + 0.3);
            });
        }
        window.__scRingInterval = setInterval(() => {
            if (__scRingStop) { clearInterval(window.__scRingInterval); return; }
            ringOnce();
        }, 2000);
        ringOnce();
    } catch(e) {}

    // Screen wake
    try {
        if ('wakeLock' in navigator && !window.__scWakeLock) {
            navigator.wakeLock.request('screen').then(wl => window.__scWakeLock = wl).catch(() => {});
        }
    } catch(e) {}

    const ui = document.createElement('div');
    ui.id = 'scIncomingUI';
    ui.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,.95);z-index:2147483000;display:flex;flex-direction:column;align-items:center;justify-content:center;color:white;';
    ui.innerHTML =
        '<div style="font-size:60px;margin-bottom:8px;animation:scP 1s infinite;">' + (SC.video ? '📹' : '📞') + '</div>' +
        '<h2>' + SC.peerName + ' is calling...</h2>' +
        '<div style="display:flex;gap:25px;margin-top:30px;">' +
        '<button id="scYes" style="width:70px;height:70px;border-radius:50%;border:none;background:#10b981;color:white;font-size:30px;cursor:pointer;">✅</button>' +
        '<button id="scNo" style="width:70px;height:70px;border-radius:50%;border:none;background:#ef4444;color:white;font-size:30px;cursor:pointer;">❌</button></div>' +
        '<style>@keyframes scP{0%,100%{transform:scale(1)}50%{transform:scale(1.15)}}</style>';
    document.body.appendChild(ui);

    const yesBtn = document.getElementById('scYes');
    const noBtn = document.getElementById('scNo');

    yesBtn.addEventListener('click', async (ev) => {
        ev.stopPropagation(); ev.preventDefault();
        __scRingStop = true;
        ui.remove();

        try {
            SC.stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: SC.video });
        } catch(e) {
            alert('🎤 Mic blocked!');
            scSig(SC.peer, 'hangup', {});
            scEnd(false);
            return;
        }

        scCallUI('active', '🟢 ' + SC.peerName);
        if (SC.pendingOffer) {
            const offer = SC.pendingOffer;
            SC.pendingOffer = null;
            await scHandleOffer(offer);
        }
    });

    noBtn.addEventListener('click', (ev) => {
        ev.stopPropagation(); ev.preventDefault();
        __scRingStop = true;
        ui.remove();
        scSig(SC.peer, 'hangup', {});
        scEnd(false);
    });

    // Auto-miss after 30 seconds
    setTimeout(() => {
        if (document.getElementById('scIncomingUI')) {
            __scRingStop = true;
            ui.remove();
            scSig(SC.peer, 'hangup', {});
            scEnd(false);
        }
    }, 30000);
}

// ===== CALL UI (outgoing & active) =====
function scCallUI(state, title) {
    const old = document.getElementById('scCallUI');
    if (old) old.remove();

    const ui = document.createElement('div');
    ui.id = 'scCallUI';
    ui.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,.97);z-index:2147483000;display:flex;flex-direction:column;align-items:center;justify-content:center;color:white;';

    let videoHtml = SC.video ?
        '<video id="scRemoteVideo" autoplay playsinline style="width:95%;height:55vh;object-fit:cover;border-radius:16px;background:#000;"></video>' : '';
    let audioHtml = SC.video ?
        '<audio id="scRemoteAudio" autoplay style="position:absolute;width:1px;height:1px;opacity:0.01;"></audio>' :
        '<audio id="scRemoteAudio" autoplay controls style="width:90%;max-width:300px;height:40px;margin:8px 0;"></audio>';
    let localVideoHtml = (SC.video && SC.stream) ?
        '<video id="scLocalVideo" autoplay playsinline muted style="position:absolute;top:15px;right:15px;width:100px;border-radius:10px;border:2px solid rgba(255,255,255,.4);z-index:1;"></video>' : '';

    ui.innerHTML = videoHtml + audioHtml + localVideoHtml +
        '<h2 style="margin:10px 0 5px;">' + title + '</h2>' +
        (state === 'calling' ? '<p id="scCallTimer" style="color:#94a3b8;">Ringing... 0s</p>' : '') +
        '<button id="scEndBtn" style="width:70px;height:70px;border-radius:50%;border:none;background:#ef4444;color:white;font-size:28px;cursor:pointer;margin-top:15px;">📵</button>';
    document.body.appendChild(ui);

    if (SC.video && SC.stream) {
        const lv = document.getElementById('scLocalVideo');
        if (lv) lv.srcObject = SC.stream;
    }

    if (state === 'calling') {
        let t = 0;
        __scCallTimer = setInterval(() => {
            t++;
            const el = document.getElementById('scCallTimer');
            if (el) el.textContent = 'Ringing... ' + t + 's';
            if (t >= 40) { clearInterval(__scCallTimer); scEnd(true); }
        }, 1000);
    }

    document.getElementById('scEndBtn').addEventListener('click', () => scEnd(true));
}

// ===== END CALL =====
function scEnd(notify) {
    if (notify && SC.peer) scSig(SC.peer, 'hangup', {});
    __scRingStop = true;
    clearInterval(__scCallTimer);
    clearInterval(__scRingbackInterval);
    clearInterval(window.__scRingInterval);
    SC.inCall = false;
    SC.peer = null;
    if (SC.pc) { try { SC.pc.close(); } catch(e) {} SC.pc = null; }
    if (SC.stream) { SC.stream.getTracks().forEach(t => t.stop()); SC.stream = null; }
    const u = document.getElementById('scCallUI');
    if (u) u.remove();
    const i = document.getElementById('scIncomingUI');
    if (i) i.remove();
    __scIceBuffer = [];
}

// ===== CALL FROM CHAT BUTTON =====
function scCallFromChat(video) {
    const sel = document.getElementById('chatRecipient') || document.getElementById('adminChatRecipient');
    if (!sel) { alert('Open a chat first.'); return; }
    const val = sel.value;
    const nm = sel.options[sel.selectedIndex].text.replace('👤 ', '').replace('🟢 ', '');
    if (val === 'All' || val === 'Cashier' || val === 'Kitchen' || val === 'Admin') {
        alert('⚠️ Select a SPECIFIC person from the Direct Message list first.');
        return;
    }
    scCall(val, nm, video);
}




// ================================================================
// ✏️ PART 7 — TYPING + PRESENCE (bonus modern touches)
// ================================================================
var scTypingT = null;
function scTypingPing() {
    if (scTypingT) return;
    scTypingT = setTimeout(function() { scTypingT = null; }, 2500);
    scSig('All', 'typing', {});
}

function scShowTyping(name) {
    var el = document.getElementById('scTyping');
    if (!el) {
        var area = document.querySelector('.chat-input-area');
        if (!area) return;
        el = document.createElement('div');
        el.id = 'scTyping';
        el.style.cssText = 'padding:3px 14px;font-size:11px;color:#64748b;font-style:italic;';
        area.parentNode.insertBefore(el, area);
    }
    el.textContent = '✏️ ' + name + ' is typing...';
    clearTimeout(window.__scTf);
    window.__scTf = setTimeout(function() { el.textContent = ''; }, 3000);
}

function scPresence() {
    function beat() {
        try {
            supabaseClient.from('presence').upsert([{
                id: SC.id, shop_id: SC.shop, user_name: SC.name, role: SC.role,
                last_seen: new Date().toISOString()
            }], { onConflict: 'id' }).then(function(){});
        } catch(e) {}
    }
    beat();
    setInterval(beat, 30000);
}

// ================================================================
// 🚀 PART 8 — BOOT (watchdog: bar + wire + re-render, forever)
// ================================================================
function scBoot() {
    scInit();

    document.addEventListener('touchstart', function unlock() {
        try {
            window.__scRingCtx = window.__scRingCtx || new (window.AudioContext || window.webkitAudioContext)();
            window.__scRingCtx.resume();
        } catch(e) {}
    }, { once: true });

    scWire();
    scPresence();
    window.__scIceBuffer = [];

    var chatWasOpen = false;

    setInterval(function() {
        try {
            scWire();
            var area = document.querySelector('.chat-input-area');
            var c = document.getElementById('chatMessages') || document.getElementById('adminChatMessages');
            var open = c && c.offsetParent !== null;
            if (area && area.offsetParent !== null) scBuildBar();
            if (open && !chatWasOpen) { chatWasOpen = true; scRerender(); }
            else if (!open) { chatWasOpen = false; }
            var ti = document.getElementById('scText');
            if (ti && !ti.getAttribute('data-sc-typing')) {
                ti.setAttribute('data-sc-typing', '1');
                ti.addEventListener('input', function() { if (ti.value) scTypingPing(); });
            }
        } catch(e) {}
    }, 1500);

    // 📞 CALL CHANNEL — broadcast (instant, no database)
    window.__scCallChannel = supabaseClient.channel('calls-' + SC.shop);
    window.__scCallChannel
        .on('broadcast', { event: 'sc-signal' }, function(msg) {
            var s = msg.payload;
            if (!s) return;
            if (String(s.from_id) === String(SC.id)) return;
            var forMe = (String(s.to_id) === String(SC.id)) || (String(s.to_id) === String(SC.role)) || (String(s.to_id) === 'All');
            if (!forMe) return;

            if (s.type === 'ring') {
                scIncoming(s);
            }
            else if (s.type === 'typing') {
                scShowTyping(s.from_name || 'Someone');
            }
            else if (s.type === 'offer') {
                if (document.getElementById('scIncomingUI')) {
                    SC.pendingOffer = s;
                } else if (document.getElementById('scCallUI')) {
                    scHandleOffer(s);
                }
            }
            else if (s.type === 'answer') {
                if (SC.pc && SC.pc.signalingState !== 'stable') {
                    SC.pc.setRemoteDescription(new RTCSessionDescription(s.data.sdp)).then(function() {
                        if (window.__scIceBuffer && window.__scIceBuffer.length > 0) {
                            var buf = window.__scIceBuffer;
                            window.__scIceBuffer = [];
                            buf.forEach(function(c) {
                                try { SC.pc.addIceCandidate(c).catch(function(){}); } catch(e) {}
                            });
                        }
                    }).catch(function(e) {});
                }
            }
            else if (s.type === 'ice') {
                // 🎯 THE CRITICAL FIX: BUFFER if no connection, APPLY if ready
                if (SC.pc && SC.pc.remoteDescription) {
                    try { SC.pc.addIceCandidate(s.data.candidate).catch(function(){}); } catch(e) {}
                } else {
                    window.__scIceBuffer.push(s.data.candidate);
                }
            }
            else if (s.type === 'hangup') {
                scEnd(false);
            }
        })
        .subscribe();
}
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(scBoot, 2000);
} else {
    document.addEventListener('DOMContentLoaded', () => setTimeout(scBoot, 2000));
}


// 🖼️ LIGHTBOX — in-page fullscreen image viewer (NO blank page!)
function scLightbox(imgId) {
    var img = document.getElementById(imgId);
    if (!img) return;
    var src = img.getAttribute('data-media');

    var lb = document.createElement('div');
    lb.id = 'scLightbox';
    lb.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.95);z-index:2147483000;display:flex;align-items:center;justify-content:center;flex-direction:column;';
    lb.innerHTML =
        '<img src="' + src + '" style="max-width:95%;max-height:80vh;border-radius:8px;">' +
        '<button style="margin-top:20px;padding:12px 30px;border:none;border-radius:10px;background:#ef4444;color:white;font-weight:bold;font-size:16px;cursor:pointer;">✖ Close</button>';
    document.body.appendChild(lb);

    lb.querySelector('button').onclick = function() { lb.remove(); };
    lb.onclick = function(e) { if (e.target === lb) lb.remove(); };
}
