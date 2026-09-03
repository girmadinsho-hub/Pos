/* ================================================================
   ✨ MODERN CHAT — smart bar (📷🎤), presence, typing, unread, replies
   + creates the bar that livecall.js buttons attach to.
   ================================================================ */

var MC = { lastRead: 0, typingTimer: null };

function mcMyId() {
    if (typeof currentCashier !== 'undefined' && currentCashier) return currentCashier.id;
    if (localStorage.getItem('kitchenChefId')) return localStorage.getItem('kitchenChefId');
    return 'admin';
}
function mcMyName() {
    if (typeof currentCashier !== 'undefined' && currentCashier) return currentCashier.name;
    if (localStorage.getItem('kitchenChefName')) return localStorage.getItem('kitchenChefName');
    return 'Admin';
}
function mcMyRole() {
    if (typeof currentCashier !== 'undefined' && currentCashier) return currentCashier.position || 'Cashier';
    if (localStorage.getItem('kitchenChefId')) return 'Kitchen';
    return 'Admin';
}
function mcShop() {
    try { if (typeof getShopId === 'function') return getShopId(); } catch(e) {}
    if (typeof shopId !== 'undefined' && shopId) return shopId;
    return localStorage.getItem('shopId') || 'default';
}

// ================================================================
// 🆕 THE SMART CHAT BAR — replaces the plain input with:
// [ 📷 photo ] [ 🎤 voice ] [ text ] [ ➤ send ]
// (📞 📹 buttons attach here automatically via livecall.js)
// ================================================================
function smartChatUpgrade() {
    var inputArea = document.querySelector('.chat-input-area');
    if (!inputArea || document.getElementById('smartChatBar')) return;

    // Hide the old input row
    var oldRow = inputArea.querySelector('div[style*="display: flex"]');
    if (oldRow) oldRow.style.display = 'none';

    var bar = document.createElement('div');
    bar.id = 'smartChatBar';
    bar.style.cssText = 'display:flex;gap:4px;align-items:center;flex-wrap:nowrap;overflow:visible;';    bar.innerHTML =
        '<button id="scPhotoBtn" title="Send photo" style="width:36px;height:36px;min-width:36px;border:none;border-radius:50%;background:#7c3aed;color:white;font-size:15px;cursor:pointer;flex-shrink:0;">📷</button>' +
        '<button id="scMicBtn" title="Hold to record voice" style="width:36px;height:36px;min-width:36px;border:none;border-radius:50%;background:#ef4444;color:white;font-size:15px;cursor:pointer;flex-shrink:0;">🎤</button>' +
        '<input type="text" id="scTextInput" placeholder="Message..." style="flex:1;min-width:0;width:auto;padding:9px 12px;border:1px solid #cbd5e1;border-radius:18px;font-size:14px;outline:none;">' +
        '<button id="scSendBtn" title="Send" style="width:36px;height:36px;min-width:36px;border:none;border-radius:50%;background:#2563eb;color:white;font-size:14px;font-weight:bold;cursor:pointer;flex-shrink:0;">➤</button>';
    inputArea.appendChild(bar);

    document.getElementById('scSendBtn').onclick = function() {
        var txt = document.getElementById('scTextInput').value.trim();
        if (!txt) return;
        document.getElementById('scTextInput').value = '';
        __sendSmartChat({ message: txt, media_type: null, media_data: null, media_duration: null });
    };
    document.getElementById('scTextInput').onkeypress = function(e) {
        if (e.key === 'Enter') document.getElementById('scSendBtn').click();
    };

    document.getElementById('scPhotoBtn').onclick = function() {
        var fi = document.createElement('input');
        fi.type = 'file';
        fi.accept = 'image/*';
        fi.capture = 'environment';
        fi.onchange = function() { __handleChatPhoto(this.files[0]); };
        fi.click();
    };

    var mic = document.getElementById('scMicBtn');
    mic.addEventListener('touchstart', function(e) { e.preventDefault(); __startRecording(); });
    mic.addEventListener('touchend', function(e) { e.preventDefault(); __stopRecording(true); });
    mic.addEventListener('mousedown', function() { __startRecording(); });
    mic.addEventListener('mouseup', function() { __stopRecording(true); });
}

// ================================================================
// 🎤 VOICE RECORDING ENGINE
// ================================================================
var __recorder = null, __recChunks = [], __recTimer = null, __recStart = 0;

