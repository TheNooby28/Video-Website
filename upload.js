const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('fileInput');
const pickBtn = document.getElementById('pickBtn');
const startUploadBtn = document.getElementById('uploadBtn');
const queueEl = document.getElementById('queue');

let filesQueue = [];

pickBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', e => addFiles(Array.from(e.target.files)));

dropzone.addEventListener('dragover', e => { e.preventDefault(); dropzone.classList.add('dragging'); });
dropzone.addEventListener('dragleave', e => { dropzone.classList.remove('dragging'); });
dropzone.addEventListener('drop', e => { e.preventDefault(); dropzone.classList.remove('dragging'); addFiles(Array.from(e.dataTransfer.files)); });

startUploadBtn.addEventListener('click', e => async () => {
    if (!filesQueue.length) return alert('No files queued');

    for (const file of [...filesQueue]) {
        if (!file) continue;
        try {
            await uploadFile(file);
            filesQueue = filesQueue.filter(f => f !== file);
        } catch (err) {
            console.error('Upload error', err);
            alert('Upload failed for ' + file.name);
        }
    }
});

function addFiles(files) {
    files.forEach(file => {
        if (!file.type.startsWith('video/')) return;
        filesQueue.push(file);
        renderQueueItem(file, filesQueue.length - 1);
    });
}

function renderQueueItem(file, idx) {
    const item = document.createElement('div');
    item.className = 'item';
    const sizeMB = Math.round(file.size / 1024 / 1024);
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
    item.querySelector('.remove'.onclick = (e) => {
        const i = Number(e.target.dataset.idx);
        filesQueue[i] = null;
        item.remove();
    });
}

function uploadFile(file) {
    return new Promise((resolve, reject) => {
        const idx = filesQueue.indexOf(file);
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/upload');

        xhr.upload.onprogress = (ev) => {
            if (ev.lengthComputable) {
                const pct = Math.round(ev.loaded / ev.total * 100);
                const el = document.getElementById(`p${idx}`);
                if (el) el.style.width = pct + '%';
            }
        };

        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    const res = JSON.parse(xhr.responseText);
                    console.log('Uploaded', res);
                    resolve(res);
                } catch (e) {
                    resolve({});
                }
            } else {
                reject(new Error('Upload failed: ' + xhr.status));
            }
        };

        xhr.onerror = () => reject(new Error('Network error'));
        const form = new FormData();
        form.append('video', file);
        xhr.send(form);
    });
}