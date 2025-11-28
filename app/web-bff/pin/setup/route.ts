import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { API_BASE_URL } from '@/lib/config';

const PIN_API_URL = `${API_BASE_URL}/pin`;

export async function POST(request: Request) {
    const headersList = headers();
    const authorization = headersList.get('authorization');

    if (!authorization) {
        return NextResponse.json({ message: 'Authorization header is missing' }, { status: 401 });
    }

    try {
        const body = await request.json();
        console.log('[BFF] PIN Setup Request:', body);

        const response = await fetch(`${PIN_API_URL}/setup-pin`, {
            method: 'POST',
            headers: {
                'Authorization': authorization,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();
        console.log('[BFF] PIN Setup Response:', { status: response.status, data });

        if (!response.ok) {
            return NextResponse.json({ message: data.message || 'Failed to setup PIN' }, { status: response.status });
        }

        return NextResponse.json(data);

    } catch (error: any) {
        return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
    }
}
