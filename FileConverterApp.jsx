// client/src/FileConverterApp.jsx
import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import './index.css';
import HowItWorks from './components/HowItWorks';
import LoginPage from './components/LoginPage';
import DocumentConverter from './components/DocumentConverter';
import * as api from './api'; // your existing API wrapper

const OUTPUT_OPTIONS = {
    document: ['PDF', 'DOCX'],
    image: ['PNG', 'JPG', 'WEBP'],
    video: ['MP4', 'MOV'],
    audio: ['MP3', 'WAV']
};

function extFromName(name) {
    const parts = name.split('.');
    if (parts.length < 2) return '';
    return parts.pop().toLowerCase();
}

function detectCategory(name, file) {
    const ext = extFromName(name);
    const byExt = {
        doc: 'document', docx: 'document', pdf: 'document',
        jpg: 'image', jpeg: 'image', png: 'image', svg: 'image', gif: 'image',
        mp4: 'video', mov: 'video', avi: 'video', mkv: 'video',
        mp3: 'audio', wav: 'audio', aac: 'audio'
    };
    if (byExt[ext]) return byExt[ext];
    if (file && file.type) {
        if (file.type.startsWith('image/')) return 'image';
        if (file.type.startsWith('video/')) return 'video';
        if (file.type.startsWith('audio/')) return 'audio';
        if (file.type.includes('pdf')) return 'document';
    }
    return 'document';
}

