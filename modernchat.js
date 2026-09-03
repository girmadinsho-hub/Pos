/* ================================================================
   📞 LIVE CALLS — WebRTC voice & video, device-to-device
   Works on normal networks AND VPN/restricted networks (TURN relay).
   Rides your existing staff identity system.
   ================================================================ */

var LC = {
    pc: null, localStream: null, remoteId: null, remoteName: '',
    isVideo: false, calling: false, incoming: false,
    myRole: null, myId: null, myName: null
};

function lcIdentity() {
    if (typeof currentCashier !== 'undefined' && currentCashier) {
        LC.myId = currentCashier.id; LC.myName = currentCashier.name; LC.myRole = currentCashier.position || 'Cashier';
    } else if (localStorage.getItem('kitchenChefId')) {
        LC.myId = localStorage.getItem('kitchenChefId'); LC.myName = localStorage.getItem('kitchenChefName'); LC.myRole = 'Kitchen';
    } else {
        LC.myId = 'admin'; LC.myName = 'Admin'; LC.myRole = 'Admin';
    }
    return LC.myId;
}

function lcShop() {
    try { if (typeof getShopId === 'function') return getShopId(); } catch(e) {}
    if (typeof shopId !== 'undefined' && shopId) return shopId;
    return localStorage.getItem('shopId') || 'default';
}

// ===== 1. START A CALL =====
async function lcCall(toId, toName, video) {
    if (LC.calling || LC.incoming) { alert('Already in a call!'); return; }
    lcIdentity();
    LC.remoteId = toId; LC.remoteName = toName || 'Staff'; LC.isVideo = video; LC.calling = true;

    try {
        LC.localStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: video ? { facingMode: 'user', width: 320 } : false
        });
    } catch(e) {
        LC.calling = false;
        alert('🎤 Microphone' + (video ? '/camera' : '') + ' blocked! Allow access in browser settings.');
        return;
    }

    lcShowCallUI('calling', '📞 Calling ' + LC.remoteName + '...', video);
    await lcSignal(toId, 'ring', { video: video, fromName: LC.myName, fromRole: LC.myRole });
    await lcStartPeer(toId, true);
}

// ===== 2. WebRTC connection (global-ready) =====
async function lcStartPeer(peerId, makeOffer) {
    lcCleanup(false);
    LC.pc = new RTCPeerConnection({
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'turn:openrelay.metered.ca:80',  username: 'openrelayproject', credential: 'openrelayproject' },
            { urls: 'turn:openrelay.metered.ca:443', username: 'openrelayproject', credential: 'openrelayproject' },
            { urls: 'turn:openrelay.metered.ca:443?transport=tcp', username: 'openrelayproject', credential: 'openrelayproject' }
        ],
        iceCandidatePoolSize: 4
    });

    if (LC.localStream) {
        LC.localStream.getTracks().forEach(function(t) { LC.pc.addTrack(t, LC.localStream); });
    }

    LC.pc.ontrack = function(event) {
        var stream = event.streams[0];
        var remoteEl = document.getElementById('lcRemoteAudio');
        var remoteVid = document.getElementById('lcRemoteVideo');
        if (remoteEl) { remoteEl.srcObject = stream; remoteEl.play().catch(function(){}); }
        if (LC.isVideo && remoteVid) { remoteVid.srcObject = stream; remoteVid.play().catch(function(){}); }
        if (LC.calling) { LC.calling = false; lcShowCallUI('active', '🟢 ' + LC.remoteName, LC.isVideo); }
    };

    LC.pc.onconnectionstatechange = function() {
        if (LC.pc.connectionState === 'connected') {
            LC.calling = false;
            lcShowCallUI('active', '🟢 ' + LC.remoteName, LC.isVideo);
        }
        if (LC.pc.connectionState === 'failed' || LC.pc.connectionState === 'disconnected') {
            lcEndCall(false);
        }
    };

    LC.pc.onicecandidate = function(event) {
        if (event.candidate) lcSignal(peerId, 'ice', { candidate: event.candidate });
    };

    if (makeOffer) {
        var offer = await LC.pc.createOffer();
        await LC.pc.setLocalDescription(offer);
        await lcSignal(peerId, 'offer', { sdp: LC.pc.localDescription });
    }
}

