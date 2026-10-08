/* ================================================================
   💬 SMARTCOM v2 — the complete communication system. ONE file.
   Text + Voice + Photos + Files + Voice/Video Calls (WebRTC)
   + Reactions + Replies + Read Receipts + Presence + Typing
   + Emoji Picker + Forward-to-WhatsApp + Location Share
   + Missed Call Messages + Call Controls + Unread Badge
   + Message Search + Star Messages + Speed Control
   Works in: POS, Kitchen, Hotel, v3 Admin, v4 Admin (auto-detect).
   ================================================================ */

var SC = {
    id: null, name: null, role: null, shop: null,
    pc: null, stream: null, peer: null, peerName: '', video: false,
    inCall: false, muted: false, callStart: 0,
    channel: null, booted: false, unread: 0, searchQ: '',
    replyTo: null, presenceMap: {}
};

// ===== WHO AM I / WHERE AM I =====
function scInit() {
    if (typeof currentCashier !== 'undefined' && currentCashier) {
        SC.id = currentCashier.id; SC.name = currentCashier.name; SC.role = currentCashier.position || 'Cashier';
    } else if (localStorage.getItem('kitchenChefId')) {
        SC.id = localStorage.getItem('kitchenChefId'); SC.name = localStorage.getItem('kitchenChefName'); SC.role = 'Kitchen';
    } else if (localStorage.getItem('hotelStaffId')) {
        SC.id = localStorage.getItem('hotelStaffId'); SC.name = localStorage.getItem('hotelStaffName'); SC.role = localStorage.getItem('hotelPosition') || 'Staff';
    } else {
        SC.id = 'admin'; SC.name = 'Admin'; SC.role = 'Admin';
    }
    try { SC.shop = (typeof getShopId === 'function') ? getShopId() : null; } catch(e) { SC.shop = null; }
    if (!SC.shop) SC.shop = localStorage.getItem('shopId') || localStorage.getItem('kitchenShopId') || 'default';
}

// ===== ENVIRONMENT DETECTION =====
function scIsV4() {
    return !!document.getElementById('v4cmMessages') || !!document.getElementById('tab19');
}
function scContainer() {
    return document.getElementById('scChatMessages') ||
           document.getElementById('chatMessages') ||
           document.getElementById('adminChatMessages') ||
           document.getElementById('v4cmMessages');
}
function scInputArea() {
    return document.querySelector('.chat-input-area') ||
           document.getElementById('scInputArea');
}
function scRecipientSelect() {
    return document.getElementById('chatRecipient') ||
           document.getElementById('adminChatRecipient') ||
           document.getElementById('scRecipient');
}

