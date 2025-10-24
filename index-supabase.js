import { supabase } from './supabaseClient.js';

async function loadVideos() {
    const { data, error } = await supabase
        .from('videos')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

    if (error) {
        console.error('Error loading videos:', error);
        return ;
    }

    const grid = document.getElementById('videoGrid');
    grid.innerHTML = '';
    data.forEach(meta => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div style="font-weight:700;margin-bottom:6px;">${escapeHtml(meta.name)}</div>
            <video controls src="${meta.url}"></video>
        `;
        grid.appendChild(card);
    });
}

function escapeHtml(s = '') {
    return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

window.addEventListener('DOMContentLoaded', loadVideos);