'use client';

export default function GlobalError() {
  return (
    <html lang="en">
      <body>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: '72px', margin: 0, color: '#6366f1' }}>500</h1>
            <p style={{ fontSize: '18px', color: '#6b7280' }}>Internal Server Error</p>
            <p style={{ color: '#9ca3af' }}>Something went wrong. Please try again later.</p>
          </div>
        </div>
      </body>
    </html>
  );
}
