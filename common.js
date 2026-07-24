// Shared behavior across all routes:
// - Initialize Lucide icons
// - Highlight active active tab
// - Fix nav links when opened via file://
// - Share sheet + QR code

lucide.createIcons();

// When opened via file://, directory URLs may not auto-load index.html.
// Rewrite route links to explicit index.html for local file usage.
if (window.location.protocol === 'file:') {
    document.querySelectorAll('.route-link[data-file-href]').forEach((el) => {
        el.href = el.dataset.fileHref;
    });
}

// Highlight active route tab
const activeRoute = document.querySelector('.route-link.active')?.dataset.route;
const hrefRoute = (window.location.pathname || '').split('/').filter(Boolean).pop();
const active = activeRoute
    ?? (window.location.pathname.includes('/personal') ? 'personal'
    : window.location.pathname.includes('/share') ? 'share'
    : hrefRoute === 'personal' ? 'personal'
    : hrefRoute === 'share' ? 'share'
    : 'professional');

document.querySelectorAll('.route-link').forEach((el) => {
    el.classList.toggle('active', el.dataset.route === active);
});

const SHARE_CONFIG = {
    url: 'https://dr.rezkhan.net/',
    title: 'Dr. Rez Khan',
    text: 'AI Security • Secure AI Systems • Serenus One',
};

function getShareMessage() {
    return `${SHARE_CONFIG.title}\n${SHARE_CONFIG.text}\n${SHARE_CONFIG.url}`;
}

function showShareToast(message) {
    let toast = document.getElementById('share-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'share-toast';
        toast.className = 'share-toast';
        toast.setAttribute('role', 'status');
        toast.setAttribute('aria-live', 'polite');
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(showShareToast._timer);
    showShareToast._timer = setTimeout(() => toast.classList.remove('show'), 2200);
}

async function copyShareLink(triggerEl) {
    const text = SHARE_CONFIG.url;
    try {
        if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(text);
        } else {
            const input = document.getElementById('share-url-input');
            if (input) {
                input.focus();
                input.select();
                document.execCommand('copy');
            } else {
                throw new Error('Clipboard unavailable');
            }
        }
        showShareToast('Link copied');
        if (triggerEl) {
            triggerEl.classList.add('copied');
            const label = triggerEl.querySelector('[data-copy-label]');
            if (label) label.textContent = 'Copied';
            setTimeout(() => {
                triggerEl.classList.remove('copied');
                if (label) label.textContent = 'Copy';
            }, 1800);
        }
        return true;
    } catch {
        showShareToast('Could not copy link');
        return false;
    }
}

function openShareDestination(kind) {
    const url = encodeURIComponent(SHARE_CONFIG.url);
    const text = encodeURIComponent(getShareMessage());
    const title = encodeURIComponent(SHARE_CONFIG.title);
    const tweetText = encodeURIComponent(`${SHARE_CONFIG.title} — ${SHARE_CONFIG.text}`);

    const targets = {
        messages: `sms:?&body=${text}`,
        whatsapp: `https://wa.me/?text=${text}`,
        telegram: `https://t.me/share/url?url=${url}&text=${encodeURIComponent(`${SHARE_CONFIG.title}\n${SHARE_CONFIG.text}`)}`,
        x: `https://twitter.com/intent/tweet?url=${url}&text=${tweetText}`,
        linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
        email: `mailto:?subject=${title}&body=${text}`,
    };

    const href = targets[kind];
    if (!href) return;
    window.open(href, '_blank', 'noopener,noreferrer');
}

async function nativeShare() {
    if (!navigator.share) {
        await copyShareLink();
        return;
    }
    try {
        await navigator.share({
            title: SHARE_CONFIG.title,
            text: SHARE_CONFIG.text,
            url: SHARE_CONFIG.url,
        });
    } catch (err) {
        if (err?.name !== 'AbortError') {
            showShareToast('Share unavailable');
        }
    }
}

function initShareSheet() {
    const sheet = document.querySelector('.share-sheet');
    if (!sheet) return;

    const urlInput = document.getElementById('share-url-input');
    if (urlInput) urlInput.value = SHARE_CONFIG.url;

    const copyBtn = document.getElementById('share-copy-btn');
    if (copyBtn) {
        copyBtn.addEventListener('click', () => copyShareLink(copyBtn));
    }

    const nativeBtn = document.getElementById('share-native-btn');
    if (nativeBtn) {
        nativeBtn.addEventListener('click', nativeShare);
        if (!navigator.share) nativeBtn.style.display = 'none';
    }

    sheet.querySelectorAll('[data-share]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const kind = btn.dataset.share;
            if (kind === 'copy') {
                copyShareLink(copyBtn);
                return;
            }
            openShareDestination(kind);
        });
    });

    if (window.lucide) lucide.createIcons();
}

// Create QR code for share sheet
const qrImg = document.getElementById('qr-image');
if (qrImg) {
    const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent-color').trim();
    const accentHex = accent.startsWith('#') ? accent.slice(1) : accent;

    qrImg.src =
        'https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=' +
        encodeURIComponent(SHARE_CONFIG.url) +
        '&color=' + (accentHex || '38bdf8') +
        '&bgcolor=ffffff';
}

initShareSheet();
