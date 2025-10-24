import { supabase } from './supabaseClient.js';

const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('fileInput');
const pickBtn = document.getElementById('pickBtn');
const uploadBtn = document.getElementById('uploadBtn');
const queueEl = document.getElementById('queue');
const signInBtn = document.getElementById('signInBtn');
const signOutBtn = document.getElementById('signOutBtn');
const userInfo = document.getElementById('userInfo');

let filesQueue = [];

async function updateUserUI() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        userInfo.textContent = `Signed in as ${user.email}`;
        signInBtn.style.display = 'none';
        signOutBtn.style.display = 'inline-block';
    } else {
        userInfo.textContent = 'Not signed in';
        signInBtn.style.display = 'inline-block';
        signOutBtn.style.display = 'none';
    }
}

supabase.auth.onAuthStateChange(() => updateUserUI());
updateUserUI();

signInBtn.addEventListener('click', async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
    if (error) alert('Sign-in error: ' + error.message);
});

signOutBtn.addEventListener('click', async () => {
    await supabase.auth.signOut();
    updateUserUI();
});

pickBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', e => addFiles({...e.target.files}));

dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('dragging'); });
dropzone.addEventListener('dragleave', (e) => { dropzone.classList.remove('dragging'); });
dropzone.addEventListener('drop', (e) => { e.preventDefault(); dropzone.classList.remove('dragging'); addFiles([...e.dataTransfer.files]); });

uploadBtn.addEventListener('click', async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert('You must be signed in to upload files.');
    if (!filesQueue.length) return alert('No files to upload.');

    for (const file of [...filesQueue]) {
        if (!file) continue;
        try {
            await uploadFileToSupabase(file, user.id);
            filesQueue = filesQueue.filter(f => f !== file);
        } catch (error) {
            console.log('Upload error:', error);
            alert('Error uploading file: ' + file.name);
        }
    }
});

function addFiles(files) {
    files.foreach(file => {
        if (!file.type.startsWith('video/')) return;
        filesQueue.push(file);
        renderQueueItem(file, filesQueue.length - 1);
    });
}

function renderQueueItem(file, idx) {
    const item = document.createElement('div');
    item.className = 'item';
    const sizeMb = Math.round(file.size / 1024 / 1024);
    item.innerHTML = `
    <div style="display:flex;gap:12px;align-items:center;">
      <div style="min-width:220px;">
        <div style="font-weight:700">${file.name}</div>
        <div style="font-size:13px;color:#666">${sizeMB} MB</div>
      </div>
      <div class="progress"><span id="p${idx}" style="width:0%"></span></div>
    </div>
    <div><button class="remove" data-idx="${idx}">Remove</button></div>
    `;
    queueEl.appendChild(item);
    item.querySelector('.remove').addEventListener('click', () => {
        const i = Number(e.target.dataset.idx);
        filesQueue[i] = null;
        item.remove();
    });
}

async function uploadFileToSupabase(file, uid) {
    const filename = `${Date.now()}_${file.name.replace(/\s/g, '_')}`;
    const path = `${uid}/${filename}`;

    const { data, error: uploadError } = await supabase.storage
        .from('videos')
        .upload(path, file, { cacheControl: '3600', upsert: false });
    
    if (uploadError) throw uploadError;

    const { data: publicData } = supabase.storage.from('videos').getPublicUrl(path);
    const publicUrl = publicData.publicUrl;

    const { error: dbErr } = await supabase.from('videos').insert([{
        name: file.name,
        storage_path: path,
        url: publicUrl,
        size: file.size,
        mime_type: file.type,
        user_id: uid
    }]);

    if (dbErr) {
        console.error('DB insert failed: ', dbErr);
        await supabase.storage.from('videos').remove([path]);
        throw dbErr;
    }

    const idx = filesQueue.indexOf(file);
    const el = document.getElementById(`p${idx}`);
    if (el) el.style.width = '100%';

    return { path, url: publicUrl };
}