import base64
import json
import os
import re
from pathlib import Path
from Crypto.Cipher import AES
import hashlib

root = Path(__file__).resolve().parents[1]
build_dir = root / 'build'
personal_build_dir = build_dir / 'personal'
personal_build_dir.mkdir(parents=True, exist_ok=True)
(root / 'scripts').mkdir(parents=True, exist_ok=True)

env_path = root / '.env.local'
if not env_path.exists():
    raise SystemExit('Missing .env.local with PASSWORD_KEY')
password = env_path.read_text(encoding='utf-8').split('=', 1)[1].strip().strip('"')

salt = os.urandom(16)
iv = os.urandom(12)
plain = '<html><body><ul><li>Family updated 3 Oct 2025</li><li>Travel diary entry 2 Oct 2025</li></ul></body></html>'
key = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 120000, dklen=32)
cipher = AES.new(key, AES.MODE_GCM, nonce=iv)
ciphertext, tag = cipher.encrypt_and_digest(plain.encode('utf-8'))
blob = {
    'salt': base64.b64encode(salt).decode(),
    'iv': base64.b64encode(iv).decode(),
    'ct': base64.b64encode(ciphertext + tag).decode(),
}
blob_json = json.dumps(blob, separators=(',', ':'))
blob_tag = f'<script id="personal-blob" type="application/json">{blob_json}</script>'

(root / 'scripts' / 'personal-password.txt').write_text(password, encoding='utf-8')

def sync_personal_page(text: str) -> str:
    text = re.sub(r"\n\s*const SHA256_HEX = '[^']+';\n", '\n', text)
    if re.search(r'<script id="personal-blob"[^>]*>.*?</script>', text, flags=re.S):
        text = re.sub(r'<script id="personal-blob"[^>]*>.*?</script>', blob_tag, text, count=1, flags=re.S)
    else:
        text = text.replace('<script>\n    const PERSONAL_SESSION_KEY', blob_tag + '\n  <script>\n    const PERSONAL_SESSION_KEY', 1)
    return text

def sync_root_page(text: str) -> str:
    text = re.sub(r"\n\s*const PERSONAL_PASSWORD_SHA256 = '[^']+';\n", '\n', text)
    if re.search(r'<script id="personal-blob"[^>]*>.*?</script>', text, flags=re.S):
        text = re.sub(r'<script id="personal-blob"[^>]*>.*?</script>', blob_tag, text, count=1, flags=re.S)
    else:
        text = text.replace('</body>', blob_tag + '\n</body>', 1)
    return text

personal_src = sync_personal_page((root / 'personal' / 'index.html').read_text(encoding='utf-8'))
(root / 'personal' / 'index.html').write_text(personal_src, encoding='utf-8')
(personal_build_dir / 'index.html').write_text(personal_src, encoding='utf-8')

root_src = sync_root_page((root / 'index.html').read_text(encoding='utf-8'))
(root / 'index.html').write_text(root_src, encoding='utf-8')
(build_dir / 'index.html').write_text(root_src, encoding='utf-8')

print('password=', password)
print('blob=', blob_json)
