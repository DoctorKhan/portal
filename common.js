// Shared behavior across all routes:
// - Initialize Lucide icons
// - Highlight active tab
// - Fix nav links when opened via file://
// - Generate a QR code for the current URL
// - Mark profile images as loaded

if (window.lucide) {
    lucide.createIcons();
}

document.querySelectorAll('.profile-pic').forEach((img) => {
    const markLoaded = () => img.classList.add('loaded');
    if (img.complete && img.naturalWidth > 0) {
        markLoaded();
    } else {
        img.addEventListener('load', markLoaded, { once: true });
    }
});

// When opened via file://, directory URLs may not auto-load index.html.
if (window.location.protocol === 'file:') {
    document.querySelectorAll('.route-link[data-file-href]').forEach((el) => {
        el.href = el.dataset.fileHref;
    });
}

// Highlight active route tab
const activeRoute = document.querySelector('.route-link.active')?.dataset.route;
const hrefRoute = (window.location.pathname || '').split('/').filter(Boolean).pop();
const active = activeRoute
    ?? (window.location.pathname.includes('/share') ? 'share'
    : hrefRoute === 'share' ? 'share'
    : 'professional');

document.querySelectorAll('.route-link').forEach((el) => {
    el.classList.toggle('active', el.dataset.route === active);
});

// Create QR code for the current URL
const qrImg = document.getElementById('qr-image');
if (qrImg) {
    const shareUrl = document.querySelector('.qr-card')
        ? 'https://dr.rezkhan.net/'
        : window.location.href;
    const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent-color').trim();
    const accentHex = accent.startsWith('#') ? accent.slice(1) : accent;

    qrImg.src =
        'https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=' +
        encodeURIComponent(shareUrl) +
        '&color=' + (accentHex || '38bdf8') +
        '&bgcolor=020617';
}