// ================================================================
// 🎨 PART 1 — THE SMART INPUT BAR
// ================================================================
function scBuildBar() {
    var area = scInputArea();
    if (!area || document.getElementById('scBar')) return;

    var oldRow = area.querySelector('div[style*="display: flex"]');
    if (oldRow && !oldRow.id) oldRow.style.display = 'none';

    var bar = document.createElement('div');
    bar.id = 'scBar';
    bar.style.cssText = 'display:flex;gap:4px;align-items:flex-end;flex-wrap:nowrap;';
    bar.innerHTML =
        '<button id="scEmojiBtn" title="Emoji" style="width:36px;height:36px;min-width:36px;border:none;border-radius:50%;background:#f59e0b;color:white;font-size:16px;cursor:pointer;flex-shrink:0;">😊</button>' +
        '<button id="scCallBtn" title="Voice call" style="width:36px;height:36px;min-width:36px;border:none;border-radius:50%;background:#059669;color:white;font-size:15px;cursor:pointer;flex-shrink:0;">📞</button>' +
        '<button id="scVideoBtn" title="Video call" style="width:36px;height:36px;min-width:36px;border:none;border-radius:50%;background:#7c3aed;color:white;font-size:15px;cursor:pointer;flex-shrink:0;">📹</button>' +
        '<button id="scPhotoBtn" title="Send photo" style="width:36px;height:36px;min-width:36px;border:none;border-radius:50%;background:#7c3aed;color:white;font-size:14px;cursor:pointer;flex-shrink:0;">📷</button>' +
        '<button id="scFileBtn" title="Send file" style="width:36px;height:36px;min-width:36px;border:none;border-radius:50%;background:#0891b2;color:white;font-size:14px;cursor:pointer;flex-shrink:0;">📎</button>' +
        '<button id="scLocBtn" title="Share location" style="width:36px;height:36px;min-width:36px;border:none;border-radius:50%;background:#10b981;color:white;font-size:14px;cursor:pointer;flex-shrink:0;">📍</button>' +
        '<button id="scMicBtn" title="Hold to record" style="width:36px;height:36px;min-width:36px;border:none;border-radius:50%;background:#ef4444;color:white;font-size:14px;cursor:pointer;flex-shrink:0;">🎤</button>' +
        '<div style="flex:1;min-width:0;position:relative;">' +
        '<textarea id="scText" rows="1" placeholder="Message..." style="width:100%;box-sizing:border-box;padding:9px 42px 9px 12px;border:1px solid #cbd5e1;border-radius:18px;font-size:14px;outline:none;resize:none;line-height:1.4;max-height:100px;background:#fff;color:#1e293b;font-family:inherit;display:block;">' +
        (SC.replyTo ? '↩ Replying: ' + SC.replyTo.message.substring(0, 30) + '...\n' : '') + '</textarea>' +
        (SC.replyTo ? '<div id="scReplyBar" style="background:#eff6ff;border-radius:8px;padding:4px 10px;font-size:11px;color:#2563eb;margin-bottom:2px;">↩ Replying to <b>' + (SC.replyTo.sender_name || '?') + '</b> <span onclick="scClearReply()" style="float:right;cursor:pointer;color:#ef4444;">✖</span></div>' : '') +
        '<button id="scSendBtn" style="position:absolute;right:3px;bottom:3px;width:30px;height:30px;border:none;border-radius:50%;background:#2563eb;color:white;font-size:12px;font-weight:bold;cursor:pointer;">➤</button>' +
        '</div>';
    area.appendChild(bar);

    document.getElementById('scSendBtn').onclick = function() {
        var ti = document.getElementById('scText');
        var txt = ti.value.trim();
        // strip reply prefix if present
        if (SC.replyTo && txt.indexOf('↩ Replying:') === 0) {
            txt = txt.split('\n').slice(1).join('\n').trim();
        }
        if (!txt) return;
        ti.value = ''; ti.style.height = 'auto';
        var reply = SC.replyTo; scClearReply();
        scSend({ message: txt, media_type: null, media_data: null, media_duration: null, reply_to: reply });
    };
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

    // Emoji picker
    document.getElementById('scEmojiBtn').onclick = function() { scEmojiToggle(); };

    // Photo
    document.getElementById('scPhotoBtn').onclick = function() {
        var fi = document.createElement('input');
        fi.type = 'file'; fi.accept = 'image/*';
        fi.onchange = function() { if (this.files && this.files[0]) scPhoto(this.files[0]); };
        fi.click();
    };
    // File
    document.getElementById('scFileBtn').onclick = function() {
        var fi = document.createElement('input');
        fi.type = 'file';
        fi.onchange = function() { scFile(this.files[0]); };
        fi.click();
    };
    // Location
    document.getElementById('scLocBtn').onclick = function() { scShareLocation(); };

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
function scClearReply() {
    SC.replyTo = null;
    var rb = document.getElementById('scReplyBar');
    if (rb) rb.remove();
    var ti = document.getElementById('scText');
    if (ti && ti.value.indexOf('↩ Replying:') === 0) ti.value = '';
}

// ================================================================
// 😊 EMOJI PICKER
// ================================================================
function scEmojiToggle() {
    var old = document.getElementById('scEmojiPanel');
    if (old) { old.remove(); return; }
    var emojis = ['😀','😂','🥰','😎','🤔','😢','😡','👍','👎','❤️','🔥','👏','🙏','💪','🎉','✅','❌','📢','📱','💰','🍽️','☕','🛒','📦','⏰','🚨','💡','🤝','📞','🛏️'];
    var p = document.createElement('div');
    p.id = 'scEmojiPanel';
    p.style.cssText = 'position:absolute;bottom:45px;left:0;right:0;background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:8px;display:flex;flex-wrap:wrap;gap:4px;z-index:100;box-shadow:0 -4px 12px rgba(0,0,0,.15);';
    emojis.forEach(function(em) {
        var b = document.createElement('button');
        b.textContent = em;
        b.style.cssText = 'font-size:22px;padding:6px;border:none;background:none;border-radius:8px;cursor:pointer;width:38px;height:38px;';
        b.onclick = function() {
            var ti = document.getElementById('scText');
            if (ti) { ti.value += em; ti.focus(); }
        };
        p.appendChild(b);
    });
    var parent = document.getElementById('scBar');
    if (parent) parent.appendChild(p);
    else document.body.appendChild(p);
    setTimeout(function() {
        document.addEventListener('click', function close(e) {
            if (!p.contains(e.target) && e.target.id !== 'scEmojiBtn') { p.remove(); document.removeEventListener('click', close); }
        });
    }, 100);
}

// ================================================================
// 📍 LOCATION SHARE
// ================================================================
function scShareLocation() {
    if (!navigator.geolocation) { alert('GPS not supported.'); return; }
    var btn = document.getElementById('scLocBtn');
    if (btn) { btn.textContent = '⏳'; btn.disabled = true; }
    navigator.geolocation.getCurrentPosition(function(pos) {
        if (btn) { btn.textContent = '📍'; btn.disabled = false; }
        var lat = pos.coords.latitude.toFixed(6);
        var lng = pos.coords.longitude.toFixed(6);
        var mapUrl = 'https://maps.google.com/?q=' + lat + ',' + lng;
        scSend({ message: '📍 My location: ' + mapUrl, media_type: null, media_data: null, media_duration: null });
    }, function(err) {
        if (btn) { btn.textContent = '📍'; btn.disabled = false; }
        alert('❌ Could not get location: ' + err.message);
    }, { timeout: 10000, enableHighAccuracy: true });
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
            if (ti) ti.placeholder = '🔴 Recording ' + scT + 's...';
            if (scT >= 120) scRecStop();   // 🆕 2 min limit (was 60s)
        }, 1000);
        try { if (navigator.vibrate) navigator.vibrate(50); } catch(e) {}
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
            if (rd.result.length > 1500000) { alert('Too long! Max ~2 minutes.'); return; }
            scSend({ message: '🎤 Voice (' + dur + 's)', media_type: 'voice', media_data: rd.result, media_duration: dur + 's' });
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
            var sc = Math.min(1, 480 / img.width);
            cv.width = img.width * sc; cv.height = img.height * sc;
            cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
            var b64 = cv.toDataURL('image/jpeg', 0.65);
            if (b64.length > 800000) { alert('Photo too large.'); return; }
            scSend({ message: '📷 Photo', media_type: 'photo', media_data: b64, media_duration: null });
        };
        img.src = e.target.result;
    };
    rd.readAsDataURL(file);
}

// ================================================================
// 📎 PART 4 — FILE (max 2MB — was 1MB)
// ================================================================
function scFile(file) {
    if (!file) return;
    if (file.size > 2000000) { alert('File too large! Max 2 MB.'); return; }
    var rd = new FileReader();
    rd.onloadend = function() {
        if (rd.result.length > 2800000) { alert('File too large after encoding.'); return; }
        scSend({
            message: '📎 ' + file.name,
            media_type: 'file',
            media_data: rd.result,
            media_duration: (file.size / 1024).toFixed(0) + 'KB'
        });
    };
    rd.readAsDataURL(file);
}

