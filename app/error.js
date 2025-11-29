'use client';

import { useEffect } from 'react';

export default function Error({ error, reset }) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
            <h2>Something went wrong!</h2>
            <p style={{ color: 'red', margin: '1rem 0' }}>{error.message}</p>
            <button
                onClick={() => reset()}
                style={{
                    padding: '0.5rem 1rem',
                    background: '#0070f3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                }}
            >
                Try again
            </button>
            <pre style={{ marginTop: '2rem', textAlign: 'left', background: '#f0f0f0', padding: '1rem', overflow: 'auto' }}>
                {error.stack}
            </pre>
        </div>
    );
}
