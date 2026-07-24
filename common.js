// Shared behavior across all routes:
// - Initialize Lucide icons
// - Highlight active active tab
// - Fix nav links when opened via file://
// - Generate a QR code for the current URL

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

// Create QR code for the current URL
const qrImg = document.getElementById('qr-image');
if (qrImg) {
    const shareUrl = (document.querySelector('.qr-card') ? window.location.origin : window.location.href);
    const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent-color').trim();
    const accentHex = accent.startsWith('#') ? accent.slice(1) : accent;

    qrImg.src =
        'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=' +
        encodeURIComponent(shareUrl) +
        '&color=' + (accentHex || '38bdf8') +
        '&bgcolor=020617';
}