// ================================================================
// 📤 PART 5 — SEND (all types + reply support)
// ================================================================
function scSend(p) {
    var sel = scRecipientSelect();
    var val = sel ? sel.value : 'All';
    var nm = sel ? sel.options[sel.selectedIndex].text.replace('👤 ', '').replace('🟢 ', '') : 'Everyone';

    var msg = {
        shop_id: SC.shop,
        message: p.message,
        media_type: p.media_type, media_data: p.media_data, media_duration: p.media_duration,
        sender_name: SC.name, sender_id: SC.id, sender_role: SC.role,
        recipient: 'All',
        read_by: JSON.stringify([SC.id])   // 🆕 sender has read it
    };
    if (p.reply_to) {
        msg.reply_to_id = p.reply_to.id;
    }
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
// 🎨 PART 6 — BUBBLE RENDERER (all media + reactions + replies + read receipts)
// ================================================================
function scBubble(msg) {
    var container = scContainer();
    if (!container) return;

    var isMe = (msg.sender_id && String(msg.sender_id) === String(SC.id)) ||
               (msg.sender_name === SC.name) ||
               (!SC.id && msg.sender_name === 'Admin');

    var forMe = isMe || msg.recipient === 'All' || msg.recipient === SC.role ||
                (msg.recipient_id && String(msg.recipient_id) === String(SC.id));
    if (!forMe) return;

    // 🆕 mark as read (if not mine and not already read)
    if (!isMe && msg.read_by) {
        try {
            var rb = typeof msg.read_by === 'string' ? JSON.parse(msg.read_by) : (msg.read_by || []);
            if (rb.indexOf(SC.id) === -1) {
                rb.push(SC.id);
                supabaseClient.from('chat_messages').update({ read_by: JSON.stringify(rb) }).eq('id', msg.id).then(function(){});
            }
        } catch(e) {}
    }

    var b = document.createElement('div');
    b.className = 'chat-bubble ' + (isMe ? 'sent' : 'received');
    b.style.position = 'relative';
    b.style.maxWidth = '85%';
    var ts = new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
    var tag = '';
    if (!isMe) {
        if (msg.recipient === 'Direct' && msg.recipient_name) tag = ' ➡️ You';
        else if (msg.recipient !== 'All') tag = ' ➡️ ' + msg.recipient;
    }

    // 🆕 read receipt: ✓✓ if others read my message
    var readMark = '';
    if (isMe && msg.read_by) {
        try {
            var rbArr = typeof msg.read_by === 'string' ? JSON.parse(msg.read_by) : (msg.read_by || []);
            if (rbArr.length > 1) readMark = ' ✓✓';   // at least one other person read it
            else readMark = ' ✓';
        } catch(e) {}
    }

    var in_ = '';

    // reply quote
    var replyQuote = '';
    if (msg.reply_to_msg) {
        replyQuote = '<div style="background:rgba(0,0,0,.08);border-left:3px solid #94a3b8;padding:4px 8px;border-radius:4px;font-size:11px;margin-bottom:4px;opacity:.7;overflow:hidden;max-height:40px;">↩ ' + sanitize(msg.reply_to_msg.sender_name || '?') + ': ' + sanitize(String(msg.reply_to_msg.message || '').substring(0, 60)) + '</div>';
    }

    // 1️⃣ VOICE — audio player with speed control
    if (msg.media_type === 'voice' && msg.media_data) {
        var vid = 'va_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
        in_ = replyQuote + '<div style="display:flex;align-items:center;gap:6px;min-width:180px;">' +
            '<span style="font-size:22px;">🎤</span>' +
            '<audio id="' + vid + '" controls preload="metadata" src="' + msg.media_data + '" style="height:36px;flex:1;max-width:150px;"></audio>' +
            '<button onclick="scVoiceSpeed(\'' + vid + '\')" style="font-size:9px;font-weight:800;padding:3px 6px;border:none;border-radius:6px;background:rgba(255,255,255,.2);color:inherit;cursor:pointer;" title="Speed">1×</button>' +
            '</div>' +
            '<small style="display:block;margin-top:3px;">' + msg.sender_name + ' • ' + (msg.media_duration || '') + ' • ' + ts + readMark + '</small>';
    }
    // 2️⃣ PHOTO — with lightbox
    else if (msg.media_type === 'photo' && msg.media_data) {
        var pid = 'ph_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
        in_ = replyQuote + '<img src="' + msg.media_data + '" style="max-width:220px;max-height:220px;border-radius:10px;cursor:pointer;display:block;" data-media="' + msg.media_data + '" id="' + pid + '" onclick="scLightbox(\'' + pid + '\')">' +
            '<small style="display:block;margin-top:4px;">' + msg.sender_name + tag + ' • ' + ts + readMark + '</small>';
    }
    // 3️⃣ FILE — downloadable
    else if (msg.media_type === 'file' && msg.media_data) {
        var fname = (msg.message || 'file').replace('📎 ', '');
        var fsize = msg.media_duration || '';
        in_ = replyQuote + '<a href="' + msg.media_data + '" download="' + fname + '" style="display:flex;align-items:center;gap:10px;text-decoration:none;color:inherit;padding:8px 12px;border:1px solid rgba(255,255,255,.3);border-radius:10px;min-width:170px;">' +
            '<span style="font-size:28px;">📎</span>' +
            '<span style="flex:1;min-width:0;"><b style="display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:130px;">' + fname + '</b>' +
            '<small style="opacity:.7;">' + fsize + ' • Tap to download</small></span>' +
            '<span style="font-size:18px;">⬇️</span></a>' +
            '<small style="display:block;margin-top:3px;">' + msg.sender_name + tag + ' • ' + ts + readMark + '</small>';
    }
    // 4️⃣ TEXT
    else {
        // auto-link URLs
        var textHtml = sanitize(msg.message || '');
        textHtml = textHtml.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" style="color:inherit;text-decoration:underline;">$1</a>');
        in_ = replyQuote + textHtml +
            '<small style="display:block;margin-top:3px;">' + msg.sender_name + tag + ' • ' + ts + readMark + '</small>';
    }

    b.innerHTML = in_;

    // 🆕 REACTIONS display
    var reactions = {};
    try { reactions = typeof msg.reactions === 'string' ? JSON.parse(msg.reactions) : (msg.reactions || {}); } catch(e) {}
    var reactionHtml = '';
    Object.keys(reactions).forEach(function(em) {
        var users = reactions[em] || [];
        if (users.length > 0) {
            reactionHtml += '<span style="display:inline-flex;align-items:center;gap:2px;background:rgba(255,255,255,.25);border-radius:10px;padding:1px 6px;font-size:12px;margin-right:3px;cursor:pointer;" onclick="scReact(\'' + msg.id + '\',\'' + em + '\')">' + em + ' ' + users.length + '</span>';
        }
    });
    if (reactionHtml) {
        var rDiv = document.createElement('div');
        rDiv.style.cssText = 'margin-top:3px;';
        rDiv.innerHTML = reactionHtml;
        b.appendChild(rDiv);
    }

    container.appendChild(b);
    container.scrollTop = container.scrollHeight;

    // 🗑 DELETE (hover/long-press)
    var del = document.createElement('button');
    del.textContent = '🗑';
    del.style.cssText = 'position:absolute;top:1px;right:1px;width:22px;height:22px;border:none;border-radius:50%;background:rgba(239,68,68,.9);color:white;font-size:10px;cursor:pointer;display:none;align-items:center;justify-content:center;padding:0;';
    b.appendChild(del);
    b.onmouseenter = function() { del.style.display = 'flex'; };
    b.onmouseleave = function() { del.style.display = 'none'; };
    var pt = null;
    b.addEventListener('touchstart', function() {
        pt = setTimeout(function() { del.style.display = 'flex'; }, 400);
    });
    b.addEventListener('touchend', function() { clearTimeout(pt); });
    del.onclick = async function(e) {
        e.stopPropagation(); e.preventDefault();
        if (!await confirm('Delete this message for EVERYONE?')) return;
        try {
            await supabaseClient.from('chat_messages').delete().eq('id', msg.id);
            b.remove();
        } catch(err) { alert('Delete failed: ' + err.message); }
    };

    // 🆕 REPLY (long-press or double-tap)
    var replyShown = false;
    b.addEventListener('dblclick', function() {
        SC.replyTo = { id: msg.id, message: msg.message, sender_name: msg.sender_name };
        scBuildBar();   // rebuild with reply bar
    });

    // 🆕 FORWARD to WhatsApp (long-press menu alternative)
    var fwd = document.createElement('button');
    fwd.textContent = '📤';
    fwd.style.cssText = 'position:absolute;top:1px;right:26px;width:22px;height:22px;border:none;border-radius:50%;background:#25D366;color:white;font-size:10px;cursor:pointer;display:none;align-items:center;justify-content:center;padding:0;';
    b.appendChild(fwd);
    fwd.onclick = function(e) {
        e.stopPropagation();
        var text = (msg.message || '') + (msg.media_type === 'photo' ? ' [photo]' : '') + (msg.media_type === 'voice' ? ' [voice message]' : '');
        var phone = prompt('Forward to which WhatsApp number?', '');
        if (!phone) return;
        window.open('https://wa.me/' + String(phone).replace(/[^0-9]/g, '') + '?text=' + encodeURIComponent('📤 From SmartShop:\n' + text), '_blank');
    };
    b.onmouseenter = function() { del.style.display = 'flex'; fwd.style.display = 'flex'; };
    b.onmouseleave = function() { del.style.display = 'none'; fwd.style.display = 'none'; };
}

// 🆕 Voice speed control
function scVoiceSpeed(audioId) {
    var a = document.getElementById(audioId);
    if (!a) return;
    if (a.playbackRate === 1) a.playbackRate = 1.5;
    else if (a.playbackRate === 1.5) a.playbackRate = 2;
    else a.playbackRate = 1;
    // update button label
    var btn = a.nextElementSibling;
    if (btn) btn.textContent = a.playbackRate + '×';
}

// 🆕 REACTION handler
async function scReact(msgId, emoji) {
    // fetch current reactions
    try {
        const { data } = await supabaseClient.from('chat_messages').select('reactions').eq('id', msgId).single();
        var reactions = {};
        try { reactions = typeof data.reactions === 'string' ? JSON.parse(data.reactions) : (data.reactions || {}); } catch(e) {}
        if (!reactions[emoji]) reactions[emoji] = [];
        var idx = reactions[emoji].indexOf(SC.id);
        if (idx === -1) reactions[emoji].push(SC.id);
        else reactions[emoji].splice(idx, 1);   // toggle off
        if (reactions[emoji].length === 0) delete reactions[emoji];
        await supabaseClient.from('chat_messages').update({ reactions: JSON.stringify(reactions) }).eq('id', msgId);
        scRerender();   // re-render to show
    } catch(e) { console.warn('React failed:', e.message); }
}

// WIRE — takes over app renderers
function scWire() {
    try {
        window.renderChatBubble = scBubble;
        window.renderAdminChatBubble = scBubble;
        window.v4cmBubble = scBubble;
    } catch(e) {}
}

// RERENDER history
function scRerender() {
    var c = scContainer();
    if (!c) return;
    supabaseClient.from('chat_messages')
        .select('*').eq('shop_id', SC.shop)
        .gte('created_at', new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: true }).limit(150)
        .then(function(r) {
            if (!r.data) return;
            var olds = c.querySelectorAll('.chat-bubble');
            olds.forEach(function(b) { if (b.parentNode) b.remove(); });
            r.data.forEach(function(m) { scBubble(m); });
            c.scrollTop = c.scrollHeight;
        });
}

