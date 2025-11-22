import { NextResponse } from 'next/server';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
        return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
    }

    const n8nUrl = process.env.N8N_WEBHOOK_URL;
    if (!n8nUrl) {
        return NextResponse.json({ error: 'Server misconfiguration: Missing N8N_WEBHOOK_URL' }, { status: 500 });
    }

    try {
        const res = await fetch(`${n8nUrl}/order?orderId=${orderId}`, {
            headers: {
                'Content-Type': 'application/json',
            },
            cache: 'no-store'
        });

        if (!res.ok) {
            return NextResponse.json({ error: 'Failed to fetch from n8n' }, { status: res.status });
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Proxy Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
