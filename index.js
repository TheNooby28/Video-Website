async function loadVideos() {
    try {
        const res = await fetch('/videos');
        if (!res.ok) throw new Error('Failed to fetch');
        const list = await res.json();
        const grid = document.getElementById('videoGrid');
        grid.innerHTML = '';
        list.forEach(meta => {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <div style="font-weight:700;margin-bottom:6px;">${escapeHtml(meta.name)}</div>
                <video controls src="${meta.url}"></video>
            `;
            grid.appendChild(card);
        });
    } catch (err) {
        console.error(err);
    }
}

function escapeHtml(s) {
    return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

window,addEventListener('DOMContentLoaded', loadVideos);