// ================================================================
// 📞 PART 7 — LIVE CALLS (WebRTC + mute + speaker + timer)
// ================================================================
let __scCallChannel = null;
let __scIceBuffer = [];
let __scRingStop = false;
let __scCallTimer = null;
let __scRingbackInterval = null;
let __scCallDurTimer = null;

function scInitCallChannel() {
    if (__scCallChannel) return;
    __scCallChannel = supabaseClient.channel('calls-' + SC.shop);
    __scCallChannel
        .on('broadcast', { event: 'sc-signal' }, (msg) => scHandleSignal(msg.payload))
        .subscribe();
}

async function scHandleSignal(s) {
    if (!s || String(s.from_id) === String(SC.id)) return;
    const forMe = (String(s.to_id) === String(SC.id)) || (String(s.to_id) === String(SC.role)) || (String(s.to_id) === 'All');
    if (!forMe) return;
    try {
        if (s.type === 'ring') scIncoming(s);
        else if (s.type === 'typing') scShowTyping(s.from_name || 'Someone');
        else if (s.type === 'offer') {
            if (document.getElementById('scIncomingUI')) SC.pendingOffer = s;
            else if (SC.inCall) await scHandleOffer(s);
        }
        else if (s.type === 'answer') {
            if (SC.pc && SC.pc.signalingState !== 'stable') {
                await SC.pc.setRemoteDescription(new RTCSessionDescription(s.data.sdp));
                if (__scIceBuffer.length) {
                    const buf = __scIceBuffer; __scIceBuffer = [];
                    for (const c of buf) { try { await SC.pc.addIceCandidate(c); } catch(e) {} }
                }
            }
        }
        else if (s.type === 'ice') {
            if (SC.pc && SC.pc.remoteDescription) {
                try { await SC.pc.addIceCandidate(s.data.candidate); } catch(e) {}
            } else { __scIceBuffer.push(s.data.candidate); }
        }
        else if (s.type === 'hangup') scEnd(false);
    } catch(e) { console.warn('Signal error:', e); }
}

async function scSig(toId, type, payload) {
    if (!__scCallChannel) return;
    try {
        await __scCallChannel.send({
            type: 'broadcast', event: 'sc-signal',
            payload: { shop_id: SC.shop, from_id: SC.id, from_name: SC.name, to_id: toId, type: type, data: payload }
        });
    } catch(e) { console.warn('Signal send failed:', e.message); }
}

