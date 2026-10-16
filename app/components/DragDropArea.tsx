"use client";
import JSZip from "jszip";
import { useState, useEffect, DragEvent, ChangeEvent } from "react";
interface FileInfo {
  file: File;
  size: string;
  url: string;
}

interface ConvertedInfo {
  original: FileInfo;
  url: string;
  mime: string;
  size: string;
}

export default function DragDropArea({ onValidate }: { onValidate: (files: FileList) => { valid: File[]; errors: Map<File, string> } }) {


  const [files, setFiles] = useState<FileInfo[]>([]);
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [converted, setConverted] = useState<ConvertedInfo[]>([]);
  const [outputFormat, setOutputFormat] = useState<string>('image/png');
  const supportedFormats = [
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/avif',
    'image/bmp',
    'image/svg+xml',
    'image/gif',
  ];

  const [quality, setQuality] = useState<number>(0.92);
  const [targetWidth, setTargetWidth] = useState<number>(0);
  const [targetHeight, setTargetHeight] = useState<number>(0);

  // Cleanup URLs on unmount
  useEffect(() => {
    return () => {
      files.forEach((f) => URL.revokeObjectURL(f.url));
    };
  }, [files]);

  const [status, setStatus] = useState<string>('');
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  };

    const convertFile = async (file: File) => {
    return new Promise<ConvertedInfo | null>((resolve) => {
      const originalUrl = URL.createObjectURL(file);
      // SVG safe handling
      if (file.type === 'image/svg+xml') {
        // No rasterization, treat SVG as is
        resolve({
          original: { file, size: formatSize(file.size), url: originalUrl },
          url: originalUrl,
          mime: file.type,
          size: formatSize(file.size),
        });
        return;
      }
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const width = targetWidth > 0 ? targetWidth : img.width;
        const height = targetHeight > 0 ? targetHeight : img.height;
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setErrorMessages(prev => [...prev, `Canvas not supported for ${file.name}`]);
          resolve(null);
          return;
        }
        // JPEG needs white background
        if (outputFormat === 'image/jpeg') {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
        }
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(async (blob) => {
          if (!blob) {
            setErrorMessages(prev => [...prev, `Conversion failed for ${file.name}`]);
            resolve(null);
            return;
          }
          // Validate MIME
          if (blob.type !== outputFormat) {
            setErrorMessages(prev => [...prev, `Requested ${outputFormat} but got ${blob.type} for ${file.name}`]);
          }
          const url = URL.createObjectURL(blob);
          const sizeStr = formatSize(blob.size);
          resolve({
            original: { file, size: formatSize(file.size), url: originalUrl },
            url,
            mime: blob.type,
            size: sizeStr,
          });
        }, outputFormat, (outputFormat === 'image/jpeg' || outputFormat === 'image/webp' || outputFormat === 'image/avif') ? quality : undefined);
      };
      img.onerror = () => {
        setErrorMessages(prev => [...prev, `Failed to load image ${file.name}`]);
        resolve(null);
      };
      // GIF animation note
      if (file.type === 'image/gif') {
        setErrorMessages(prev => [...prev, `GIF animation will be converted to static image for ${file.name}`]);
      }
      img.src = originalUrl;
    });
  };

  // UI: output format selector & controls
  const formatControls = (
    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
      <label className="block">
        <span className="text-[#302E29] text-sm font-medium">Format output:</span>
        <select
          value={outputFormat}
          onChange={e => setOutputFormat(e.target.value)}
          className="mt-1 block w-full border rounded px-3 py-2 bg-[#FFFEFB] border-[#D8D0C4]"
        >
          {supportedFormats.map(fmt => (
            <option key={fmt} value={fmt}>{fmt.replace('image/', '').toUpperCase()}</option>
          ))}
        </select>
      </label>
      {(outputFormat === 'image/jpeg' || outputFormat === 'image/webp' || outputFormat === 'image/avif') && (
        <label className="block">
          <span className="text-[#302E29] text-sm font-medium">Kualitas (0‑1):</span>
          <input
            type="number"
            min="0"
            max="1"
            step="0.05"
            value={quality}
            onChange={e => setQuality(parseFloat(e.target.value))}
            className="mt-1 block w-full border rounded px-3 py-2 bg-[#FFFEFB] border-[#D8D0C4]"
          />
        </label>
      )}
      <label className="block">
        <span className="text-[#302E29] text-sm font-medium">Lebar (px, 0 = auto):</span>
        <input
          type="number"
          min="0"
          value={targetWidth}
          onChange={e => setTargetWidth(parseInt(e.target.value) || 0)}
          className="mt-1 block w-full border rounded px-3 py-2 bg-[#FFFEFB] border-[#D8D0C4]"
        />
      </label>
      <label className="block">
        <span className="text-[#302E29] text-sm font-medium">Tinggi (px, 0 = auto):</span>
        <input
          type="number"
          min="0"
          value={targetHeight}
          onChange={e => setTargetHeight(parseInt(e.target.value) || 0)}
          className="mt-1 block w-full border rounded px-3 py-2 bg-[#FFFEFB] border-[#D8D0C4]"
        />
      </label>
    </div>
  );


  const addFiles = async (fileList: FileList) => {
    const { valid, errors } = onValidate(fileList);
    const newErrs: string[] = [];
    errors.forEach((msg: string) => newErrs.push(msg));
    setErrorMessages(prev => [...prev, ...newErrs]);

    const newFiles: FileInfo[] = valid.map((f: File) => ({
      file: f,
      size: formatSize(f.size),
      url: URL.createObjectURL(f),
    }));
    setFiles(prev => [...prev, ...newFiles]);

    // Convert each valid file
    const conversions = await Promise.all(valid.map(f => convertFile(f)));
    const successful = conversions.filter((c): c is ConvertedInfo => c !== null);
    setConverted(prev => [...prev, ...successful]);
  };


  const onDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
      e.dataTransfer.clearData();
    }
  };

  const onDragOver = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
  };

  const triggerConvert = async () => {
    if (files.length === 0) {
      setStatus('Tidak ada file untuk konversi');
      return;
    }
    setStatus('Mengonversi...');
    // Run conversion with current settings on all uploaded files
    const conversions = await Promise.all(files.map(f => convertFile(f.file)));
    const successful = conversions.filter((c): c is ConvertedInfo => c !== null);
    setConverted(successful);
    setStatus('Konversi selesai');
  };

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(e.target.files);
      e.target.value = ""; // allow re‑select same file
    }
  };

  const handleDownloadAll = async () => {
    if (converted.length === 0) {
      setStatus('Tidak ada file yang berhasil dikonversi');
      return;
    }
    setStatus('Membuat ZIP...');
    const zip = new JSZip();
    for (let i = 0; i < converted.length; i++) {
      const c = converted[i];
      const url = c.url;
      const mime = c.mime;
      const ext = mime.split('/')[1] || 'bin';
      const baseName = c.original.file.name.replace(/\\.[^/.]+$/, '');
      const safeName = `${baseName}_${i}.${ext}`;
      const blob = await fetch(url).then(r => r.blob());
      zip.file(safeName, blob);
    }
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const zipUrl = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = zipUrl;
    a.download = 'konversi.zip';
    a.click();
    URL.revokeObjectURL(zipUrl);
    setStatus('ZIP siap diunduh');
  };

  return (
    <div className="flex flex-col w-full max-w-5xl mx-auto gap-8 p-6 bg-[#FFFEFB] rounded-lg border border-[#D8D0C4] lg:flex-row">
      {/* Upload area and file list – left column */}
      <div className="flex-1 flex flex-col lg:w-1/3">

        <label
          htmlFor="file-input"
          className="border-2 border-dashed border-[#D8D0C4] rounded-lg p-12 flex flex-col items-center justify-center text-center cursor-pointer bg-[#FFFEFB] hover:bg-[#E9E0D3]/10 focus:outline-none focus:ring-2 focus:ring-[#A9573F]"
          onDrop={onDrop}
          onDragOver={onDragOver}
        >
          <p className="text-[#34483D] font-medium mb-4">Tarik &amp; lepas gambar atau klik untuk pilih</p>
          <button type="button" className="mt-2 bg-[#A9573F] text-white py-2 px-6 rounded hover:bg-[#8F4531] focus:outline-none focus:ring-2 focus:ring-[#8F4531]">Browse Files</button>
          <input
            id="file-input"
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={onFileChange}
          />
        </label>
        {/* File list */}
        <ul className="list-disc list-inside text-sm space-y-1">
          {files.map((info, i) => (
            <li key={i} className="flex justify-between items-center">
              <span className="text-[#302E29] truncate" title={info.file.name}>{info.file.name}</span>
              <span className="text-[#625C53] whitespace-nowrap ml-2">{info.size}</span>
            </li>
          ))}
        </ul>
      </div>
      {/* Settings and Convert – right column */}
      <div className="flex-1 flex flex-col">
        {formatControls}
        <button
          onClick={triggerConvert}
          disabled={files.length === 0}
          className={`mt-6 w-full max-w-xs mx-auto py-2 rounded ${files.length === 0 ? 'bg-[#A9573F]/30 cursor-not-allowed' : 'bg-[#A9573F] hover:bg-[#8F4531]'} text-white focus:outline-none focus:ring-2 focus:ring-[#A9573F]`}
        >
          Convert
        </button>
      </div>
      {status && (
        <div className="text-blue-600" role="status">{status}</div>
      )}
      {errorMessages.map((msg,i)=>(
        <div key={i} className="text-red-600 text-sm" role="alert">{msg}</div>
      ))}
      {converted.length > 0 && (
        <>
          <div className="mt-6 w-full">
            <h2 className="text-lg font-semibold mb-2" style={{ color: '#302E29' }}>Hasil konversi</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {converted.map((c, i) => (
                <div key={i} className="border p-2 rounded">
                  <img src={c.url} alt={c.original.file.name} className="max-w-full h-auto mb-2" />
                  <p className="text-[#625C53] text-sm">{c.original.file.name} → {c.mime.split('/')[1].toUpperCase()}</p>
                  <a href={c.url} download={`${c.original.file.name}_converted.${c.mime.split('/')[1]}`} className="inline-block mt-1 text-[#0F766E] underline">Download</a>
                </div>
              ))}
            </div>
            <button onClick={handleDownloadAll} className="mt-4 w-full bg-[#A9573F] text-white py-2 rounded hover:bg-[#8F4531]">
              Download All as ZIP
            </button>
          </div>
        </>
      )}
    </div>
  );
}

