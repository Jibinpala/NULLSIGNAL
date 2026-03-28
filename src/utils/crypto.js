// Using Web Crypto API for Professional AES-GCM Encryption
const ALGORITHM = 'AES-GCM';

export const generateKey = async () => {
  return await window.crypto.subtle.generateKey(
    { name: ALGORITHM, length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
};

export const encryptMessage = async (text, key) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await window.crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    data
  );
  
  return {
    cipherText: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
    iv: btoa(String.fromCharCode(...iv))
  };
};

export const decryptMessage = async (cipherObj, key) => {
  const cipherText = Uint8Array.from(atob(cipherObj.cipherText), c => c.charCodeAt(0));
  const iv = Uint8Array.from(atob(cipherObj.iv), c => c.charCodeAt(0));
  
  const decrypted = await window.crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    key,
    cipherText
  );
  
  return new TextDecoder().decode(decrypted);
};

// Derive a Master Key from a PIN using PBKDF2
export const deriveMasterKey = async (pin, salt) => {
  const encoder = new TextEncoder();
  const pinData = encoder.encode(pin);
  const saltData = salt || window.crypto.getRandomValues(new Uint8Array(16));
  
  const baseKey = await window.crypto.subtle.importKey(
    'raw',
    pinData,
    'PBKDF2',
    false,
    ['deriveKey']
  );
  
  const key = await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltData,
      iterations: 100000,
      hash: 'SHA-256'
    },
    baseKey,
    { name: ALGORITHM, length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
  
  return { key, salt: btoa(String.fromCharCode(...saltData)) };
};

// Simplified shared secret derivation for P2P Handshake
export const deriveSecretKey = async (peerIdA, peerIdB) => {
  // In a real app, you'd use Diffie-Hellman (ECDH)
  // For this prototype, we'll derive a stable key from the combined IDs
  const combined = [peerIdA, peerIdB].sort().join(':');
  const encoder = new TextEncoder();
  const data = encoder.encode(combined);
  const hash = await window.crypto.subtle.digest('SHA-256', data);
  
  return await window.crypto.subtle.importKey(
    'raw',
    hash,
    { name: ALGORITHM },
    false,
    ['encrypt', 'decrypt']
  );
};