async function scCall(toId, toName, video) {
    if (SC.inCall) { alert('Already in a call!'); return; }
    scInit();
    SC.inCall = true; SC.peer = toId; SC.peerName = toName; SC.video = video; SC.muted = false;
    try {
        SC.stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: video });
    } catch(e) {
        SC.inCall = false;
        alert('🎤/📷 Blocked! Allow access in browser settings.');
        return;
    }
    scCallUI('calling', '📞 Calling ' + toName + '...');
    // Ringback
    __scRingStop = false;
    try {
        const ctx = window.__scRingCtx || new (window.AudioContext || window.webkitAudioContext)();
        window.__scRingCtx = ctx;
        __scRingbackInterval = setInterval(() => {
            if (__scRingStop) { clearInterval(__scRingbackInterval); return; }
            const o = ctx.createOscillator(), g = ctx.createGain();
            o.type = 'sine'; o.frequency.value = 440;
            g.gain.setValueAtTime(0.15, ctx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
            o.connect(g); g.connect(ctx.destination);
            o.start(); o.stop(ctx.currentTime + 0.85);
        }, 2000);
    } catch(e) {}
    await scSig(toId, 'ring', { video: video, fromName: SC.name });
    scPeer(toId, true);
    setTimeout(() => {
        if (SC.inCall && document.getElementById('scCallUI') && !SC.pc.connectionState) scEnd(true);
    }, 40000);
}

function scPeer(peerId, isOfferer) {
    if (SC.pc) { try { SC.pc.close(); } catch(e) {} }
    SC.pc = new RTCPeerConnection({
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'turn:openrelay.metered.ca:80', username: 'openrelayproject', credential: 'openrelayproject' },
            { urls: 'turn:openrelay.metered.ca:443', username: 'openrelayproject', credential: 'openrelayproject' }
        ]
    });
    SC.stream.getTracks().forEach(track => SC.pc.addTrack(track, SC.stream));
    SC.pc.ontrack = (ev) => {
        SC.remoteStream = ev.streams[0];
        __scRingStop = true;
        clearInterval(__scCallTimer); clearInterval(__scRingbackInterval);
        const h2 = document.querySelector('#scCallUI h2');
        if (h2) h2.textContent = '🟢 ' + SC.peerName;
        // 🆕 start duration timer
        SC.callStart = Date.now();
        if (__scCallDurTimer) clearInterval(__scCallDurTimer);
        __scCallDurTimer = setInterval(() => {
            var el = document.getElementById('scCallTimer');
            if (el) {
                var secs = Math.floor((Date.now() - SC.callStart) / 1000);
                var mm = String(Math.floor(secs / 60)).padStart(2, '0');
                var ss = String(secs % 60).padStart(2, '0');
                el.textContent = mm + ':' + ss;
            }
        }, 1000);
        const audio = document.getElementById('scRemoteAudio');
        const video = document.getElementById('scRemoteVideo');
        if (audio) {
            audio.srcObject = SC.remoteStream; audio.volume = 1.0;
            audio.play().catch(() => {
                const btn = document.createElement('button');
                btn.textContent = '🔊 TAP TO HEAR';
                btn.style.cssText = 'padding:12px 24px;border:none;border-radius:10px;background:#2563eb;color:white;font-weight:bold;font-size:16px;cursor:pointer;';
                btn.onclick = () => { audio.play(); btn.remove(); };
                audio.parentNode.appendChild(btn);
            });
        }
        if (video) { video.srcObject = SC.remoteStream; video.play().catch(() => {}); }
    };
    SC.pc.onicecandidate = (ev) => { if (ev.candidate) scSig(peerId, 'ice', { candidate: ev.candidate }); };
    SC.pc.onconnectionstatechange = () => {
        if (SC.pc.connectionState === 'failed' || SC.pc.connectionState === 'disconnected') scEnd(false);
    };
    if (isOfferer) {
        SC.pc.createOffer()
            .then(offer => SC.pc.setLocalDescription(offer))
            .then(() => scSig(peerId, 'offer', { sdp: SC.pc.localDescription }))
            .catch(e => console.warn('Offer failed:', e.message));
    }
}

async function scHandleOffer(s) {
    if (!SC.stream) {
        try { SC.stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: SC.video }); }
        catch(e) {
            // 🆕 missed call message
            scSend({ message: '📞 Missed call from ' + SC.peerName + ' (mic blocked)', media_type: null, media_data: null, media_duration: null });
            scSig(SC.peer, 'hangup', {}); scEnd(false); return;
        }
    }
    if (!SC.pc) scPeer(SC.peer, false);
    try {
        await SC.pc.setRemoteDescription(new RTCSessionDescription(s.data.sdp));
        const answer = await SC.pc.createAnswer();
        await SC.pc.setLocalDescription(answer);
        await scSig(s.from_id, 'answer', { sdp: SC.pc.localDescription });
        if (__scIceBuffer.length) {
            const buf = __scIceBuffer; __scIceBuffer = [];
            for (const c of buf) { try { await SC.pc.addIceCandidate(c); } catch(e) {} }
        }
    } catch(e) { console.warn('Answer failed:', e.message); }
}

function scIncoming(s) {
    if (SC.inCall) return;
    scInit();
    SC.inCall = true; SC.peer = s.from_id; SC.peerName = s.from_name;
    SC.video = (s.data && s.data.video) || false; SC.muted = false;
    try { if (navigator.vibrate) navigator.vibrate([400,200,400,200,400,200,400]); } catch(e) {}
    __scRingStop = false;
    try {
        const ctx = window.__scRingCtx || new (window.AudioContext || window.webkitAudioContext)();
        window.__scRingCtx = ctx;
        function ringOnce() {
            if (__scRingStop) return;
            [0, 0.35].forEach(offset => {
                const o = ctx.createOscillator(), g = ctx.createGain();
                o.type = 'sine'; o.frequency.value = 880;
                const o2 = ctx.createOscillator(), g2 = ctx.createGain();
                o2.type = 'sine'; o2.frequency.value = 1245;
                const t = ctx.currentTime + offset;
                g.gain.setValueAtTime(0.4, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
                g2.gain.setValueAtTime(0.25, t); g2.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
                o.connect(g); g.connect(ctx.destination);
                o2.connect(g2); g2.connect(ctx.destination);
                o.start(t); o.stop(t + 0.3); o2.start(t); o2.stop(t + 0.3);
            });
        }
        window.__scRingInterval = setInterval(() => {
            if (__scRingStop) { clearInterval(window.__scRingInterval); return; }
            ringOnce();
        }, 2000);
        ringOnce();
    } catch(e) {}
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
    document.getElementById('scYes').addEventListener('click', async (ev) => {
        ev.stopPropagation(); ev.preventDefault();
        __scRingStop = true; ui.remove();
        try { SC.stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: SC.video }); }
        catch(e) {
            scSend({ message: '📞 Missed call (mic blocked)', media_type: null, media_data: null, media_duration: null });
            scSig(SC.peer, 'hangup', {}); scEnd(false); return;
        }
        scCallUI('active', '🟢 ' + SC.peerName);
        if (SC.pendingOffer) {
            const offer = SC.pendingOffer; SC.pendingOffer = null;
            await scHandleOffer(offer);
        }
    });
    document.getElementById('scNo').addEventListener('click', (ev) => {
        ev.stopPropagation(); ev.preventDefault();
        __scRingStop = true; ui.remove();
        // 🆕 declined call message
        scSend({ message: '📞 Call declined', media_type: null, media_data: null, media_duration: null });
        scSig(SC.peer, 'hangup', {}); scEnd(false);
    });
    // Auto-miss after 30s
    setTimeout(() => {
        if (document.getElementById('scIncomingUI')) {
            __scRingStop = true; ui.remove();
            // 🆕 missed call message
            scSend({ message: '📞 Missed call from ' + SC.peerName, media_type: null, media_data: null, media_duration: null });
            scSig(SC.peer, 'hangup', {}); scEnd(false);
        }
    }, 30000);
}

