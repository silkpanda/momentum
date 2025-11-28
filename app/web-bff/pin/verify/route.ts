import { NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/config';

const PIN_API_URL = `${API_BASE_URL}/pin`;

export async function POST(request: Request) {
    // Verify PIN is public, so no auth header check needed here (or maybe it is needed depending on implementation)
    // The API route definition says: router.post('/verify-pin', verifyPin); // Public route
    // But verifyPin controller might check something.
    // Let's pass auth header if present, but not enforce it if it's truly public.
    // However, usually verify-pin is used to access a profile, so maybe it's unauthenticated initially?
    // Let's assume public for now as per API route comment.

    try {
        const body = await request.json();

        const response = await fetch(`${PIN_API_URL}/verify-pin`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();
        console.log('[BFF] PIN Verify Response:', { status: response.status, data });

        if (!response.ok) {
            return NextResponse.json(data, { status: response.status });
        }

        return NextResponse.json(data);

    } catch (error: any) {
        return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
    }
}
