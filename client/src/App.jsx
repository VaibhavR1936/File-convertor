// client/src/App.jsx
import React, { useState } from 'react';
import './App.css';
import HowItWorks from './components/HowItWorks';
import LoginPage from './components/LoginPage';
import DocumentConverter from './components/DocumentConverter';
import ImageConverter from './components/ImageConverterClient';
import VideoConverter from './components/VideoConverterClient';
import AudioConverter from './components/AudioConverterClient';

const FileTypeCard = ({ type, title, description, formats, tags, onClick }) => {
    return (
        <div className={`card ${type}`} onClick={() => onClick(type)} style={{ cursor: 'pointer' }}>
            <div className="card-icon">
                {type === 'document' && '📄'}
                {type === 'image' && '🖼️'}
                {type === 'video' && '🎬'}
                {type === 'audio' && '🎵'}
            </div>
            <h3>{title}</h3>
            <p>{description}</p>
            <div className="formats">[{formats.join(', ')}]</div>
            <div className="tags">
                {tags.map(tag => <span key={tag} className="tag">.{tag}</span>)}
            </div>
        </div>
    );
};

export default function App() {
    const [isLoggedIn, setLoggedIn] = useState(true);
    // 'home' | 'document' | 'image' | 'video' | 'audio'
    const [currentPage, setCurrentPage] = useState('home');

    const handleLogin = () => setLoggedIn(true);

    function handleCardClick(fileType) {
        if (fileType === 'document') setCurrentPage('document');
        else if (fileType === 'image') setCurrentPage('image');
        else if (fileType === 'video') setCurrentPage('video');
        else if (fileType === 'audio') setCurrentPage('audio');
    }

    const fileTypes = [
        { type: 'document', title: 'DOCUMENT', description: 'Word, Excel, PDF', formats: ['DOCX', 'XLSX', 'PDF'], tags: ['docx', 'pdf', 'xlsx'] },
        { type: 'image', title: 'IMAGE', description: 'Raster & Vector Graphics', formats: ['JPG', 'PNG', 'SVG'], tags: ['jpg', 'png', 'svg'] },
        { type: 'video', title: 'VIDEO', description: 'All Video Formats', formats: ['MP4', 'MOV'], tags: ['mp4', 'mov'] },
        { type: 'audio', title: 'AUDIO', description: 'Compressed & Lossless', formats: ['MP3', 'WAV'], tags: ['mp3', 'wav'] }
    ];

    if (!isLoggedIn) return <LoginPage onLogin={handleLogin} />;

    // DOCUMENT PAGE
    if (currentPage === 'document') {
        return (
            <div className="App" style={{ minHeight: '100vh', background: '#f6f6fb' }}>
                <header className="header" style={{ padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <div style={{ width: 36, height: 36, borderRadius: 8, background: 'linear-gradient(90deg,#7c3aed,#06b6d4)' }} />
                        <div style={{ fontWeight: 700 }}>FILE CONVERTER</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => setCurrentPage('home')} style={{ padding: '8px 12px', borderRadius: 8 }}>Home</button>

                    </div>
                </header>

                <main style={{ padding: 20, maxWidth: 1200, margin: '0 auto' }}>
                    <DocumentConverter onBack={() => setCurrentPage('home')} />
                </main>
            </div>
        );
    }

    // IMAGE PAGE
    if (currentPage === 'image') {
        return (
            <div className="App" style={{ minHeight: '100vh', background: '#f6f6fb' }}>
                <header className="header" style={{ padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <div style={{ width: 36, height: 36, borderRadius: 8, background: 'linear-gradient(90deg,#7c3aed,#06b6d4)' }} />
                        <div style={{ fontWeight: 700 }}>FILE CONVERTER</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => setCurrentPage('home')} style={{ padding: '8px 12px', borderRadius: 8 }}>Home</button>

                    </div>
                </header>

                <main style={{ padding: 20, maxWidth: 1200, margin: '0 auto' }}>
                    <ImageConverter onBack={() => setCurrentPage('home')} />
                </main>
            </div>
        );
    }

    // VIDEO PAGE
    if (currentPage === 'video') {
        return (
            <div className="App" style={{ minHeight: '100vh', background: '#f6f6fb' }}>
                <header className="header" style={{ padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <div style={{ width: 36, height: 36, borderRadius: 8, background: 'linear-gradient(90deg,#7c3aed,#06b6d4)' }} />
                        <div style={{ fontWeight: 700 }}>FILE CONVERTER</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => setCurrentPage('home')} style={{ padding: '8px 12px', borderRadius: 8 }}>Home</button>
                        
                    </div>
                </header>

                <main style={{ padding: 20, maxWidth: 1200, margin: '0 auto' }}>
                    <VideoConverter onBack={() => setCurrentPage('home')} />
                </main>
            </div>
        );
    }

    // AUDIO PAGE
    if (currentPage === 'audio') {
        return (
            <div className="App" style={{ minHeight: '100vh', background: '#f6f6fb' }}>
                <header className="header" style={{ padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <div style={{ width: 36, height: 36, borderRadius: 8, background: 'linear-gradient(90deg,#7c3aed,#06b6d4)' }} />
                        <div style={{ fontWeight: 700 }}>FILE CONVERTER</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => setCurrentPage('home')} style={{ padding: '8px 12px', borderRadius: 8 }}>Home</button>
                        
                    </div>
                </header>

                <main style={{ padding: 20, maxWidth: 1200, margin: '0 auto' }}>
                    <AudioConverter onBack={() => setCurrentPage('home')} />
                </main>
            </div>
        );
    }

    // HOME PAGE
    return (
        <div className="App" style={{ minHeight: '100vh', background: '#f6f6fb' }}>
            <header className="header" style={{ padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: 'linear-gradient(90deg,#7c3aed,#06b6d4)' }} />
                    <div style={{ fontWeight: 700 }}>FILE CONVERTER</div>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setCurrentPage('home')} style={{ padding: '8px 12px', borderRadius: 8 }}>Home</button>
                    
                </div>
            </header>

            <main style={{ padding: 20, maxWidth: 1200, margin: '0 auto' }}>
                <section style={{ textAlign: 'center', marginTop: 8 }}>
                    <div style={{ display: 'inline-block', padding: '14px 28px', background: 'linear-gradient(90deg,#7c3aed,#06b6d4)', color: '#fff', borderRadius: 20 }}>
                        CONVERT ANY FILE, INSTANTLY
                    </div>
                    <p style={{ color: '#6b7280', marginTop: 8 }}>Fast, secure, and easy file conversion for all your needs</p>
                </section>

                <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginTop: 18 }}>
                    {fileTypes.map(ft => <FileTypeCard key={ft.type} {...ft} onClick={handleCardClick} />)}
                </section>

                <div style={{ marginTop: 20 }}>
                    <div className="popular-conversion" style={{ display: 'inline-flex', gap: 12, alignItems: 'center', padding: '12px 24px', borderRadius: 12, background: 'linear-gradient(90deg,#7c3aed,#a855f7)', color: '#fff' }}>
                        <span style={{ fontSize: 20 }}>🎬</span>
                        <span style={{ fontWeight: 600 }}>Popular: Video to Audio Conversion</span>
                    </div>
                </div>

                <HowItWorks />
            </main>
        </div>
    );
}