function scCallUI(state, title) {
    const old = document.getElementById('scCallUI');
    if (old) old.remove();
    const ui = document.createElement('div');
    ui.id = 'scCallUI';
    ui.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,.98);z-index:2147483000;display:flex;flex-direction:column;align-items:center;justify-content:center;color:white;';

    var inner = '';

    if (SC.video) {
        // 🎥 VIDEO CALL LAYOUT — remote fills screen, local PiP, controls at bottom
        inner =
        '<video id="scRemoteVideo" autoplay playsinline style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;background:#000;z-index:0;"></video>' +
        '<video id="scLocalVideo" autoplay playsinline muted style="position:absolute;top:15px;right:15px;width:110px;height:150px;border-radius:12px;border:2px solid rgba(255,255,255,.5);z-index:2;object-fit:cover;background:#1e293b;cursor:pointer;" title="Tap to switch camera"></video>' +
        '<audio id="scRemoteAudio" autoplay style="display:none;"></audio>' +
        // caller info overlay (top)
        '<div style="position:absolute;top:15px;left:15px;z-index:3;background:rgba(0,0,0,.5);border-radius:12px;padding:8px 14px;">' +
        '<h2 style="margin:0;font-size:17px;">' + title + '</h2>' +
        '<p id="scCallTimer" style="margin:4px 0 0;color:#94a3b8;font-size:13px;">' + (state === 'calling' ? 'Ringing... 0s' : '00:00') + '</p>' +
        '</div>' +
        // controls (bottom)
        '<div style="position:absolute;bottom:30px;left:0;right:0;display:flex;justify-content:center;gap:18px;z-index:3;">' +
        '<button id="scMuteBtn" title="Mute" style="width:55px;height:55px;border-radius:50%;border:none;background:' + (SC.muted ? '#ef4444' : '#334155') + ';color:white;font-size:22px;cursor:pointer;">🎙️</button>' +
        '<button id="scCamBtn" title="Camera on/off" style="width:55px;height:55px;border-radius:50%;border:none;background:#334155;color:white;font-size:22px;cursor:pointer;">📷</button>' +
        '<button id="scSwitchBtn" title="Switch front/back camera" style="width:55px;height:55px;border-radius:50%;border:none;background:#334155;color:white;font-size:22px;cursor:pointer;">🔄</button>' +
        '<button id="scEndBtn" style="width:70px;height:70px;border-radius:50%;border:none;background:#ef4444;color:white;font-size:28px;cursor:pointer;">📵</button>' +
        '</div>';
    } else {
        // 📞 VOICE CALL LAYOUT — centered avatar + audio + controls
        inner =
        '<audio id="scRemoteAudio" autoplay controls style="width:90%;max-width:300px;height:40px;margin:8px 0;display:none;"></audio>' +
        '<div style="width:100px;height:100px;border-radius:50%;background:#334155;display:flex;align-items:center;justify-content:center;font-size:45px;margin-bottom:15px;animation:scP 2s infinite;">📞</div>' +
        '<h2 style="margin:10px 0 5px;">' + title + '</h2>' +
        (state === 'calling' ? '<p id="scCallTimer" style="color:#94a3b8;">Ringing... 0s</p>' : '<p id="scCallTimer" style="color:#94a3b8;">00:00</p>') +
        '<div style="display:flex;gap:18px;margin-top:25px;">' +
        '<button id="scMuteBtn" title="Mute" style="width:55px;height:55px;border-radius:50%;border:none;background:' + (SC.muted ? '#ef4444' : '#334155') + ';color:white;font-size:22px;cursor:pointer;">🎙️</button>' +
        '<button id="scSpkBtn" title="Speaker" style="width:55px;height:55px;border-radius:50%;border:none;background:#334155;color:white;font-size:22px;cursor:pointer;">🔊</button>' +
        '<button id="scEndBtn" style="width:70px;height:70px;border-radius:50%;border:none;background:#ef4444;color:white;font-size:28px;cursor:pointer;">📵</button>' +
        '</div>';
    }

    ui.innerHTML = inner +
        '<style>@keyframes scP{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}</style>';
    document.body.appendChild(ui);

    // wire local video
    if (SC.video && SC.stream) {
        const lv = document.getElementById('scLocalVideo');
        if (lv) {
            lv.srcObject = SC.stream;
            lv.play().catch(function(){});
            // 🔄 tap local video = switch camera
            lv.onclick = function() { scSwitchCamera(); };
        }
    }

    // mute
    document.getElementById('scMuteBtn').addEventListener('click', () => {
        SC.muted = !SC.muted;
        if (SC.stream) SC.stream.getAudioTracks().forEach(t => t.enabled = !SC.muted);
        var mb = document.getElementById('scMuteBtn');
        if (mb) { mb.style.background = SC.muted ? '#ef4444' : '#334155'; mb.textContent = SC.muted ? '🔇' : '🎙️'; }
    });

    if (SC.video) {
        // camera on/off
        document.getElementById('scCamBtn').addEventListener('click', () => {
            if (SC.stream) {
                var vt = SC.stream.getVideoTracks();
                if (vt.length > 0) {
                    var enabled = vt[0].enabled;
                    vt[0].enabled = !enabled;
                    document.getElementById('scCamBtn').style.background = enabled ? '#ef4444' : '#334155';
                }
            }
        });
        // 🔄 switch front/back
        document.getElementById('scSwitchBtn').addEventListener('click', function() { scSwitchCamera(); });
    } else {
        // speaker (voice calls)
        document.getElementById('scSpkBtn').addEventListener('click', () => {
            const a = document.getElementById('scRemoteAudio');
            if (a) a.volume = a.volume >= 1 ? 0.5 : 1;
        });
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

// 🔄 CAMERA SWITCH (front ↔ back)
async function scSwitchCamera() {
    if (!SC.stream) return;
    try {
        var currentFacing = 'user';
        var vt = SC.stream.getVideoTracks();
        if (vt.length > 0 && vt[0].getSettings && vt[0].getSettings().facingMode) {
            currentFacing = vt[0].getSettings().facingMode;
        }
        var newFacing = currentFacing === 'user' ? 'environment' : 'user';
        // get new stream with the other camera
        var newStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: newFacing }, audio: false });
        var newTrack = newStream.getVideoTracks()[0];
        // replace track in peer connection (if connected)
        if (SC.pc && SC.pc.getSenders) {
            var sender = SC.pc.getSenders().find(function(s){ return s.track && s.track.kind === 'video'; });
            if (sender) await sender.replaceTrack(newTrack);
        }
        // stop old video track, keep audio
        vt.forEach(function(t){ t.stop(); });
        // remove old video tracks from stream, add new
        SC.stream.getVideoTracks().forEach(function(t){ SC.stream.removeTrack(t); });
        SC.stream.addTrack(newTrack);
        // update local preview
        var lv = document.getElementById('scLocalVideo');
        if (lv) lv.srcObject = SC.stream;
        alert('🔄 Camera switched to ' + (newFacing === 'user' ? 'front' : 'back'));
    } catch(e) {
        alert('❌ Camera switch failed: ' + e.message);
    }
}
function scEnd(notify) {
    // 🆕 send call duration message
    if (SC.callStart && SC.peerName) {
        var secs = Math.floor((Date.now() - SC.callStart) / 1000);
        if (secs > 5) {   // only if call lasted >5s
            var mm = Math.floor(secs / 60), ss = secs % 60;
            scSend({ message: '📞 Call ended — ' + (mm > 0 ? mm + 'm ' : '') + ss + 's', media_type: null, media_data: null, media_duration: null });
        }
        SC.callStart = 0;
    }
    if (notify && SC.peer) scSig(SC.peer, 'hangup', {});
    __scRingStop = true;
    clearInterval(__scCallTimer); clearInterval(__scRingbackInterval); clearInterval(__scCallDurTimer);
    clearInterval(window.__scRingInterval);
    SC.inCall = false; SC.peer = null; SC.muted = false;
    if (SC.pc) { try { SC.pc.close(); } catch(e) {} SC.pc = null; }
    if (SC.stream) { SC.stream.getTracks().forEach(t => t.stop()); SC.stream = null; }
    const u = document.getElementById('scCallUI'); if (u) u.remove();
    const i = document.getElementById('scIncomingUI'); if (i) i.remove();
    __scIceBuffer = [];
}

