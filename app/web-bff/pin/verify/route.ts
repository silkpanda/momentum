import { NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/config';

const PIN_API_URL = `${API_BASE_URL}/pin`;

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { pin, memberId, householdId } = body;

        console.log('[BFF] PIN Verify Request:', { pin: '****', memberId, householdId });

        if (!pin || !memberId || !householdId) {
            return NextResponse.json(
                { status: 'fail', message: 'PIN, memberId, and householdId are required' },
                { status: 400 }
            );
        }

        const response = await fetch(`${PIN_API_URL}/verify-pin`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ pin, memberId, householdId }),
        });

        const data = await response.json();
        console.log('[BFF] PIN Verify Response:', { status: response.status, data });

        if (!response.ok) {
            return NextResponse.json(data, { status: response.status });
        }

        return NextResponse.json(data);

    } catch (error: any) {
        console.error('[BFF] PIN Verify Error:', error);
        return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
    }
}