// ===== 3. Signaling through Supabase =====
async function lcSignal(toId, type, payload) {
    try {
        await supabaseClient.from('call_signals').insert([{
            shop_id: lcShop(),
            from_id: LC.myId, from_name: LC.myName, from_role: LC.myRole,
            to_id: toId, type: type, data: payload,
            created_at: new Date().toISOString()
        }]);
    } catch(e) { console.warn('lcSignal failed:', e.message); }
}

// ===== 4. LISTEN for incoming calls =====
function lcListen() {
    lcIdentity();
    if (window.lcChannel) return;
    window.lcChannel = supabaseClient.channel('calls-' + lcShop())
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'call_signals', filter: `shop_id=eq.${lcShop()}` },
            function(payload) {
                var sig = payload.new;
                var forMe = (sig.to_id === LC.myId) ||
                            (sig.to_id === LC.myRole) ||
                            (sig.to_id === 'All' && sig.from_id !== LC.myId);
                if (!forMe) return;

                switch (sig.type) {
                    case 'ring':    lcIncomingRing(sig); break;
                    case 'offer':   lcHandleOffer(sig); break;
                    case 'answer':  lcHandleAnswer(sig); break;
                    case 'ice':     lcHandleIce(sig); break;
                    case 'decline': lcCallDeclined(); break;
                    case 'hangup':  lcEndCall(false); break;
                }
            }).subscribe();
}

// ===== 5. INCOMING CALL UI =====
async function lcIncomingRing(sig) {
    if (LC.calling || LC.incoming) return;
    LC.incoming = true;
    LC.remoteId = sig.from_id;
    LC.remoteName = sig.from_name;
    LC.isVideo = (sig.data && sig.data.video) || false;

    try { if (typeof playAlert === 'function') playAlert(); } catch(e) {}
    try { if (navigator.vibrate) navigator.vibrate([300,150,300,150,300]); } catch(e) {}

    var ui = document.createElement('div');
    ui.id = 'lcIncomingUI';
    ui.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,.95);z-index:99998;display:flex;flex-direction:column;align-items:center;justify-content:center;color:white;';
    ui.innerHTML =
        '<div style="font-size:60px;margin-bottom:10px;animation:lcPulse 1s infinite;">' + (LC.isVideo ? '📹' : '📞') + '</div>' +
        '<h2 style="margin-bottom:5px;">' + LC.remoteName + ' is calling...</h2>' +
        '<p style="color:#94a3b8;margin-bottom:30px;">' + (LC.isVideo ? 'Video call' : 'Voice call') + '</p>' +
        '<div style="display:flex;gap:20px;">' +
        '<button id="lcAcceptBtn" style="width:70px;height:70px;border-radius:50%;border:none;background:#10b981;color:white;font-size:30px;cursor:pointer;">✅</button>' +
        '<button id="lcDeclineBtn" style="width:70px;height:70px;border-radius:50%;border:none;background:#ef4444;color:white;font-size:30px;cursor:pointer;">❌</button>' +
        '</div>' +
        '<style>@keyframes lcPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.15)}}</style>';
    document.body.appendChild(ui);

    document.getElementById('lcAcceptBtn').onclick = async function() {
        ui.remove();
        await lcAcceptCall();
    };
    document.getElementById('lcDeclineBtn').onclick = function() {
        ui.remove();
        LC.incoming = false;
        lcSignal(LC.remoteId, 'decline', {});
        if (typeof showFloatingToast === 'function') showFloatingToast('📵 Call declined', true);
    };

    setTimeout(function() {
        if (LC.incoming && document.getElementById('lcIncomingUI')) {
            document.getElementById('lcIncomingUI').remove();
            LC.incoming = false;
        }
    }, 30000);
}

