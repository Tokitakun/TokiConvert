/**
 * Video Processing Hook for TokiConvert
 * Uses FFmpeg WASM for client-side video conversion
 * 100% privacy-first — no server upload
 */
import { useState, useRef, useCallback } from 'react';

// TypeScript declarations for FFmpeg WASM types
interface FFmpeg {
  load: () => Promise<void>;
  isLoaded: () => boolean;
  run: (...args: string[]) => Promise<void>;
  FS: (method: string, ...args: unknown[]) => unknown;
  setProgress: (cb: (p: number) => void) => void;
  setLogger: (cb: (log: { type: string; message: string }) => void) => void;
  setLogging: (enable: boolean) => void;
  exit: () => void;
}

// Singleton loader promise
let loadPromise: Promise<FFmpeg> | null = null;

const loadFFmpeg = async (): Promise<FFmpeg> => {
  if (!loadPromise) {
    loadPromise = (async () => {
      const { createFFmpeg } = await import('@ffmpeg/ffmpeg');
      const ffmpeg = createFFmpeg({
        log: false,
        progress: () => {}, // akan di-set oleh hook
      });
      await ffmpeg.load();
      return ffmpeg as unknown as FFmpeg;
    })();
  }
  return loadPromise;
};

export function useVideoProcessor() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'processing' | 'done' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const prevBlobRef = useRef<string | null>(null);
  const ffmpegRef = useRef<FFmpeg | null>(null);

  const processVideo = useCallback(async (file: File, outputFormat: string) => {
    try {
      // Clean previous state
      if (prevBlobRef.current) {
        URL.revokeObjectURL(prevBlobRef.current);
        prevBlobRef.current = null;
      }
      setResultUrl(null);
      setStatus('loading');
      setProgress(0);
      setError(null);

      // Ensure FFmpeg is loaded
      if (!ffmpegRef.current) {
        ffmpegRef.current = await loadFFmpeg();
        ffmpegRef.current.setProgress((p: number) => {
          setProgress(Math.round(p * 100));
        });
      }

      setStatus('processing');

      // Read file into FFmpeg virtual filesystem
      const arrayBuffer = await file.arrayBuffer();
      const inputName = 'input.' + file.name.split('.').pop();
      ffmpegRef.current.FS('writeFile', inputName, new Uint8Array(arrayBuffer));

      // Build FFmpeg command
      const outputName = 'output.' + outputFormat;
      const args = [
        '-i', inputName,
        '-c:v', 'libx264',      // H.264 video codec (widely supported)
        '-c:a', 'aac',           // AAC audio codec
        '-pix_fmt', 'yuv420p',   // Standard pixel format
        outputName
      ];

      // Run conversion
      await ffmpegRef.current.run(...args);

      // Read result back
      const data = ffmpegRef.current.FS('readFile', outputName) as Uint8Array;
      const blob = new Blob([data as unknown as BlobPart], { type: `video/${outputFormat}` });
      const url = URL.createObjectURL(blob);
      prevBlobRef.current = url;
      setResultUrl(url);

      // Cleanup temporary file
      ffmpegRef.current.FS('unlink', inputName);
      ffmpegRef.current.FS('unlink', outputName);

      setStatus('done');
      return url;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Video conversion failed';
      setError(message);
      setStatus('error');
      throw err;
    }
  }, []);

  const reset = useCallback(() => {
    if (prevBlobRef.current) {
      URL.revokeObjectURL(prevBlobRef.current);
      prevBlobRef.current = null;
    }
    setStatus('idle');
    setProgress(0);
    setError(null);
    setResultUrl(null);
    if (ffmpegRef.current) {
      ffmpegRef.current.exit(); // reset instance for clean state
      ffmpegRef.current = null;
      loadPromise = null;
    }
  }, []);

  // Cleanup on unmount
  // useEffect(() => () => {
  //   if (prevBlobRef.current) URL.revokeObjectURL(prevBlobRef.current);
  //   if (ffmpegRef.current) ffmpegRef.current.exit();
  // }, []);

  return {
    status,
    progress,
    error,
    resultUrl,
    processVideo,
    reset,
  };
}
