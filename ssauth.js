// ═══ SMARTSHOP SECURE AUTH (salted PINs + server login + license check) ═══
var SS_PBKDF2_ITER = 100000;

function ssHexToBytes(hex){ var o=[]; for(var i=0;i<hex.length;i+=2) o.push(parseInt(hex.substr(i,2),16)); return new Uint8Array(o); }
function ssBytesToHex(buf){ return Array.from(new Uint8Array(buf)).map(function(b){return b.toString(16).padStart(2,'0');}).join(''); }
function ssRandomSalt(){ return ssBytesToHex(crypto.getRandomValues(new Uint8Array(16))); }

async function ssHashPin(pin, saltHex){
    var key = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveBits']);
    var bits = await crypto.subtle.deriveBits({ name:'PBKDF2', hash:'SHA-256', salt: ssHexToBytes(saltHex), iterations: SS_PBKDF2_ITER }, key, 256);
    return ssBytesToHex(bits);
}

function ssShopId(){
    try { if (typeof getShopId === 'function') return getShopId(); } catch(e) {}
    return localStorage.getItem('kitchenShopId') || localStorage.getItem('shopId') || 'default';
}

// 🔐 SERVER LOGIN (rate-limited, salted). Returns {ok, reason, ...}
async function ssVerifyStaffPin(shopId, employeeId, pin){
    try {
        var token = SS_CONFIG.SUPABASE_KEY;
        try {
            var s = await supabaseClient.auth.getSession();
            if (s.data && s.data.session) token = s.data.session.access_token;
        } catch(e) {}
        var res = await fetch(SS_CONFIG.SUPABASE_URL + '/functions/v1/staff-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'apikey': SS_CONFIG.SUPABASE_KEY, 'Authorization': 'Bearer ' + token },
            body: JSON.stringify({ shop_id: shopId, employee_id: employeeId, pin: String(pin) })
        });
        return await res.json();
    } catch(e) {
        return { ok: false, reason: 'network', message: e.message };
    }
}

// 💾 SET NEW PIN (salted) — works because POS/Kitchen devices hold the OWNER session
async function ssSetPin(employeeId, newPin){
    var salt = ssRandomSalt();
    var hash = await ssHashPin(String(newPin), salt);
    const { error } = await supabaseClient.from('employees')
        .update({ hashed_password: hash, pin_salt: salt, failed_attempts: 0, lock_until: null })
        .eq('firebase_id', employeeId);
    return !error;
}

// ⏰ SERVER-SIDE LICENSE / TRIAL CHECK (for POS & Kitchen login)
async function ssCheckLicense(){
    try {
        if (supabaseClient && navigator.onLine) {
            const { data: shop } = await supabaseClient.from('shops')
                .select('plan, trial_expires, blocked').eq('shop_id', ssShopId()).maybeSingle();
            if (shop && shop.blocked) return { allowed:false, message:'⛔ Service suspended by the provider. Contact support.' };

            const { data: lic } = await supabaseClient.from('licenses')
                .select('plan, status, expiry_date').eq('shop_id', ssShopId())
                .order('created_at', { ascending:false }).limit(1).maybeSingle();
            if (lic) {
                if (lic.status && lic.status !== 'active')
                    return { allowed:false, message:'⛔ License revoked. The owner must contact the provider.' };
                if (lic.expiry_date && new Date(lic.expiry_date) < new Date())
                    return { allowed:false, message:'⏰ License expired (' + new Date(lic.expiry_date).toLocaleDateString() + '). The owner must renew (Admin → License).' };
                try { localStorage.setItem('smartshop_license', JSON.stringify({ plan: lic.plan || 'basic', expiryDate: lic.expiry_date, shopId: ssShopId(), shopName: '', maxShops: 1, maxCashiersPerShop: 999, maxProducts: 999999 })); } catch(e) {}
                return { allowed:true };
            }
            if (shop && shop.plan === 'trial' && shop.trial_expires && new Date(shop.trial_expires) < new Date())
                return { allowed:false, message:'⏰ Free trial ended. The owner must activate a plan (Admin → License).' };
            return { allowed:true };
        }
    } catch(e) {}
    // Offline / network error → cached license (fail-open so business never stops)
    try {
        var lic = JSON.parse(localStorage.getItem('smartshop_license') || 'null');
        if (lic && lic.expiryDate && new Date(lic.expiryDate) < new Date())
            return { allowed:false, message:'⏰ License expired. Connect to internet so the system can verify your renewal.' };
    } catch(e) {}
    return { allowed:true };
}
