// Shared behavior across all routes:
// - Initialize Lucide icons
// - Highlight active tab
// - Fix nav links when opened via file://
// - Generate a QR code for the current URL
// - Mark profile images as loaded

if (window.lucide) {
    lucide.createIcons();
}

const QR_RENDER_SIZE = 512;
function getStaticQrSrc() {
    if (window.location.protocol === 'file:') {
        return new URL('../assets/share-qr.png', window.location.href).href;
    }
    return new URL('/assets/share-qr.png', window.location.origin).href;
}

function fitQrToHost(host) {
    const svg = host.querySelector('svg');
    const canvas = host.querySelector('canvas');

    if (svg) {
        const w = svg.getAttribute('width') || String(QR_RENDER_SIZE);
        const h = svg.getAttribute('height') || String(QR_RENDER_SIZE);
        svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
        svg.removeAttribute('width');
        svg.removeAttribute('height');
        svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        svg.style.width = '100%';
        svg.style.height = '100%';
        svg.style.display = 'block';
        return;
    }

    if (canvas) {
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.display = 'block';
    }
}

function whenQrReady(host, qr) {
    fitQrToHost(host);

    const drawing = qr?._svgDrawingPromise || qr?._canvasDrawingPromise;
    if (drawing?.then) {
        drawing.then(() => fitQrToHost(host)).catch(() => {});
    }

    if (typeof ResizeObserver !== 'undefined') {
        const observer = new ResizeObserver(() => fitQrToHost(host));
        observer.observe(host);
    }
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

// Create styled QR code for the share page
const qrHost = document.getElementById('qr-canvas');
const qrFallback = document.getElementById('qr-image-fallback');

function buildQrFallbackSrc(shareUrl, accentHex) {
    return getStaticQrSrc();
}

function useStaticQrFallback(fallback) {
    if (!fallback) return;
    fallback.src = getStaticQrSrc();
}

if (qrHost) {
    const shareUrl = 'https://dr.rezkhan.net/';
    const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()
        || getComputedStyle(document.documentElement).getPropertyValue('--accent-color').trim();
    const accentHex = accent.startsWith('#') ? accent.slice(1) : accent;
    const logoHref = document.querySelector('link[rel="icon"]')?.getAttribute('href') || '../favicon.svg';
    const logoPath = new URL(logoHref, window.location.href).href;

    if (typeof QRCodeStyling !== 'undefined') {
        const qr = new QRCodeStyling({
            width: QR_RENDER_SIZE,
            height: QR_RENDER_SIZE,
            type: 'svg',
            data: shareUrl,
            margin: 6,
            qrOptions: {
                typeNumber: 0,
                mode: 'Byte',
                errorCorrectionLevel: 'H',
            },
            dotsOptions: {
                color: accent || '#38bdf8',
                type: 'rounded',
                gradient: {
                    type: 'linear',
                    rotation: 0.78,
                    colorStops: [
                        { offset: 0, color: '#7dd3fc' },
                        { offset: 0.55, color: accent || '#38bdf8' },
                        { offset: 1, color: '#0284c7' },
                    ],
                },
            },
            cornersSquareOptions: {
                color: '#0369a1',
                type: 'extra-rounded',
                gradient: {
                    type: 'linear',
                    rotation: 0,
                    colorStops: [
                        { offset: 0, color: '#0ea5e9' },
                        { offset: 1, color: '#0369a1' },
                    ],
                },
            },
            cornersDotOptions: {
                color: accent || '#38bdf8',
                type: 'dot',
            },
            backgroundOptions: {
                color: '#f8fafc',
            },
            image: logoPath,
            imageOptions: {
                crossOrigin: 'anonymous',
                margin: 6,
                imageSize: 0.34,
                hideBackgroundDots: true,
            },
        });

        qr.append(qrHost);
        whenQrReady(qrHost, qr);

        const drawing = qr._svgDrawingPromise || qr._canvasDrawingPromise;
        if (drawing?.catch) {
            drawing.catch(() => useStaticQrFallback(qrFallback));
        }
    } else if (qrFallback) {
        useStaticQrFallback(qrFallback);
    }
} else if (qrFallback) {
    useStaticQrFallback(qrFallback);
}

// Legacy img fallback for older markup
const qrImg = document.getElementById('qr-image');
if (qrImg && !qrHost) {
    const shareUrl = document.querySelector('.qr-card')
        ? 'https://dr.rezkhan.net/'
        : window.location.href;
    const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()
        || getComputedStyle(document.documentElement).getPropertyValue('--accent-color').trim();
    const accentHex = accent.startsWith('#') ? accent.slice(1) : accent;

    qrImg.src = buildQrFallbackSrc(shareUrl, accentHex);
}

function showToast(message) {
    const toast = document.getElementById('site-toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.remove('hidden');
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(() => {
        toast.classList.add('hidden');
    }, 2200);
}

document.querySelectorAll('[data-copy-url]').forEach((button) => {
    const defaultLabel = button.dataset.copyLabel || button.textContent.trim();

    button.addEventListener('click', async () => {
        const url = button.dataset.copyUrl || 'https://dr.rezkhan.net/';
        const labelEl = button.querySelector('span');

        try {
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(url);
            } else {
                const input = document.createElement('textarea');
                input.value = url;
                input.setAttribute('readonly', '');
                input.style.position = 'absolute';
                input.style.left = '-9999px';
                document.body.appendChild(input);
                input.select();
                document.execCommand('copy');
                document.body.removeChild(input);
            }

            button.classList.add('is-copied');
            if (labelEl) labelEl.textContent = 'Copied';
            showToast('URL copied');

            clearTimeout(button._resetTimer);
            button._resetTimer = setTimeout(() => {
                button.classList.remove('is-copied');
                if (labelEl) labelEl.textContent = defaultLabel;
            }, 2000);
        } catch {
            showToast('Copy failed — use the link above');
        }
    });
});
