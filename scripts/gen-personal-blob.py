import hashlib, base64, json, os
from pathlib import Path
from Crypto.Cipher import AES

root = Path('/Users/khan/Projects/DrRezKhan')
env_value = (root / '.env.local').read_text(encoding='utf-8').split('=', 1)[1].strip().strip('"')
password = env_value

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
print(json.dumps(blob, separators=(',', ':')))
