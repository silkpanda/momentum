// =========================================================
// app/web-bff/auth/google/calendar-oauth/route.ts
// Initiate Google OAuth flow for calendar access
// =========================================================
import { NextResponse } from 'next/server';

/**
 * @desc    Redirect user to Google OAuth for calendar permissions
 * @route   GET /web-bff/auth/google/calendar-oauth
 * @access  Protected
 */
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json(
                { message: 'User ID is required' },
                { status: 400 }
            );
        }

        const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
        const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/google/callback`;

        // Build Google OAuth URL with calendar scopes
        const scopes = [
            'https://www.googleapis.com/auth/calendar.readonly',
            'https://www.googleapis.com/auth/calendar.events',
            'https://www.googleapis.com/auth/calendar',
        ];

        const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
        authUrl.searchParams.set('client_id', clientId!);
        authUrl.searchParams.set('redirect_uri', redirectUri);
        authUrl.searchParams.set('response_type', 'code');
        authUrl.searchParams.set('scope', scopes.join(' '));
        authUrl.searchParams.set('access_type', 'offline'); // Get refresh token
        authUrl.searchParams.set('prompt', 'consent'); // Force consent screen
        authUrl.searchParams.set('state', userId); // Pass userId in state

        // Redirect to Google OAuth
        return NextResponse.redirect(authUrl.toString());

    } catch (err: any) {
        console.error('Calendar OAuth error:', err);
        return NextResponse.json(
            { message: 'Failed to initiate OAuth', error: err.message },
            { status: 500 }
        );
    }
}
