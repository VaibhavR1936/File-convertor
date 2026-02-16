// client/src/components/ImageConverter.jsx
import React, { useState, useRef } from 'react';

const IMAGE_EXTS = ['png', 'jpg', 'jpeg', 'webp'];

export default function ImageConverter({ onBack }) {
    const [localQueue, setLocalQueue] = useState([]);
    const fileInput = useRef();

    function extFromName(name) {
        const p = (name || '').split('.');
        if (p.length < 2) return '';
        return p.pop().toLowerCase();
    }

    function isAllowedExt(nameOrFile) {
        const name = typeof nameOrFile === 'string' ? nameOrFile : (nameOrFile.name || '');
        const ext = extFromName(name);
        return IMAGE_EXTS.includes(ext);
    }

    function formatSize(bytes) {
        if (!bytes) return '';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    function handleFilesPicked(list) {
        const files = Array.from(list || []);
        const filtered = files.filter(f => isAllowedExt(f.name));
        if (filtered.length === 0) {
            alert('Please select image files only (JPG / PNG / WEBP).');
            return;
        }

        const items = filtered.map((f, idx) => {
            const ext = extFromName(f.name).toUpperCase() || 'IMG';
            return {
                id: Date.now() + '-' + idx + '-' + Math.random().toString(36).slice(2, 7),
                file: f,
                name: f.name,
                size: f.size,
                inputFormat: ext,
                outputFormat: 'PNG', // default
                status: 'ready'
            };
        });

        setLocalQueue(prev => [...prev, ...items]);
    }

    function updateLocalFile(id, patch) {
        setLocalQueue(prev => prev.map(x => x.id === id ? { ...x, ...patch } : x));
    }

    function mimeFromOutput(outFmt) {
        const f = (outFmt || '').toUpperCase();
        if (f === 'PNG') return 'image/png';
        if (f === 'WEBP') return 'image/webp';
        return 'image/jpeg'; // JPG
    }

    function extFromOutput(outFmt) {
        const f = (outFmt || '').toUpperCase();
        if (f === 'PNG') return 'png';
        if (f === 'WEBP') return 'webp';
        return 'jpg';
    }

    async function convertSingle(item) {
        updateLocalFile(item.id, { status: 'converting' });
        try {
            const blob = await convertImageFileTo(item.file, item.outputFormat);
            const outExt = extFromOutput(item.outputFormat);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = item.name.replace(/\.[^.]+$/, '') + '.' + outExt;
            a.click();
            URL.revokeObjectURL(url);
            updateLocalFile(item.id, { status: 'done' });
        } catch (e) {
            console.error('image convert error', e);
            updateLocalFile(item.id, { status: 'failed' });
        }
    }

    function convertAll() {
        localQueue.forEach(item => {
            if (item.status === 'ready' || item.status === 'failed') convertSingle(item);
        });
    }

    function removeLocal(id) {
        setLocalQueue(prev => prev.filter(x => x.id !== id));
    }

    function convertImageFileTo(file, outFmt) {
        const mime = mimeFromOutput(outFmt);
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                canvas.toBlob(blob => {
                    if (!blob) return reject(new Error('Conversion failed'));
                    resolve(blob);
                }, mime, 0.92);
            };
            img.onerror = e => reject(e);
            const reader = new FileReader();
            reader.onload = ev => { img.src = ev.target.result; };
            reader.readAsDataURL(file);
        });
    }

    return (
        <div style={{ padding: 12 }}>
            {/* header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ margin: 0 }}>Image Converter</h2>
                    <p style={{ margin: '6px 0 0', color: '#6b7280' }}>
                        Upload images (JPG / PNG / WEBP). Choose output after adding to queue.
                    </p>
                </div>

                <div>
                    <button
                        onClick={() => (typeof onBack === 'function' ? onBack() : (window.location.href = '/'))}
                        style={{ padding: '8px 12px', borderRadius: 8 }}
                    >
                        ← Back
                    </button>
                </div>
            </div>

            {/* upload area */}
            <div
                onDrop={(e) => { e.preventDefault(); handleFilesPicked(e.dataTransfer.files); }}
                onDragOver={(e) => e.preventDefault()}
                style={{
                    border: '4px dashed rgba(140,130,200,0.25)',
                    minHeight: 160,
                    borderRadius: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    background: '#fff',
                    marginTop: 18
                }}
            >
                <div style={{ fontSize: 28 }}>📤</div>

                <div style={{ marginTop: 8 }}>
                    <button
                        onClick={() => fileInput.current && fileInput.current.click()}
                        style={{ padding: '8px 12px', borderRadius: 8 }}
                    >
                        Drag & Drop Images Here
                    </button>

                    <input
                        ref={fileInput}
                        onChange={(e) => handleFilesPicked(e.target.files)}
                        type="file"
                        multiple
                        accept="image/*"
                        style={{ display: 'none' }}
                    />
                </div>

                <div style={{ marginTop: 8, color: '#9ca3af' }}>or click to browse</div>
            </div>

            {/* Local Queue */}
            <div style={{ marginTop: 18, background: '#fff', padding: 12, borderRadius: 12, border: '1px solid #eee' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong>Local Queue (choose output & convert)</strong>
                    <div><button onClick={convertAll} style={{ padding: '6px 10px', borderRadius: 8 }}>Convert All</button></div>
                </div>

                <div style={{ marginTop: 12 }}>
                    {localQueue.length === 0 && (
                        <div style={{ color: '#9ca3af' }}>
                            No files queued yet — add files to the box above.
                        </div>
                    )}

                    {localQueue.map(item => (
                        <div
                            key={item.id}
                            style={{
                                display: 'flex',
                                gap: 12,
                                alignItems: 'center',
                                border: '1px solid #f1f1f4',
                                padding: 10,
                                borderRadius: 8,
                                marginTop: 8
                            }}
                        >
                            <div style={{
                                width: 64,
                                height: 64,
                                borderRadius: 8,
                                background: '#f8fafc',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <div style={{ fontWeight: 700 }}>{(item.inputFormat || 'IMG').slice(0, 4)}</div>
                            </div>

                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 700 }}>{item.name}</div>
                                <div style={{ color: '#9ca3af', fontSize: 13 }}>{formatSize(item.size)}</div>

                                <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
                                    <div style={{ fontSize: 12, padding: '4px 8px', borderRadius: 999, border: '1px solid #eee' }}>
                                        {item.inputFormat}
                                    </div>
                                    <div>→</div>
                                    <select
                                        value={item.outputFormat}
                                        onChange={(e) => updateLocalFile(item.id, { outputFormat: e.target.value })}
                                        style={{ padding: '6px 8px', borderRadius: 8 }}
                                    >
                                        {['PNG', 'JPG', 'WEBP'].map(o => <option key={o} value={o}>{o}</option>)}
                                    </select>

                                    <div style={{
                                        marginLeft: 10,
                                        color: item.status === 'converting'
                                            ? '#f59e0b'
                                            : item.status === 'done'
                                                ? '#10b981'
                                                : item.status === 'failed'
                                                    ? '#ef4444'
                                                    : '#6b7280'
                                    }}>
                                        {item.status}
                                    </div>
                                </div>

                                <div style={{ marginTop: 8 }}>
                                    <button
                                        onClick={() => convertSingle(item)}
                                        style={{ padding: '6px 10px', borderRadius: 8, marginRight: 8 }}
                                    >
                                        Convert
                                    </button>
                                    <button
                                        onClick={() => removeLocal(item.id)}
                                        style={{ padding: '6px 10px', borderRadius: 8 }}
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* optional “Server Queue” card just for consistent layout */}
            <div style={{ marginTop: 18, background: '#fff', padding: 12, borderRadius: 12, border: '1px solid #eee' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong>Server Queue</strong>
                    <div><button disabled style={{ padding: '6px 10px', borderRadius: 8, opacity: 0.5 }}>Refresh</button></div>
                </div>
                <div style={{ marginTop: 12, color: '#9ca3af' }}>
                    Image conversions run locally in your browser, so there is no server queue.
                </div>
            </div>
        </div>
    );
}