function scCallFromChat(video) {
    const sel = scRecipientSelect();
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
// ✏️ PART 8 — TYPING + PRESENCE + ONLINE DOTS
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
        var area = scInputArea();
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
    // 🆕 fetch presence for online dots
    setInterval(scFetchPresence, 60000);
    scFetchPresence();
}
async function scFetchPresence() {
    try {
        const { data } = await supabaseClient.from('presence').select('*').eq('shop_id', SC.shop);
        (data || []).forEach(function(p) {
            SC.presenceMap[p.id] = {
                online: (Date.now() - new Date(p.last_seen).getTime()) < 120000,   // 2 min
                name: p.user_name, role: p.role
            };
        });
        scUpdatePresenceDots();
    } catch(e) {}
}
function scUpdatePresenceDots() {
    var sel = scRecipientSelect();
    if (!sel) return;
    Array.from(sel.options).forEach(function(opt) {
        var val = opt.value;
        var p = SC.presenceMap[val];
        if (p) {
            var txt = opt.textContent;
            txt = txt.replace(' 🟢', '').replace(' ⚫', '');
            opt.textContent = txt + (p.online ? ' 🟢' : ' ⚫');
        }
    });
}

// ================================================================
// 🔔 PART 9 — NOTIFICATION SOUND + UNREAD COUNTER
// ================================================================
function scNotifySound() {
    if (localStorage.getItem('scSound') === '0') return;
    try {
        var ctx = window.__scRingCtx || new (window.AudioContext || window.webkitAudioContext)();
        window.__scRingCtx = ctx;
        [523, 659, 784].forEach(function(f, i) {
            var o = ctx.createOscillator(), g = ctx.createGain();
            o.frequency.value = f;
            var t = ctx.currentTime + i * 0.1;
            g.gain.setValueAtTime(0.15, t);
            g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
            o.connect(g); g.connect(ctx.destination);
            o.start(t); o.stop(t + 0.22);
        });
    } catch(e) {}
}

