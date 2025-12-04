// =========================================================
// app/web-bff/calendar/list/route.ts
// Proxy route to fetch user's Google Calendars
// =========================================================
import { NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/config';

/**
 * @desc    List user's Google Calendars
 * @route   GET /web-bff/calendar/list
 * @access  Protected (requires JWT token)
 */
export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader) {
            return NextResponse.json(
                { message: 'Authorization header is required' },
                { status: 401 }
            );
        }

        // Forward the request to the backend API
        const response = await fetch(`${API_BASE_URL}/calendar/list`, {
            headers: {
                'Authorization': authHeader,
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return NextResponse.json(
                { message: errorData.message || 'Failed to fetch calendars' },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);

    } catch (err: any) {
        console.error('Calendar list error:', err);
        return NextResponse.json(
            { message: 'Failed to fetch calendars', error: err.message },
            { status: 500 }
        );
    }
}
