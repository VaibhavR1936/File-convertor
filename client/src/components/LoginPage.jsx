// client/src/components/LoginPage.jsx
import React from 'react';

export default function LoginPage({ onLogin }) {
    return (
        <div style={{ padding: 60 }}>
            <div style={{ marginBottom: 20, fontSize: 24, fontWeight: 700 }}>Welcome to File Converter</div>
            <button onClick={onLogin} style={{ padding: '10px 18px', borderRadius: 8 }}>Login / Continue</button>
        </div>
    );
}
