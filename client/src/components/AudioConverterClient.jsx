// client/src/components/AudioConverter.jsx
import React, { useState, useRef } from 'react';

const AUDIO_OPTS = ['mp3', 'wav', 'aac'];

export default function AudioConverter({ onBack }) {
    const fileInput = useRef();
    const [queue, setQueue] = useState([]);
    const [busy, setBusy] = useState(false);

    const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:4000';

    function formatSize(bytes) {
        if (!bytes) return '';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    function handleFilesPicked(list) {
        const files = Array.from(list || []).filter(
            f => f.type.startsWith('audio/') || /\.(mp3|wav|m4a|aac|flac|ogg)$/i.test(f.name)
        );
        if (!files.length) {
            alert('Please select audio files only.');
            return;
        }
        const items = files.map((f, i) => ({
            id: Date.now() + '-' + i,
            file: f,
            name: f.name,
            size: f.size,
            outputFormat: 'mp3',
            status: 'ready'
        }));
        setQueue(prev => [...prev, ...items]);
    }

    function updateItem(id, patch) {
        setQueue(prev => prev.map(it => it.id === id ? { ...it, ...patch } : it));
    }

    async function convertOne(item) {
        try {
            setBusy(true);
            updateItem(item.id, { status: 'converting' });

            const fd = new FormData();
            fd.append('file', item.file);
            fd.append('outputFormat', item.outputFormat);

            const resp = await fetch(`${API_BASE}/api/convert/audio`, {
                method: 'POST',
                body: fd
            });

            if (!resp.ok) {
                updateItem(item.id, { status: 'failed' });
                return;
            }

            const blob = await resp.blob();
            const url = URL.createObjectURL(blob);
            const ext = item.outputFormat.toLowerCase();
            const a = document.createElement('a');
            a.href = url;
            a.download = item.name.replace(/\.[^.]+$/, '') + '.' + ext;
            a.click();
            URL.revokeObjectURL(url);

            updateItem(item.id, { status: 'done' });
        } catch (e) {
            console.error('audio convert error', e);
            updateItem(item.id, { status: 'failed' });
        } finally {
            setBusy(false);
        }
    }

    function convertAll() {
        queue.forEach(it => {
            if (it.status === 'ready' || it.status === 'failed') convertOne(it);
        });
    }

    function removeItem(id) {
        setQueue(prev => prev.filter(it => it.id !== id));
    }

    return (
        <div style={{ padding: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ margin: 0 }}>Audio Converter</h2>
                    <p style={{ margin: '6px 0 0', color: '#6b7280' }}>
                        Upload audio files (MP3 / WAV / AAC). Choose output after adding to queue.
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
                        Drag & Drop Audio Files Here
                    </button>
                    <input
                        ref={fileInput}
                        type="file"
                        multiple
                        accept="audio/*"
                        style={{ display: 'none' }}
                        onChange={e => handleFilesPicked(e.target.files)}
                    />
                </div>
                <div style={{ marginTop: 8, color: '#9ca3af' }}>or click to browse</div>
            </div>

            <div style={{ marginTop: 18, background: '#fff', padding: 12, borderRadius: 12, border: '1px solid #eee' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong>Local Queue (choose output & convert)</strong>
                    <div>
                        <button
                            onClick={convertAll}
                            style={{ padding: '6px 10px', borderRadius: 8 }}
                            disabled={busy}
                        >
                            {busy ? 'Working…' : 'Convert All'}
                        </button>
                    </div>
                </div>

                <div style={{ marginTop: 12 }}>
                    {queue.length === 0 && (
                        <div style={{ color: '#9ca3af' }}>No files queued yet — add files to the box above.</div>
                    )}

                    {queue.map(item => (
                        <div key={item.id} style={{ display: 'flex', gap: 12, alignItems: 'center', border: '1px solid #f1f1f4', padding: 10, borderRadius: 8, marginTop: 8 }}>
                            <div style={{ width: 64, height: 64, borderRadius: 8, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <div style={{ fontWeight: 700 }}>AUD</div>
                            </div>

                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 700 }}>{item.name}</div>
                                <div style={{ color: '#9ca3af', fontSize: 13 }}>{formatSize(item.size)}</div>

                                <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
                                    <div>→</div>
                                    <select
                                        value={item.outputFormat}
                                        onChange={e => updateItem(item.id, { outputFormat: e.target.value })}
                                        style={{ padding: '6px 8px', borderRadius: 8 }}
                                    >
                                        {AUDIO_OPTS.map(o => (
                                            <option key={o} value={o}>{o.toUpperCase()}</option>
                                        ))}
                                    </select>
                                    <div style={{ marginLeft: 10, color: '#6b7280' }}>{item.status}</div>
                                </div>

                                <div style={{ marginTop: 8 }}>
                                    <button
                                        onClick={() => convertOne(item)}
                                        style={{ padding: '6px 10px', borderRadius: 8, marginRight: 8 }}
                                        disabled={busy}
                                    >
                                        Convert
                                    </button>
                                    <button
                                        onClick={() => removeItem(item.id)}
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

            <div style={{ marginTop: 18, background: '#fff', padding: 12, borderRadius: 12, border: '1px solid #eee' }}>
                <strong>Server Queue</strong>
                <div style={{ marginTop: 8, color: '#9ca3af' }}>
                    Audio conversion happens immediately on the server for each file.
                </div>
            </div>
        </div>
    );
}