function __startRecording() {
    if (__recorder) return;
    navigator.mediaDevices.getUserMedia({ audio: true }).then(function(stream) {
        __recChunks = [];
        __recStart = Date.now();
        __recorder = new MediaRecorder(stream);
        __recorder.ondataavailable = function(e) { if (e.data.size > 0) __recChunks.push(e.data); };
        __recorder.onstop = function() {
            stream.getTracks().forEach(function(t) { t.stop(); });
            var micBtn = document.getElementById('scMicBtn');
            if (micBtn) { micBtn.style.background = '#ef4444'; micBtn.textContent = '🎤'; }
            clearInterval(__recTimer);
        };
        __recorder.start();
        var micBtn = document.getElementById('scMicBtn');
        if (micBtn) { micBtn.style.background = '#991b1b'; micBtn.textContent = '⏺'; }
        var t = 0;
        var label = document.getElementById('scTextInput');
        if (label) {
            __recTimer = setInterval(function() {
                t++;
                label.value = '🔴 Recording... ' + t + 's (release to send)';
                if (t >= 60) __stopRecording(true);
            }, 1000);
        }
    }).catch(function() {
        alert('🎤 Microphone blocked! Allow mic access in browser settings.');
    });
}

function __stopRecording(send) {
    if (!__recorder) return;
    var r = __recorder;
    __recorder = null;
    clearInterval(__recTimer);
    var dur = Math.round((Date.now() - __recStart) / 1000);
    var input = document.getElementById('scTextInput');
    if (input) input.value = '';
    r.onstop = function() {};
    r.stop();

    setTimeout(function() {
        if (!send || __recChunks.length === 0) return;
        if (dur < 1) return;
        var blob = new Blob(__recChunks, { type: 'audio/webm' });
        var reader = new FileReader();
        reader.onloadend = function() {
            var b64 = reader.result;
            if (b64.length > 400000) { alert('Voice too long! Keep under ~45 seconds.'); return; }
            __sendSmartChat({ message: '🎤 Voice message', media_type: 'voice', media_data: b64, media_duration: dur + 's' });
        };
        reader.readAsDataURL(blob);
    }, 300);
}

