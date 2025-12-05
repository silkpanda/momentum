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
        const {
            userId,
            householdId,
            householdName,
            inviteCode,
            displayName,
            profileColor,
            calendarChoice,
            selectedCalendarId,
            pin
        } = body;

        console.log('[BFF] Onboarding complete request:', {
            userId,
            householdId,
            householdName: householdName || 'not provided',
            inviteCode: inviteCode || 'not provided',
            displayName,
            profileColor,
            calendarChoice,
            selectedCalendarId: selectedCalendarId || 'not provided',
            hasPin: !!pin
        });

        if (!userId || !householdId || !displayName || !profileColor || !pin) {
            return NextResponse.json(
                { message: 'Missing required fields: userId, householdId, displayName, profileColor, pin' },
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
                householdName,
                inviteCode,
                displayName,
                profileColor,
                calendarChoice,
                selectedCalendarId,
                pin,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('[BFF] Onboarding completion failed:', {
                status: response.status,
                errorData
            });
            return NextResponse.json(
                { message: errorData.message || 'Failed to complete onboarding', error: errorData },
                { status: response.status }
            );
        }

        const data = await response.json();
        console.log('[BFF] Onboarding completed successfully');

        // Return the updated user and household data
        return NextResponse.json(data);

    } catch (err: any) {
        console.error('[BFF] Onboarding completion error:', err);
        return NextResponse.json(
            { message: 'Failed to complete onboarding', error: err.message },
            { status: 500 }
        );
    }
}
