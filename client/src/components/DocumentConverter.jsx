// client/src/components/DocumentConverter.jsx
import React, { useState, useRef, useEffect } from 'react';
import * as api from '../api'; // optional: used for startConversion/listFiles/downloadUrl if available

const ALLOWED_EXT = ['doc', 'docx', 'pdf'];
const OUTPUT_OPTIONS = {
    document: ['PDF', 'DOCX']
};

/**
 * DocumentConverter
 * - Accepts only document files (.doc, .docx, .pdf)
 * - Local queue: choose output format per file, upload to server
 * - Server queue: polls server and shows only document items
 *
 * Expects backend endpoints:
 * - POST  /api/files/upload      (multipart form 'files' field, plus outputFormat & category)
 * - GET   /api/files             (list all files — component filters to documents)
 * - POST  /api/files/:id/start   (start conversion)
 * - GET   /api/files/:id/download  (download converted file)
 *
 * If you have an api.js providing helpers, this component will use api.listFiles() and api.startConversion().
 */

export default function DocumentConverter({ onBack }) {
    const [localQueue, setLocalQueue] = useState([]);      // files staged on client
    const [serverQueue, setServerQueue] = useState([]);    // files stored on server (filtered to docs)
    const fileInput = useRef();

    useEffect(() => {
        fetchServerQueue();
        const t = setInterval(fetchServerQueue, 2500);
        return () => clearInterval(t);

    }, []);

    // --- helpers ---
    function extFromName(name) {
        const p = (name || '').split('.');
        if (p.length < 2) return '';
        return p.pop().toLowerCase();
    }

    function isAllowedExt(nameOrFile) {
        const name = typeof nameOrFile === 'string' ? nameOrFile : (nameOrFile.name || '');
        const ext = extFromName(name);
        return ALLOWED_EXT.includes(ext);
    }

    function formatSize(bytes) {
        if (!bytes) return '';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    // --- server queue fetch (only documents) ---
    async function fetchServerQueue() {
        try {
            // prefer api.listFiles if provided, otherwise fetch raw
            let list;
            if (api && typeof api.listFiles === 'function') {
                list = await api.listFiles();
            } else {
                const res = await fetch(`${process.env.REACT_APP_API_BASE || 'http://localhost:4000'}/api/files`);
                if (!res.ok) throw new Error('list failed');
                list = await res.json();
            }
            const docs = (list || []).filter(f => {
                const cat = (f.category || '').toLowerCase();
                const inf = (f.inputFormat || '').toLowerCase();
                return cat === 'document' || ALLOWED_EXT.includes(inf) || ALLOWED_EXT.includes(extFromName(f.originalName || ''));
            });
            setServerQueue(docs);
        } catch (e) {
            console.warn('fetchServerQueue error', e && e.message ? e.message : e);
        }
    }

    // --- handle files selected or dropped: FILTER to allowed document types only ---
    function handleFilesPicked(list) {
        const files = Array.from(list || []);
        const filtered = files.filter(f => isAllowedExt(f.name));
        if (filtered.length === 0) {
            alert('Please select document files only (.doc, .docx, .pdf).');
            return;
        }

        const items = filtered.map((f, idx) => {
            const ext = extFromName(f.name).toUpperCase() || 'DOC';
            return {
                id: Date.now() + '-' + idx + '-' + Math.random().toString(36).slice(2, 7),
                file: f,
                name: f.name,
                size: f.size,
                category: 'document',
                inputFormat: ext,
                outputFormat: OUTPUT_OPTIONS.document[0], // default PDF
                status: 'ready'
            };
        });

        setLocalQueue(prev => [...prev, ...items]);
    }

    // --- local queue helpers ---
    function updateLocalFile(id, patch) {
        setLocalQueue(prev => prev.map(x => x.id === id ? { ...x, ...patch } : x));
    }

    async function uploadSingle(localItem) {
        try {
            updateLocalFile(localItem.id, { status: 'uploading' });
            const fd = new FormData();
            fd.append('files', localItem.file);
            fd.append('outputFormat', localItem.outputFormat);
            fd.append('category', 'document');

            const resp = await fetch(`${process.env.REACT_APP_API_BASE || 'http://localhost:4000'}/api/files/upload`, {
                method: 'POST',
                body: fd
            });

            if (!resp.ok) {
                updateLocalFile(localItem.id, { status: 'failed' });
                const txt = await resp.text().catch(() => '');
                console.error('upload failed', resp.status, txt);
                return;
            }

            updateLocalFile(localItem.id, { status: 'uploaded' });
            // remove from local queue and refresh server queue
            setLocalQueue(prev => prev.filter(x => x.id !== localItem.id));
            fetchServerQueue();
        } catch (err) {
            updateLocalFile(localItem.id, { status: 'failed' });
            console.error('uploadSingle error', err);
        }
    }

    function uploadAll() {
        localQueue.forEach(item => {
            if (item.status === 'ready' || item.status === 'failed') uploadSingle(item);
        });
    }

    async function startServerConversion(id) {
        try {
            if (api && typeof api.startConversion === 'function') {
                await api.startConversion(id);
            } else {
                const res = await fetch(`${process.env.REACT_APP_API_BASE || 'http://localhost:4000'}/api/files/${id}/start`, { method: 'POST' });
                if (!res.ok) throw new Error('start failed');
            }
            // immediate refresh
            fetchServerQueue();
        } catch (e) {
            console.error('start conversion failed', e);
            alert('Could not start conversion: ' + (e.message || e));
        }
    }

    function removeLocal(id) {
        setLocalQueue(prev => prev.filter(x => x.id !== id));
    }

    // --- download helper (server provided route) ---
    function downloadUrl(id) {
        if (api && typeof api.downloadUrl === 'function') {
            return api.downloadUrl(id);
        }
        return `${process.env.REACT_APP_API_BASE || 'http://localhost:4000'}/api/files/${id}/download`;
    }

    // --- render ---
    return (
        <div style={{ padding: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ margin: 0 }}>Document Converter</h2>
                    <p style={{ margin: '6px 0 0', color: '#6b7280' }}>
                        Upload only Word / PDF files (.doc, .docx, .pdf). Choose output (PDF or DOCX).
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
                        Drag & Drop Files Here
                    </button>

                    {/* Important: accept only document extensions */}
                    <input
                        ref={fileInput}
                        onChange={(e) => handleFilesPicked(e.target.files)}
                        type="file"
                        multiple
                        accept=".doc,.docx,.pdf"
                        style={{ display: 'none' }}
                    />
                </div>

                <div style={{ marginTop: 8, color: '#9ca3af' }}>or click to browse</div>
            </div>

            {/* Local Queue */}
            <div style={{ marginTop: 18, background: '#fff', padding: 12, borderRadius: 12, border: '1px solid #eee' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong>Local Queue (choose output & upload)</strong>
                    <div><button onClick={uploadAll} style={{ padding: '6px 10px', borderRadius: 8 }}>Upload All</button></div>
                </div>

                <div style={{ marginTop: 12 }}>
                    {localQueue.length === 0 && <div style={{ color: '#9ca3af' }}>No files queued yet — add files to the box above.</div>}

                    {localQueue.map(item => (
                        <div key={item.id} style={{ display: 'flex', gap: 12, alignItems: 'center', border: '1px solid #f1f1f4', padding: 10, borderRadius: 8, marginTop: 8 }}>
                            <div style={{ width: 64, height: 64, borderRadius: 8, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <div style={{ fontWeight: 700 }}>{(item.inputFormat || 'DOC').slice(0, 3)}</div>
                            </div>

                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 700 }}>{item.name}</div>
                                <div style={{ color: '#9ca3af', fontSize: 13 }}>{formatSize(item.size)}</div>

                                <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
                                    <div style={{ fontSize: 12, padding: '4px 8px', borderRadius: 999, border: '1px solid #eee' }}>{item.inputFormat}</div>
                                    <div>→</div>
                                    <select
                                        value={item.outputFormat}
                                        onChange={(e) => updateLocalFile(item.id, { outputFormat: e.target.value })}
                                        style={{ padding: '6px 8px', borderRadius: 8 }}
                                    >
                                        {OUTPUT_OPTIONS.document.map(o => <option key={o} value={o}>{o}</option>)}
                                    </select>

                                    <div style={{ marginLeft: 10, color: item.status === 'uploading' ? '#f59e0b' : item.status === 'uploaded' ? '#10b981' : '#6b7280' }}>{item.status}</div>
                                </div>

                                <div style={{ marginTop: 8 }}>
                                    <button onClick={() => uploadSingle(item)} style={{ padding: '6px 10px', borderRadius: 8, marginRight: 8 }}>Upload</button>
                                    <button onClick={() => removeLocal(item.id)} style={{ padding: '6px 10px', borderRadius: 8 }}>Remove</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Server Queue (documents only) */}
            <div style={{ marginTop: 18, background: '#fff', padding: 12, borderRadius: 12, border: '1px solid #eee' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong>Server Queue</strong>
                    <div><button onClick={fetchServerQueue} style={{ padding: '6px 10px', borderRadius: 8 }}>Refresh</button></div>
                </div>

                <div style={{ marginTop: 12 }}>
                    {serverQueue.length === 0 && <div style={{ color: '#9ca3af' }}>No uploaded document files yet.</div>}

                    {serverQueue.map(f => (
                        <div key={f._id} style={{ display: 'flex', gap: 12, alignItems: 'center', border: '1px solid #f1f1f4', padding: 10, borderRadius: 8, marginTop: 8 }}>
                            <div style={{ width: 64, height: 64, borderRadius: 8, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <div style={{ fontWeight: 700 }}>{(f.inputFormat || 'DOC').slice(0, 3)}</div>
                            </div>

                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 700 }}>{f.originalName}</div>
                                <div style={{ color: '#9ca3af', fontSize: 13 }}>{formatSize(f.size)}</div>

                                <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
                                    <div style={{ fontSize: 12, padding: '4px 8px', borderRadius: 999, border: '1px solid #eee' }}>{f.inputFormat}</div>
                                    <div>→</div>
                                    <div style={{ fontSize: 12, padding: '4px 8px', borderRadius: 8, background: '#f6f0ff' }}>{f.outputFormat}</div>
                                    <div style={{ marginLeft: 12 }}>{f.status}</div>
                                </div>

                                <div style={{ marginTop: 8 }}>
                                    {f.status === 'pending' && <button onClick={() => startServerConversion(f._id)} style={{ padding: '6px 10px', borderRadius: 8 }}>Start Conversion</button>}
                                    {f.status === 'converting' && <div style={{ color: '#2563eb' }}>Converting... ({f.progress || 0}%)</div>}
                                    {f.status === 'completed' && <a href={downloadUrl(f._id)} target="_blank" rel="noreferrer"><button style={{ padding: '6px 10px', borderRadius: 8 }}>Download</button></a>}
                                    {f.status === 'failed' && <div style={{ color: '#ef4444' }}>failed</div>}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