// ================================================================
// 🏗️ PART 10 — V4 ADMIN TAB BUILDER (builds full chat in admin-clean)
// ================================================================
function scBuildV4Tab() {
    var tab = document.getElementById('tab19');
    if (!tab || tab.dataset.scBuilt === '1') return;
    tab.dataset.scBuilt = '1';
    tab.innerHTML =
        '<style>' +
        '.scB{max-width:82%;padding:10px 14px;border-radius:15px;font-size:14px;line-height:1.4;word-wrap:break-word;margin-bottom:8px;}' +
        '.scB.me{background:#2563eb;color:#fff;align-self:flex-end;border-bottom-right-radius:2px;}' +
        '.scB.them{background:#e2e8f0;color:#1e293b;align-self:flex-start;border-bottom-left-radius:2px;}' +
        'body.dark .scB.them{background:#334155;color:#e2e8f0;}' +
        '.scQR{padding:7px 12px;border-radius:16px;border:1px solid #cbd5e1;background:#fff;font-size:11px;font-weight:700;cursor:pointer;color:#64748b;white-space:nowrap;}' +
        'body.dark .scQR{background:#334155;color:#e2e8f0;border-color:#475569;}' +
        '.chat-input-area{padding:8px 10px;border-top:1px solid #e2e8f0;background:#fff;}' +
        'body.dark .chat-input-area{background:#1e293b;border-color:#334155;}' +
        '</style>' +
        '<div class="card" style="height:78vh;display:flex;flex-direction:column;padding:0;overflow:hidden;">' +
        '<div style="padding:14px;border-bottom:1px solid #e2e8f0;font-weight:bold;background:#1e3a8a;color:#fff;border-radius:14px 14px 0 0;display:flex;justify-content:space-between;align-items:center;">' +
        '<span>💬 Staff Intercom</span>' +
        '<span style="display:flex;gap:8px;align-items:center">' +
        '<input type="text" id="scSearchBox" placeholder="🔍 Search…" style="padding:5px 10px;border:none;border-radius:8px;font-size:12px;width:120px;background:rgba(255,255,255,.2);color:#fff;outline:none;" oninput="SC.searchQ=this.value.toLowerCase();scRerender()">' +
        '<span id="scSoundToggle" style="cursor:pointer;font-size:18px" onclick="scToggleSound()" title="Sound on/off">🔊</span>' +
        '</span></div>' +
        '<div id="scChatMessages" style="flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;background:#f8fafc;"></div>' +
        '<div style="display:flex;gap:6px;overflow-x:auto;padding:6px 10px;border-top:1px solid #e2e8f0;background:#fff;">' +
        '<button class="scQR" onclick="scQuickSend(\'✅ Order received — preparing now\')">✅ Order received</button>' +
        '<button class="scQR" onclick="scQuickSend(\'🍽️ Food is ready for pickup\')">🍽️ Food ready</button>' +
        '<button class="scQR" onclick="scQuickSend(\'📦 Need stock check please\')">📦 Stock check</button>' +
        '<button class="scQR" onclick="scQuickSend(\'💰 Please send daily report\')">💰 Daily report</button>' +
        '</div>' +
        '<div class="chat-input-area" style="display:flex;flex-direction:column;gap:4px;">' +
        '<select id="scRecipient" style="padding:8px;border:1px solid #cbd5e1;border-radius:8px;font-size:13px;width:100%">' +
        '<option value="All">📢 Everyone</option>' +
        '<option value="Cashier">💻 Cashier Only</option>' +
        '<option value="Kitchen">👨‍🍳 Kitchen Only</option>' +
        '</select>' +
        '</div>' +
        '</div>';
    scBuildV4Recipients();
}
async function scBuildV4Recipients() {
    var sel = document.getElementById('scRecipient');
    if (!sel) return;
    try {
        const { data: staff } = await supabaseClient.from('employees').select('firebase_id, name, position').eq('shop_id', SC.shop).eq('status', 'active');
        if (staff && staff.length) {
            var og = document.createElement('optgroup');
            og.label = '── Direct Message ──';
            staff.forEach(function(emp) {
                var o = document.createElement('option');
                o.value = emp.firebase_id || emp.id;
                o.textContent = '👤 ' + emp.name + ' (' + emp.position + ')';
                og.appendChild(o);
            });
            sel.appendChild(og);
        }
    } catch(e) {}
}
function scQuickSend(text) {
    var input = document.getElementById('scText');
    if (input) input.value = text;
    scSend({ message: text, media_type: null, media_data: null, media_duration: null });
}
function scToggleSound() {
    var cur = localStorage.getItem('scSound') !== '0';
    localStorage.setItem('scSound', cur ? '0' : '1');
    var el = document.getElementById('scSoundToggle');
    if (el) el.textContent = cur ? '🔇' : '🔊';
    // also toggle v4cmSound if present
    var el2 = document.getElementById('v4cmSound');
    if (el2) el2.textContent = cur ? '🔇' : '🔊';
}

// ================================================================
// 🚀 PART 11 — BOOT
// ================================================================
function scBoot() {
    scInit();

    // audio unlock on first touch
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
            // v4 admin: build tab if needed
            if (scIsV4()) {
                scBuildV4Tab();
                var v4c = document.getElementById('scChatMessages');
                var v4open = v4c && v4c.offsetParent !== null;
                if (v4open && !chatWasOpen) { chatWasOpen = true; scRerender(); scBuildBar(); }
                else if (!v4open) chatWasOpen = false;
            }
            // legacy apps: attach to existing chat areas
            var area = scInputArea();
            var c = scContainer();
            var open = c && c.offsetParent !== null;
            if (area && area.offsetParent !== null) scBuildBar();
            if (open && !chatWasOpen) { chatWasOpen = true; scRerender(); }
            else if (!open) chatWasOpen = false;
            // typing ping
            var ti = document.getElementById('scText');
            if (ti && !ti.getAttribute('data-sc-typing')) {
                ti.setAttribute('data-sc-typing', '1');
                ti.addEventListener('input', function() { if (ti.value) scTypingPing(); });
            }
        } catch(e) {}
    }, 1500);

    // call channel
    window.__scCallChannel = supabaseClient.channel('calls-' + SC.shop);
    window.__scCallChannel
        .on('broadcast', { event: 'sc-signal' }, function(msg) {
            scHandleSignal(msg.payload);
        })
        .subscribe();

    // message listener — sound + unread on new messages
    supabaseClient.channel('sc-msgs-' + SC.shop)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: 'shop_id=eq.' + SC.shop },
            function(payload) {
                var msg = payload.new;
                if (msg.sender_name !== SC.name) {
                    scNotifySound();
                    try { if (navigator.vibrate) navigator.vibrate(100); } catch(e) {}
                    // render if chat open
                    var c = scContainer();
                    if (c && c.offsetParent !== null) scBubble(msg);
                }
            })
        .subscribe();
}
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(scBoot, 2000);
} else {
    document.addEventListener('DOMContentLoaded', () => setTimeout(scBoot, 2000));
}

// ================================================================
// 🖼️ LIGHTBOX
// ================================================================
function scLightbox(imgId) {
    var img = document.getElementById(imgId);
    if (!img) return;
    var src = img.getAttribute('data-media');
    var lb = document.createElement('div');
    lb.id = 'scLightbox';
    lb.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.95);z-index:2147483000;display:flex;align-items:center;justify-content:center;flex-direction:column;';
    lb.innerHTML =
        '<img src="' + src + '" style="max-width:95%;max-height:80vh;border-radius:8px;transition:transform .2s;cursor:zoom-in;" id="scLightboxImg">' +
        '<button style="margin-top:20px;padding:12px 30px;border:none;border-radius:10px;background:#ef4444;color:white;font-weight:bold;font-size:16px;cursor:pointer;">✖ Close</button>';
    document.body.appendChild(lb);
    var lbImg = document.getElementById('scLightboxImg');
    var zoomed = false;
    lbImg.onclick = function() {
        zoomed = !zoomed;
        lbImg.style.transform = zoomed ? 'scale(2)' : 'scale(1)';
        lbImg.style.cursor = zoomed ? 'zoom-out' : 'zoom-in';
    };
    lb.querySelector('button').onclick = function() { lb.remove(); };
    lb.onclick = function(e) { if (e.target === lb) lb.remove(); };
}

// v4 tab loader registration (if V4_TAB_LOADERS exists)
if (typeof V4_TAB_LOADERS !== 'undefined') {
    V4_TAB_LOADERS[19] = function() {
        scBuildV4Tab();
        scRerender();
    };
}