export default function FileConverterApp() {
    const [isLoggedIn, setLoggedIn] = useState(true); // set true to skip login for dev
    const [currentPage, setCurrentPage] = useState('home');
    const [localQueue, setLocalQueue] = useState([]);
    const [serverQueue, setServerQueue] = useState([]);
    const fileInput = useRef();

    useEffect(() => {
        fetchServerQueue();
        const t = setInterval(fetchServerQueue, 2000);
        return () => clearInterval(t);
    }, []);

    async function fetchServerQueue() {
        try {
            const list = await api.listFiles();
            setServerQueue(list || []);
        } catch (e) {
            // ignore in UI
            // console.error(e);
        }
    }

    function handleFilesPicked(list) {
        const arr = Array.from(list).map((f, idx) => {
            const cat = detectCategory(f.name, f);
            const input = extFromName(f.name).toUpperCase() || 'FILE';
            const defaultOutput = OUTPUT_OPTIONS[cat] ? OUTPUT_OPTIONS[cat][0] : 'PDF';
            return {
                id: Date.now() + '-' + idx + '-' + Math.random().toString(36).slice(2, 7),
                file: f,
                name: f.name,
                size: f.size,
                category: cat,
                inputFormat: input,
                outputFormat: defaultOutput,
                status: 'ready'
            };
        });
        setLocalQueue((s) => [...s, ...arr]);
    }

    function formatSize(bytes) {
        if (!bytes) return '';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    function updateLocalFile(id, patch) {
        setLocalQueue((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
    }

    async function uploadSingle(localItem) {
        try {
            updateLocalFile(localItem.id, { status: 'uploading' });
            const fd = new FormData();
            fd.append('files', localItem.file);
            fd.append('outputFormat', localItem.outputFormat);
            fd.append('category', localItem.category);
            const resp = await fetch(`${process.env.REACT_APP_API_BASE || 'http://localhost:4000'}/api/files/upload`, {
                method: 'POST',
                body: fd
            });
            if (!resp.ok) {
                updateLocalFile(localItem.id, { status: 'failed' });
                return;
            }
            updateLocalFile(localItem.id, { status: 'uploaded' });
            // remove from local queue
            setLocalQueue((prev) => prev.filter(x => x.id !== localItem.id));
            fetchServerQueue();
        } catch (err) {
            updateLocalFile(localItem.id, { status: 'failed' });
        }
    }

    function uploadAll() {
        localQueue.forEach((item) => {
            if (item.status === 'ready' || item.status === 'failed') uploadSingle(item);
        });
    }

    async function startServerConversion(id) {
        await api.startConversion(id);
        fetchServerQueue();
    }

    function removeLocal(id) {
        setLocalQueue((prev) => prev.filter((f) => f.id !== id));
    }

    // Render
    if (!isLoggedIn) return <LoginPage onLogin={() => setLoggedIn(true)} />;
    if (currentPage === 'documentConverter') return <DocumentConverter />;

    const fileTypes = [
        { type: 'document', title: 'DOCUMENT', description: 'Word, Excel, PDF', formats: ['DOCX', 'XLSX', 'PDF'], tags: ['docx', 'pdf', 'xlsx'] },
        { type: 'image', title: 'IMAGE', description: 'Raster & Vector Graphics', formats: ['JPG', 'PNG', 'SVG'], tags: ['jpg', 'png', 'svg'] },
        { type: 'video', title: 'VIDEO', description: 'All Video Formats', formats: ['MP4', 'MOV'], tags: ['mp4', 'mov'] },
        { type: 'audio', title: 'AUDIO', description: 'Compressed & Lossless', formats: ['MP3', 'WAV'], tags: ['mp3', 'wav'] }
    ];

    return (
        <div className="App">
            <header className="header">
                <button onClick={() => setCurrentPage('home')}>SELECT FILE TYPE</button>
            </header>

            <main style={{ padding: 20 }}>
                <div className="cards-container">
                    {fileTypes.map(ft => (
                        <div key={ft.type} className={`card ${ft.type}`} onClick={() => setCurrentPage(ft.type === 'document' ? 'documentConverter' : 'home')}>
                            <div className="card-icon">
                                {ft.type === 'document' && '📄'}
                                {ft.type === 'image' && '🖼️'}
                                {ft.type === 'video' && '🎬'}
                                {ft.type === 'audio' && '🎵'}
                            </div>
                            <h3>{ft.title}</h3>
                            <p>{ft.description}</p>
                            <div className="formats">[{ft.formats.join(', ')}]</div>
                            <div className="tags">{ft.tags.map(t => <span key={t} className="tag">.{t}</span>)}</div>
                        </div>
                    ))}
                </div>

                <div className="popular-conversion" style={{ marginTop: 20 }}>
                    <span className="icon">🎬</span>
                    <span className="arrow">→</span>
                    <span className="icon">🎵</span>
                    <span>Popular: Video to Audio Conversion</span>
                </div>

                {/* Upload area */}
                <section style={{ marginTop: 22 }}>
                    <div
                        onDrop={(e) => { e.preventDefault(); handleFilesPicked(e.dataTransfer.files); }}
                        onDragOver={(e) => e.preventDefault()}
                        style={{ border: '3px dashed rgba(140,130,200,0.25)', borderRadius: 12, padding: 30, textAlign: 'center', background: '#fff', marginTop: 20 }}
                    >
                        <div style={{ fontSize: 28 }}>📤</div>
                        <div style={{ marginTop: 8 }}>
                            <button onClick={() => fileInput.current && fileInput.current.click()} style={{ padding: '8px 14px', borderRadius: 8 }}>Drag & Drop Files Here</button>
                            <input ref={fileInput} onChange={(e) => handleFilesPicked(e.target.files)} type="file" multiple style={{ display: 'none' }} />
                        </div>
                        <div style={{ color: '#6b7280', marginTop: 8 }}>or click to browse</div>
                    </div>

                    {/* Local queue */}
                    <div style={{ marginTop: 18 }} className="card" >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <strong>Local Queue (choose output & upload)</strong>
                            <div>
                                <button onClick={uploadAll} style={{ padding: '6px 10px', borderRadius: 8 }}>Upload All</button>
                            </div>
                        </div>

                        <div style={{ marginTop: 12 }}>
                            {localQueue.length === 0 && <div style={{ color: '#9ca3af' }}>No files queued yet — add files to the box above.</div>}
                            {localQueue.map(item => (
                                <div key={item.id} style={{ display: 'flex', gap: 12, alignItems: 'center', border: '1px solid #f1f1f4', padding: 10, borderRadius: 8, marginTop: 8 }}>
                                    <div style={{ width: 64, height: 64, borderRadius: 8, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <div style={{ fontWeight: 700 }}>{item.inputFormat.slice(0, 2)}</div>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 700 }}>{item.name}</div>
                                        <div style={{ color: '#9ca3af', fontSize: 13 }}>{formatSize(item.size)}</div>
                                        <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                                            <div style={{ fontSize: 12, padding: '4px 8px', borderRadius: 999, border: '1px solid #eee' }}>{item.inputFormat}</div>
                                            <div>→</div>
                                            <select value={item.outputFormat} onChange={(e) => updateLocalFile(item.id, { outputFormat: e.target.value })}>
                                                {(OUTPUT_OPTIONS[item.category] || OUTPUT_OPTIONS.document).map(o => <option key={o} value={o}>{o}</option>)}
                                            </select>
                                            <div style={{ marginLeft: 10 }}>{item.status}</div>
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

                    {/* Server queue */}
                    <div style={{ marginTop: 18 }} className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <strong>Server Queue</strong>
                            <button onClick={fetchServerQueue} style={{ padding: '6px 10px', borderRadius: 8 }}>Refresh</button>
                        </div>

                        <div style={{ marginTop: 12 }}>
                            {serverQueue.length === 0 && <div style={{ color: '#9ca3af' }}>No uploaded files yet.</div>}
                            {serverQueue.map(f => (
                                <div key={f._id} style={{ display: 'flex', gap: 12, alignItems: 'center', border: '1px solid #f1f1f4', padding: 10, borderRadius: 8, marginTop: 8 }}>
                                    <div style={{ width: 64, height: 64, borderRadius: 8, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <div style={{ fontWeight: 700 }}>{(f.inputFormat || 'F').slice(0, 2)}</div>
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
                                            {f.status === 'completed' && <a href={api.downloadUrl(f._id)} target="_blank" rel="noreferrer"><button style={{ padding: '6px 10px', borderRadius: 8 }}>Download</button></a>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </section>

                <HowItWorks />
            </main>
        </div>
    );
}
