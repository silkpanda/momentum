// =========================================================
// app/web-bff/auth/onboarding/complete/route.ts
// Complete Onboarding Handler for Google OAuth Users
// =========================================================
import { NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/config';

/**
 * @desc    Complete onboarding for Google OAuth users
 * @route   POST /web-bff/auth/onboarding/complete
 * @access  Protected (requires JWT token)
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { userId, householdId, displayName, profileColor, calendarChoice } = body;

        if (!userId || !householdId || !displayName || !profileColor) {
            return NextResponse.json(
                { message: 'Missing required fields: userId, householdId, displayName, profileColor' },
                { status: 400 }
            );
        }

        // Get the authorization header from the request
        const authHeader = request.headers.get('authorization');
        if (!authHeader) {
            return NextResponse.json(
                { message: 'Authorization header is required' },
                { status: 401 }
            );
        }

        // Forward the request to the backend API
        const response = await fetch(`${API_BASE_URL}/auth/onboarding/complete`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader,
            },
            body: JSON.stringify({
                userId,
                householdId,
                displayName,
                profileColor,
                calendarChoice,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return NextResponse.json(
                { message: errorData.message || 'Failed to complete onboarding' },
                { status: response.status }
            );
        }

        const data = await response.json();

        // Return the updated user and household data
        return NextResponse.json(data);

    } catch (err: any) {
        console.error('Onboarding completion error:', err);
        return NextResponse.json(
            { message: 'Failed to complete onboarding', error: err.message },
            { status: 500 }
        );
    }
}
