// =========================================================
// silkpanda/momentum/app/web-bff/calendar/google/events/route.ts
// Proxy for Google Calendar Events
// =========================================================
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { API_BASE_URL } from '@/lib/config';

export async function GET() {
    const headersList = headers();
    const authorization = headersList.get('authorization');

    if (!authorization) {
        return NextResponse.json({ message: 'Authorization header is missing' }, { status: 401 });
    }

    try {
        const response = await fetch(`${API_BASE_URL}/calendar/google/events`, {
            headers: { 'Authorization': authorization }
        });

        if (!response.ok) {
            // Pass through the error status
            return NextResponse.json(
                { message: 'Failed to fetch calendar events from backend' },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);

    } catch (err: any) {
        return NextResponse.json(
            { message: 'BFF Error: Failed to proxy calendar request', error: err.message },
            { status: 500 }
        );
    }
}