// ================================================================
// 📷 PHOTO HANDLER
// ================================================================
function __handleChatPhoto(file) {
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(e) {
        var img = new Image();
        img.onload = function() {
            var canvas = document.createElement('canvas');
            var scale = Math.min(1, 400 / img.width);
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;
            canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
            var b64 = canvas.toDataURL('image/jpeg', 0.6);
            if (b64.length > 500000) { alert('Photo too large, try another.'); return; }
            __sendSmartChat({ message: '📷 Photo', media_type: 'photo', media_data: b64, media_duration: null });
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// ================================================================
// 📤 THE SMART SENDER (works with your recipient dropdown)
// ================================================================
function __sendSmartChat(payload) {
    var sel = document.getElementById('chatRecipient') || document.getElementById('adminChatRecipient');
    var recipientVal = sel ? sel.value : 'All';
    var recipientName = sel ? sel.options[sel.selectedIndex].text.replace('👤 ', '').replace('🟢 ', '') : 'Everyone';

    var chatPayload = {
        shop_id: mcShop(),
        message: payload.message,
        media_type: payload.media_type,
        media_data: payload.media_data,
        media_duration: payload.media_duration,
        recipient: 'All'
    };

    if (typeof currentCashier !== 'undefined' && currentCashier) {
        chatPayload.sender_name = currentCashier.name;
        chatPayload.sender_id = currentCashier.id;
        chatPayload.sender_role = currentCashier.position || 'Cashier';
    } else if (localStorage.getItem('kitchenChefName')) {
        chatPayload.sender_name = localStorage.getItem('kitchenChefName');
        chatPayload.sender_id = localStorage.getItem('kitchenChefId');
        chatPayload.sender_role = 'Chef';
    } else {
        chatPayload.sender_name = 'Admin';
        chatPayload.sender_id = '';
        chatPayload.sender_role = 'Admin';
    }

    if (recipientVal === 'All' || ['Cashier','Kitchen','Admin'].indexOf(recipientVal) !== -1) {
        chatPayload.recipient = recipientVal;
    } else {
        chatPayload.recipient = 'Direct';
        chatPayload.recipient_id = recipientVal;
        chatPayload.recipient_name = recipientName;
    }

    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
        supabaseClient.from('chat_messages').insert([chatPayload]).then(function(r) {
            if (r.error) alert('❌ Send failed: ' + r.error.message);
        });
    }
}

// ================================================================
// 🎨 SMART BUBBLE RENDERER (voice player + photo + text)
// ================================================================
function renderSmartBubble(msg) {
    var container = document.getElementById('chatMessages') || document.getElementById('adminChatMessages');
    if (!container) return;

    var isMe = (msg.sender_id && (
        (typeof currentCashier !== 'undefined' && currentCashier && msg.sender_id === currentCashier.id) ||
        (localStorage.getItem('kitchenChefId') && msg.sender_id === localStorage.getItem('kitchenChefId'))
    )) || (msg.sender_name === 'Admin' && !localStorage.getItem('kitchenChefId') && (typeof currentCashier === 'undefined' || !currentCashier));

    var myRole = mcMyRole();
    var myId = mcMyId();
    var isForMe = isMe || msg.recipient === 'All' || msg.recipient === myRole ||
                  msg.recipient_id === myId ||
                  (msg.sender_name === 'Admin' && myRole === 'Admin');
    if (!isForMe) return;

    var bubble = document.createElement('div');
    bubble.className = 'chat-bubble ' + (isMe ? 'sent' : 'received');
    var timeStr = new Date(msg.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
    var tag = '';
    if (!isMe) {
        if (msg.recipient === 'Direct' && msg.recipient_name) tag = ' ➡️ You';
        else if (msg.recipient !== 'All') tag = ' ➡️ ' + msg.recipient;
    }

    var inner = '';
    if (msg.media_type === 'voice' && msg.media_data) {
        inner = '<div style="display:flex;align-items:center;gap:6px;min-width:160px;">' +
            '<span style="font-size:20px;">🎤</span>' +
            '<audio controls preload="metadata" src="' + msg.media_data + '" style="height:36px;width:150px;max-width:150px;"></audio>' +
            '</div><small>' + (msg.sender_name || '') + ' ' + (msg.media_duration || '') + ' • ' + timeStr + '</small>';
    } else if (msg.media_type === 'photo' && msg.media_data) {
        inner = '<img src="' + msg.media_data + '" style="max-width:200px;border-radius:10px;cursor:pointer;display:block;" onclick="window.open(this.src, \'_blank\')">' +
            '<small style="display:block;margin-top:4px;">' + (msg.sender_name || '') + tag + ' • ' + timeStr + '</small>';
    } else {
        inner = (msg.message || '') + '<small style="display:block;margin-top:3px;">' + (msg.sender_name || '') + tag + ' • ' + timeStr + '</small>';
    }
    bubble.innerHTML = inner;
    container.appendChild(bubble);
    container.scrollTop = container.scrollHeight;
}

// ================================================================
// 🟢 PRESENCE (heartbeat)
// ================================================================
function mcStartPresence() {
    async function beat() {
        try {
            await supabaseClient.from('presence').upsert([{
                id: mcMyId(), shop_id: mcShop(), user_name: mcMyName(),
                role: mcMyRole(), last_seen: new Date().toISOString()
            }], { onConflict: 'id' });
        } catch(e) {}
    }
    beat();
    setInterval(beat, 30000);
}

async function mcDotsOnDropdown() {
    var sel = document.getElementById('chatRecipient') || document.getElementById('adminChatRecipient');    if (!sel) return;
    try {
        const { data } = await supabaseClient.from('presence')
            .select('user_name, role')
            .eq('shop_id', mcShop())
            .gte('last_seen', new Date(Date.now() - 90000).toISOString());
        var onlineNames = {};
        (data || []).forEach(function(o) { onlineNames[o.user_name] = true; });
        for (var i = 0; i < sel.options.length; i++) {
            var name = sel.options[i].textContent.replace('🟢 ', '').replace('👤 ', '');
            if (onlineNames[name]) {
                if (sel.options[i].textContent.indexOf('🟢') !== 0) {
                    sel.options[i].textContent = '🟢 ' + sel.options[i].textContent;
                }
            } else {
                sel.options[i].textContent = sel.options[i].textContent.replace('🟢 ', '');
            }
        }
    } catch(e) {}
}
function fallback() { return document.getElementById('adminChatRecipient'); }

// ================================================================
// ✏️ TYPING INDICATOR
// ================================================================
function mcSendTyping() {
    if (MC.typingTimer) return;
    MC.typingTimer = setTimeout(function() { MC.typingTimer = null; }, 2500);
    supabaseClient.from('call_signals').insert([{
        shop_id: mcShop(), from_id: mcMyId(), from_name: mcMyName(),
        to_id: 'All', type: 'typing', data: {}, created_at: new Date().toISOString()
    }]).then(function(){}).catch(function(){});
}

function mcShowTyping(name) {
    var el = document.getElementById('mcTypingBar');
    if (!el) {
        var area = document.querySelector('.chat-input-area');
        if (!area) return;
        el = document.createElement('div');
        el.id = 'mcTypingBar';
        el.style.cssText = 'padding:4px 15px;font-size:11px;color:#64748b;font-style:italic;';
        area.parentNode.insertBefore(el, area);
    }
    el.textContent = '✏️ ' + name + ' is typing...';
    clearTimeout(window.__mcTypingFade);
    window.__mcTypingFade = setTimeout(function(){ el.textContent = ''; }, 3000);
}

// ================================================================
// 🔔 UNREAD BADGE
// ================================================================
function mcUpdateUnreadBadge() {
    var lastRead = parseInt(localStorage.getItem('mc_lastRead_' + mcMyId()) || '0');
    supabaseClient.from('chat_messages')
        .select('id', { count: 'exact', head: true })
        .eq('shop_id', mcShop())
        .gt('created_at', new Date(lastRead || (Date.now() - 86400000)).toISOString())
        .then(function(r) {
            var count = r.count || 0;
            var fab = document.querySelector('.intercom-fab') || document.getElementById('chatMessages');
            var badge = document.getElementById('mcUnreadBadge');
            if (!fab) return;
            if (!badge) {
                badge = document.createElement('span');
                badge.id = 'mcUnreadBadge';
                badge.style.cssText = 'position:absolute;top:-4px;right:-4px;background:#ef4444;color:white;font-size:10px;font-weight:800;min-width:18px;height:18px;border-radius:9px;display:none;align-items:center;justify-content:center;padding:0 4px;box-shadow:0 2px 6px rgba(0,0,0,.3);';
                if (getComputedStyle(fab).position === 'static') fab.style.position = 'relative';
                fab.appendChild(badge);
            }
            badge.style.display = count > 0 ? 'flex' : 'none';
            badge.textContent = count > 9 ? '9+' : String(count);
        }).catch(function(){});
}

function mcMarkChatOpened() {
    localStorage.setItem('mc_lastRead_' + mcMyId(), String(Date.now()));
    var badge = document.getElementById('mcUnreadBadge');
    if (badge) badge.style.display = 'none';
}

// ================================================================
// ↩️ REPLY (long-press)
// ================================================================
function mcEnableReplies() {
    var container = document.getElementById('chatMessages') || document.getElementById('adminChatMessages');
    if (!container) return;
    container.addEventListener('contextmenu', function(e) {
        var bubble = e.target.closest('.chat-bubble');
        if (!bubble) return;
        e.preventDefault();
        var text = (bubble.textContent || '').substring(0, 60);
        var input = document.getElementById('scTextInput');
        if (input) {
            input.placeholder = '↩️ Replying: "' + text + '"';
            input.focus();
            input.setAttribute('data-reply', text);
        }
    });
}

// ================================================================
// 🚀 AUTO-START everything
// ================================================================
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
        mcStartPresence();

        // Upgrade chat bar whenever chat opens
        var tryUpgrade = setInterval(function() {
            var area = document.querySelector('.chat-input-area');
            if (area && area.offsetParent !== null) {
                smartChatUpgrade();
                clearInterval(tryUpgrade);
            }
        }, 1000);

        // Typing signal
        setTimeout(function() {
            var input = document.getElementById('scTextInput');
            if (input) {
                input.addEventListener('input', function() {
                    if (input.value.length > 0) mcSendTyping();
                });
                input.addEventListener('keydown', function(e) {
                    if (e.key === 'Enter' && input.value.trim()) {
                        var reply = input.getAttribute('data-reply');
                        var p = { message: input.value.trim(), media_type: null, media_data: null, media_duration: null };
                        input.value = '';
                        input.removeAttribute('data-reply');
                        input.placeholder = 'Type a message...';
                        __sendSmartChat(p);
                    }
                });
            }
        }, 5000);

        // Realtime: typing + unread
        supabaseClient.channel('mc-signals-' + mcShop())
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'call_signals', filter: `shop_id=eq.${mcShop()}` },
                function(payload) {
                    if (payload.new.type === 'typing' && payload.new.from_id !== mcMyId()) {
                        mcShowTyping(payload.new.from_name);
                    }
                })
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `shop_id=eq.${mcShop()}` },
                function(payload) {
                    var chatModal = document.getElementById('chatModal');
                    var chatOpen = chatModal && chatModal.classList.contains('active');
                    if (!chatOpen) mcUpdateUnreadBadge();
                })
            .subscribe();

        mcUpdateUnreadBadge();
        setInterval(mcUpdateUnreadBadge, 30000);
        setInterval(function() {
            var area = document.querySelector('.chat-input-area');
            if (area && area.offsetParent !== null) mcDotsOnDropdown();
        }, 15000);

        // Mark read when chat opens
        var origToggle = window.toggleChat;
        if (origToggle) {
            window.toggleChat = function() {
                origToggle();
                var modal = document.getElementById('chatModal');
                if (modal && modal.classList.contains('active')) mcMarkChatOpened();
            };
        }
        mcEnableReplies();
    }, 3000);
});
// 📏 Smart width: while typing long text, hide 📷/🎤 to give space
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
        var input = document.getElementById('scTextInput');
        if (!input) return;
        input.addEventListener('input', function() {
            var photoBtn = document.getElementById('scPhotoBtn');
            var micBtn = document.getElementById('scMicBtn');
            var long = input.value.length > 25;
            if (photoBtn) photoBtn.style.display = long ? 'none' : 'block';
            if (micBtn) micBtn.style.display = long ? 'none' : 'block';
        });
    }, 6000);
});
