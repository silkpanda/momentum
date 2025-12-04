// =========================================================
// app/web-bff/auth/google/route.ts
// Google OAuth Authentication Handler
// =========================================================
import { NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/config';

/**
 * @desc    Handle Google Sign-In
 * @route   POST /web-bff/auth/google
 * @access  Public
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { idToken } = body;

        if (!idToken) {
            return NextResponse.json(
                { message: 'Google ID token is required' },
                { status: 400 }
            );
        }

        // Forward the Google credential to the backend API
        const response = await fetch(`${API_BASE_URL}/auth/google`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ idToken }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return NextResponse.json(
                { message: errorData.message || 'Google authentication failed' },
                { status: response.status }
            );
        }

        const data = await response.json();

        // Return the token and user data
        return NextResponse.json(data);

    } catch (err: any) {
        console.error('Google auth error:', err);
        return NextResponse.json(
            { message: 'Failed to authenticate with Google', error: err.message },
            { status: 500 }
        );
    }
}
