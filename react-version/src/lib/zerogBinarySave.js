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

function readUint32LE(bytes, offset) {
  if (offset < 0 || offset + 4 > bytes.length) {
    return null;
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return view.getUint32(offset, true);
}

function asciiString(bytes, start, length) {
  if (start < 0 || start + length > bytes.length) {
    return null;
  }

  const chars = [];
  for (let i = start; i < start + length; i += 1) {
    const byte = bytes[i];
    if (byte < 32 || byte > 126) {
      return null;
    }
    chars.push(String.fromCharCode(byte));
  }

  return chars.join('');
}

function inspectOpaqueUnityBinary(bytes) {
  const magic = asciiString(bytes, 0, Math.min(4, bytes.length));
  const versionByte = bytes.length > 4 ? bytes[4] : null;
  const littleEndianWords = [];

  for (let offset = 5; offset + 4 <= bytes.length; offset += 4) {
    littleEndianWords.push({
      offset,
      value: readUint32LE(bytes, offset),
    });
  }

  const trailingBytes = Array.from(bytes.subarray(13));
  const trailingZeros = trailingBytes.every((byte) => byte === 0);

  if (magic === 'ZDSV') {
    const coins = readUint32LE(bytes, 5);
    const highScore = readUint32LE(bytes, 9);

    return {
      kind: 'unity-custom-save-header',
      magic,
      versionByte,
      primaryValue: coins,
      secondaryValue: highScore,
      coins,
      highScore,
      bestScore: highScore,
      trailingZeros,
      byteLength: bytes.byteLength,
      interpretation:
        'This looks like a tiny custom Unity save header, not a full gameplay snapshot.',
      likelyMeaning:
        'Possible layout: magic "ZDSV", serializer/schema byte 1, coins value, best-score value, then empty/default zero-filled fields.',
      caution:
        'Field names are inferred from byte layout, not from the original Unity serializer.',
    };
  }

  return {
    kind: 'opaque-binary',
    magic,
    versionByte,
    littleEndianWords,
    trailingZeros,
    byteLength: bytes.byteLength,
    interpretation:
      'Binary payload is not JSON. This summary is a structural inspection only.',
  };
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
    data: parsed?.data || inspectOpaqueUnityBinary(bytes),
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
