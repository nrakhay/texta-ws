// Converts Float32Array of audio data to PCM16 ArrayBuffer
const floatTo16BitPCM = (float32Array) => {
  // Ensure audio is normalized between -1 and 1
  const scale = Math.max(...Array.from(float32Array).map(Math.abs));
  const normalizedArray =
    scale > 1 ? float32Array.map((x) => x / scale) : float32Array;

  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);

  for (let i = 0; i < normalizedArray.length; i++) {
    const s = Math.max(-1, Math.min(1, normalizedArray[i]));
    // Convert to 16-bit signed integer
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return buffer;
};

// Converts a Float32Array to base64-encoded PCM16 data
export const base64EncodeAudio = (float32Array) => {
  const pcmBuffer = floatTo16BitPCM(float32Array);
  return Buffer.from(pcmBuffer).toString("base64");
};

export const base64ToArrayBuffer = (base64) => {
  const buffer = Buffer.from(base64, "base64");
  return buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength
  );
};
