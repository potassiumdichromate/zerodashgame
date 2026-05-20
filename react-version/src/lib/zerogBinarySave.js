const utf8Decoder = new TextDecoder('utf-8');

function safeJsonParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function toBase64(bytes) {
  let binary = '';
  const chunkSize = 0x8000;

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
}

function hexPreview(bytes, limit = 24) {
  return Array.from(bytes.subarray(0, limit), (byte) =>
    byte.toString(16).padStart(2, '0')
  ).join(' ');
}

function parseBase64Json(text) {
  const compact = text.replace(/\s+/g, '');
  if (!compact || compact.length % 4 !== 0 || !/^[A-Za-z0-9+/=]+$/.test(compact)) {
    return null;
  }

  try {
    const decoded = atob(compact);
    const bytes = Uint8Array.from(decoded, (char) => char.charCodeAt(0));
    const jsonText = utf8Decoder.decode(bytes).trim();
    const data = safeJsonParse(jsonText);

    if (data == null) {
      return null;
    }

    return {
      format: 'json-base64',
      text: jsonText,
      data,
    };
  } catch {
    return null;
  }
}

export async function deserializePlayerBinaryResponse(response) {
  const buffer = await response.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const text = utf8Decoder.decode(bytes).trim();
  const directJson = text ? safeJsonParse(text) : null;
  const base64Json = !directJson && text ? parseBase64Json(text) : null;

  const parsed = directJson != null
    ? { format: 'json-utf8', text, data: directJson }
    : base64Json;

  return {
    ok: parsed != null,
    format: parsed?.format || 'opaque-binary',
    data: parsed?.data || null,
    textPreview: (parsed?.text || text || '').slice(0, 240),
    rawBase64: toBase64(bytes),
    meta: {
      byteLength: bytes.byteLength,
      contentType: response.headers.get('content-type'),
      rootHash: response.headers.get('X-Root-Hash'),
      saveIndex: response.headers.get('X-Save-Index'),
      daStatus: response.headers.get('X-Da-Status'),
      checksumSha256: response.headers.get('X-Checksum-Sha256'),
      hexPreview: hexPreview(bytes),
    },
  };
}
