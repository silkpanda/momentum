// =========================================================
// app/web-bff/auth/google/authenticate/route.ts
// Handle Google OAuth authentication with calendar permissions
// =========================================================
import { NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/config';

/**
 * @desc    Authenticate user with Google OAuth code (includes calendar permissions)
 * @route   POST /web-bff/auth/google/authenticate
 * @access  Public
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { code, redirectUri } = body;

        if (!code) {
            return NextResponse.json(
                { message: 'Authorization code is required' },
                { status: 400 }
            );
        }

        // Forward to backend API
        const response = await fetch(`${API_BASE_URL}/auth/google/oauth`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                code,
                redirectUri: redirectUri || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/google/callback`,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return NextResponse.json(
                { message: errorData.message || 'Authentication failed' },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);

    } catch (err: any) {
        console.error('Google authentication error:', err);
        return NextResponse.json(
            { message: 'Authentication failed', error: err.message },
            { status: 500 }
        );
    }
}