async function lcAcceptCall() {
    try {
        LC.localStream = await navigator.mediaDevices.getUserMedia({
            audio: true, video: LC.isVideo
        });
    } catch(e) {
        alert('🎤 Mic blocked — cannot answer!');
        lcSignal(LC.remoteId, 'decline', {});
        LC.incoming = false; return;
    }
    LC.incoming = false;
    lcShowCallUI('active', '🟢 ' + LC.remoteName, LC.isVideo);
    await lcStartPeer(LC.remoteId, false);
}

// ===== 6. WebRTC handshake handlers =====
async function lcHandleOffer(sig) {
    if (!LC.pc) await lcStartPeer(sig.from_id, false);
    try {
        await LC.pc.setRemoteDescription(new RTCSessionDescription(sig.data.sdp));
        var answer = await LC.pc.createAnswer();
        await LC.pc.setLocalDescription(answer);
        await lcSignal(sig.from_id, 'answer', { sdp: LC.pc.localDescription });
    } catch(e) { console.warn('Offer handling failed:', e.message); }
}

async function lcHandleAnswer(sig) {
    try {
        if (LC.pc && LC.pc.signalingState !== 'stable') {
            await LC.pc.setRemoteDescription(new RTCSessionDescription(sig.data.sdp));
        }
    } catch(e) { console.warn('Answer handling failed:', e.message); }
}

async function lcHandleIce(sig) {
    try { if (LC.pc) await LC.pc.addIceCandidate(sig.data.candidate); } catch(e) {}
}

function lcCallDeclined() {
    lcCleanup(true);
    if (typeof showFloatingToast === 'function') showFloatingToast('📵 ' + (LC.remoteName || 'They') + ' declined the call', true);
    else alert('📵 Call declined');
    LC.calling = false;
}

// ===== 7. ACTIVE CALL UI =====
function lcShowCallUI(state, title, video) {
    var existing = document.getElementById('lcCallUI');
    if (existing) existing.remove();

    var ui = document.createElement('div');
    ui.id = 'lcCallUI';
    ui.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,.97);z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center;color:white;';

    ui.innerHTML =
        '<video id="lcRemoteVideo" autoplay playsinline style="' + (video ? 'width:90%;max-width:400px;border-radius:16px;background:#000;' : 'display:none;') + '"></video>' +
        '<audio id="lcRemoteAudio" autoplay style="display:none;"></audio>' +
        '<h2 style="margin:15px 0 5px;">' + title + '</h2>' +
        (state === 'calling' ? '<p style="color:#94a3b8;">Ring... ring...</p>' : '') +
        '<div style="display:flex;gap:16px;margin-top:25px;">' +
        (state === 'active' ?
            '<button id="lcMuteBtn" style="width:60px;height:60px;border-radius:50%;border:none;background:#64748b;color:white;font-size:24px;cursor:pointer;">🎙️</button>' +
            (video ? '<button id="lcCamBtn" style="width:60px;height:60px;border-radius:50%;border:none;background:#64748b;color:white;font-size:24px;cursor:pointer;">📷</button>' : '') : '') +
        '<button id="lcEndBtn" style="width:70px;height:70px;border-radius:50%;border:none;background:#ef4444;color:white;font-size:28px;cursor:pointer;">📵</button>' +
        '</div>' +
        '<video id="lcLocalVideo" autoplay playsinline muted style="' + (video ? 'position:absolute;top:15px;right:15px;width:100px;border-radius:10px;border:2px solid rgba(255,255,255,.3);' : 'display:none;') + '"></video>';

    document.body.appendChild(ui);

    if (video && LC.localStream) {
        var lv = document.getElementById('lcLocalVideo');
        if (lv) lv.srcObject = LC.localStream;
    }

    document.getElementById('lcEndBtn').onclick = function() { lcEndCall(true); };
    var muteBtn = document.getElementById('lcMuteBtn');
    if (muteBtn) muteBtn.onclick = function() {
        var track = LC.localStream.getAudioTracks()[0];
        if (track) { track.enabled = !track.enabled; muteBtn.textContent = track.enabled ? '🎙️' : '🔇'; }
    };
    var camBtn = document.getElementById('lcCamBtn');
    if (camBtn) camBtn.onclick = function() {
        var track = LC.localStream.getVideoTracks()[0];
        if (track) track.enabled = !track.enabled;
    };
}

