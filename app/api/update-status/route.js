import { NextResponse } from 'next/server';

export async function POST(request) {
    const n8nUrl = process.env.N8N_WEBHOOK_URL;
    if (!n8nUrl) {
        return NextResponse.json({ error: 'Server misconfiguration: Missing N8N_WEBHOOK_URL' }, { status: 500 });
    }

    try {
        const body = await request.json();

        const res = await fetch(`${n8nUrl}/update-status`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body)
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error('n8n Error:', res.status, errorText);
            return NextResponse.json({ error: `n8n Error: ${res.status} ${errorText}` }, { status: res.status });
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Proxy Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
