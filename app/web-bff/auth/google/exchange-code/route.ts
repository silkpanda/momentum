// =========================================================
// app/web-bff/auth/google/exchange-code/route.ts
// Exchange OAuth authorization code for access tokens
// =========================================================
import { NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/config';

/**
 * @desc    Exchange Google OAuth code for access tokens
 * @route   POST /web-bff/auth/google/exchange-code
 * @access  Protected
 */
export async function POST(request: Request) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader) {
            return NextResponse.json(
                { message: 'Authorization required' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { code, userId } = body;

        if (!code || !userId) {
            return NextResponse.json(
                { message: 'Code and userId are required' },
                { status: 400 }
            );
        }

        // Forward to backend API
        const response = await fetch(`${API_BASE_URL}/calendar/google/exchange-code`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader,
            },
            body: JSON.stringify({
                code,
                userId,
                redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/google/callback`,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return NextResponse.json(
                { message: errorData.message || 'Failed to exchange code' },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);

    } catch (err: any) {
        console.error('Exchange code error:', err);
        return NextResponse.json(
            { message: 'Failed to exchange code', error: err.message },
            { status: 500 }
        );
    }
}