// ===== 8. END & CLEANUP =====
function lcEndCall(notify) {
    if (notify && LC.remoteId) lcSignal(LC.remoteId, 'hangup', {});
    lcCleanup(true);
    LC.calling = false; LC.incoming = false; LC.remoteId = null;
}

function lcCleanup(removeUI) {
    if (LC.pc) { try { LC.pc.close(); } catch(e) {} LC.pc = null; }
    if (LC.localStream) { LC.localStream.getTracks().forEach(function(t) { t.stop(); }); LC.localStream = null; }
    if (removeUI) {
        var ui = document.getElementById('lcCallUI');
        if (ui) ui.remove();
        var inc = document.getElementById('lcIncomingUI');
        if (inc) inc.remove();
    }
}

// ===== 9. CALL BUTTONS in chat (bulletproof — keeps trying) =====
function lcAddCallButtons() {
    var bar = document.getElementById('smartChatBar');
    if (!bar || document.getElementById('lcVoiceCallBtn')) return;

    var voiceBtn = document.createElement('button');
    voiceBtn.id = 'lcVoiceCallBtn';
    voiceBtn.title = 'Voice call';
    voiceBtn.style.cssText = 'width:36px;height:36px;min-width:36px;border:none;border-radius:50%;background:#059669;color:white;font-size:15px;cursor:pointer;flex-shrink:0;align-self:flex-end;';
    voiceBtn.textContent = '📞';
    voiceBtn.onclick = function() { lcCallFromChat(false); };
    bar.insertBefore(voiceBtn, bar.firstChild);

    var videoBtn = document.createElement('button');
    videoBtn.id = 'lcVideoCallBtn';
    videoBtn.title = 'Video call';
    videoBtn.style.cssText = 'width:36px;height:36px;min-width:36px;border:none;border-radius:50%;background:#7c3aed;color:white;font-size:15px;cursor:pointer;flex-shrink:0;align-self:flex-end;';
    videoBtn.textContent = '📹';
    videoBtn.onclick = function() { lcCallFromChat(true); };
    bar.insertBefore(videoBtn, voiceBtn);
}

// 🔄 Persistent watcher: re-attach whenever the bar exists but buttons don't
setInterval(function() {
    try {
        var bar = document.getElementById('smartChatBar');
        if (bar && !document.getElementById('lcVoiceCallBtn')) lcAddCallButtons();
    } catch(e) {}
}, 2000);
function lcCallFromChat(video) {
    var sel = document.getElementById('chatRecipient') || document.getElementById('adminChatRecipient');
    if (!sel) { alert('Open a chat with a person first.'); return; }
    var val = sel.value;
    var name = sel.options[sel.selectedIndex].text.replace('👤 ', '').replace('🟢 ', '');

    if (val === 'All') { alert('⚠️ Calls need a specific person.\nPick someone from the Direct Message list.'); return; }
    if (val === 'Kitchen' || val === 'Cashier' || val === 'Admin') { alert('⚠️ Pick a specific person for calls.'); return; }

    lcCall(val, name, video);
}

// ===== 10. AUTO-START =====
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
        try { lcListen(); } catch(e) { console.warn('Call listener failed:', e); }
        var iv = setInterval(function() {
            if (document.getElementById('smartChatBar')) {
                lcAddCallButtons();
                clearInterval(iv);
            }
        }, 1500);
    }, 2000);
});
