// client/src/components/HowItWorks.jsx
import React from 'react';

export default function HowItWorks() {
    return (
        <section style={{ marginTop: 20 }}>
            <div style={{ display: 'inline-block', background: '#7F00FF', color: '#fff', padding: '10px 18px', borderRadius: 12 }}>
                HOW IT WORKS
            </div>
            <div style={{ marginTop: 12, display: 'flex', gap: 12, justifyContent: 'space-between' }}>
                <div style={{ width: '32%', background: '#fff', padding: 12, borderRadius: 12 }}>1. Select Category</div>
                <div style={{ width: '32%', background: '#fff', padding: 12, borderRadius: 12 }}>2. Upload & Convert</div>
                <div style={{ width: '32%', background: '#fff', padding: 12, borderRadius: 12 }}>3. Download</div>
            </div>
        </section>
    );
}
