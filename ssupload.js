// ═══ SMARTSHOP IMAGE UPLOAD — Supabase Storage (Package 4B) ═══
// Uploads product images to storage, returns a short public URL.
// Fallback: if storage fails, returns the old base64 (never blocks the user).

async function ssUploadProductImage(fileInput, targetInputId) {
    var file = fileInput.files && fileInput.files[0];
    if (!file) return;
    var targetInput = document.getElementById(targetInputId);
    if (!targetInput) return;

    // Only accept images
    if (!file.type || file.type.indexOf('image/') !== 0) {
        alert('Please choose an image file (jpg, png, webp).');
        return;
    }

    targetInput.disabled = true;
    targetInput.value = '⏳ Uploading image...';

    try {
        // 1. Compress on the phone first (400px, JPEG 70%) — fast uploads
        var dataUrl = await ssCompressImage(file, 400, 0.7);
        var blob = ssDataUrlToBlob(dataUrl);

        // 2. Build the path: shopId/filename-timestamp.jpg
        var ext = 'jpg';
        var path = getShopId() + '/img_' + Date.now() + '.' + ext;

        // 3. Upload to Supabase Storage
        const { error } = await supabaseClient.storage
            .from('product-images')
            .upload(path, blob, { contentType: 'image/jpeg', upsert: false });
        if (error) throw error;

        // 4. Get the public URL (short link, stored in the database)
        const { data: urlData } = supabaseClient.storage
            .from('product-images')
            .getPublicUrl(path);

        targetInput.value = urlData.publicUrl;
        targetInput.disabled = false;
        alert('✅ Image uploaded! It will show on the customer menu.');
    } catch (e) {
        // 🛟 Fallback: storage failed (offline? bucket missing?) → old base64 way
        console.warn('Storage upload failed, using base64 fallback:', e.message);
        try {
            var fallback = await ssCompressImage(file, 400, 0.7);
            targetInput.value = fallback;
            targetInput.disabled = false;
            alert('⚠️ Uploaded as inline image (storage offline).\nThe photo will still work, but the storage version is faster.');
        } catch (e2) {
            targetInput.value = '';
            targetInput.disabled = false;
            alert('❌ Image upload failed: ' + e2.message);
        }
    }
}

// ---- helpers ----
function ssCompressImage(file, maxW, quality) {
    return new Promise(function(resolve, reject) {
        var reader = new FileReader();
        reader.onload = function(e) {
            var img = new Image();
            img.onload = function() {
                var scale = Math.min(1, maxW / img.width);
                var canvas = document.createElement('canvas');
                canvas.width = img.width * scale;
                canvas.height = img.height * scale;
                canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.onerror = function() { reject(new Error('Could not read image')); };
            img.src = e.target.result;
        };
        reader.onerror = function() { reject(new Error('Could not read file')); };
        reader.readAsDataURL(file);
    });
}

function ssDataUrlToBlob(dataUrl) {
    var parts = dataUrl.split(',');
    var mime = parts[0].match(/:(.*?);/)[1];
    var bin = atob(parts[1]);
    var arr = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return new Blob([arr], { type: mime });
}
