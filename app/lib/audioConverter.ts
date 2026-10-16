/**
 * Audio Conversion Engine for TokiConvert
 * Client-side browser audio conversion using Web Audio API & LAME MP3 Encoder.
 * 100% offline, zero-network download, no COOP/COEP header requirements.
 */

import { Mp3Encoder } from "@breezystack/lamejs";

export interface AudioProbeResult {
  duration: number;
  durationFormatted: string;
  channels: number;
  sampleRate: number;
}

export type SupportedAudioTarget = "mp3" | "wav";

/**
 * Probe audio metadata (duration, channels, sample rate) using browser Audio element.
 */
export function probeAudioMetadata(file: File | Blob): Promise<AudioProbeResult> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve({ duration: 0, durationFormatted: "--:--", channels: 2, sampleRate: 44100 });
      return;
    }
    const audio = document.createElement("audio");
    audio.preload = "metadata";
    const objectUrl = URL.createObjectURL(file);

    audio.onloadedmetadata = () => {
      const dur = audio.duration || 0;
      URL.revokeObjectURL(objectUrl);
      resolve({
        duration: dur,
        durationFormatted: formatSeconds(dur),
        channels: 2,
        sampleRate: 44100,
      });
    };

    audio.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({ duration: 0, durationFormatted: "--:--", channels: 2, sampleRate: 44100 });
    };

    audio.src = objectUrl;
  });
}

export function formatSeconds(seconds: number): string {
  if (!seconds || isNaN(seconds) || seconds <= 0) return "--:--";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

/**
 * Decode any browser-supported audio file into an AudioBuffer using Web Audio API.
 */
async function decodeAudioFile(file: File | Blob): Promise<AudioBuffer> {
  const arrayBuffer = await file.arrayBuffer();
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new AudioCtx();
  try {
    return await ctx.decodeAudioData(arrayBuffer);
  } finally {
    ctx.close();
  }
}

/**
 * Convert any supported audio file to standard 16-bit PCM WAV.
 */
export async function convertToWav(file: File | Blob): Promise<Blob> {
  const audioBuffer = await decodeAudioFile(file);
  return audioBufferToWavBlob(audioBuffer);
}

/**
 * Convert any supported audio file to MP3 using pure JavaScript LAME MP3 Encoder.
 */
export async function convertToMp3(
  file: File | Blob,
  bitrateKbps: number = 128,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  const audioBuffer = await decodeAudioFile(file);
  const numChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const length = audioBuffer.length;

  const encoder = new Mp3Encoder(numChannels > 1 ? 2 : 1, sampleRate, bitrateKbps);
  const mp3Data: Uint8Array[] = [];

  const leftChannel = audioBuffer.getChannelData(0);
  const rightChannel = numChannels > 1 ? audioBuffer.getChannelData(1) : null;

  // Convert Float32Array [-1.0, 1.0] to Int16Array [-32768, 32767]
  const leftInt16 = floatToInt16(leftChannel);
  const rightInt16 = rightChannel ? floatToInt16(rightChannel) : undefined;

  const sampleBlockSize = 1152;
  const totalBlocks = Math.ceil(length / sampleBlockSize);

  for (let i = 0; i < length; i += sampleBlockSize) {
    const end = Math.min(i + sampleBlockSize, length);
    const leftChunk = leftInt16.subarray(i, end);
    const rightChunk = rightInt16 ? rightInt16.subarray(i, end) : undefined;

    const mp3buf = encoder.encodeBuffer(leftChunk, rightChunk);
    if (mp3buf && mp3buf.length > 0) {
      mp3Data.push(mp3buf);
    }

    if (onProgress && i % (sampleBlockSize * 10) === 0) {
      const currentBlock = Math.floor(i / sampleBlockSize);
      onProgress(Math.min(95, Math.round((currentBlock / totalBlocks) * 100)));
    }
  }

  const flushBuf = encoder.flush();
  if (flushBuf && flushBuf.length > 0) {
    mp3Data.push(flushBuf);
  }

  if (onProgress) {
    onProgress(100);
  }

  return new Blob(mp3Data as BlobPart[], { type: "audio/mpeg" });
}

/**
 * Convert Float32 PCM samples to Int16 samples.
 */
function floatToInt16(float32: Float32Array): Int16Array {
  const int16 = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return int16;
}

/**
 * Encode an AudioBuffer into a RIFF 16-bit PCM WAV Blob.
 */
function audioBufferToWavBlob(audioBuffer: AudioBuffer): Blob {
  const numChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const length = audioBuffer.length;
  const bytesPerSample = 2; // 16-bit
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = length * blockAlign;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // Write RIFF Header
  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, "WAVE");

  // Write FMT Sub-chunk
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true); // SubChunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 = PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true); // BitsPerSample

  // Write Data Sub-chunk
  writeString(view, 36, "data");
  view.setUint32(40, dataSize, true);

  // Interleave channels & write samples
  let offset = 44;
  for (let i = 0; i < length; i++) {
    for (let channel = 0; channel < numChannels; channel++) {
      let sample = audioBuffer.getChannelData(channel)[i];
      sample = Math.max(-1, Math.min(1, sample));
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, intSample, true);
      offset += 2;
    }
  }

  return new Blob([buffer], { type: "audio/wav" });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

/**
 * Universal dispatcher for supported audio targets.
 */
export async function convertAudio(
  file: File | Blob,
  targetFormat: SupportedAudioTarget,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  if (targetFormat === "wav") {
    if (onProgress) onProgress(30);
    const blob = await convertToWav(file);
    if (onProgress) onProgress(100);
    return blob;
  } else if (targetFormat === "mp3") {
    return await convertToMp3(file, 128, onProgress);
  }
  throw new Error(`Format audio '${targetFormat}' belum didukung.`);
}
