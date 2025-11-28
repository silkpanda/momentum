import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { API_BASE_URL } from '@/lib/config';

const AUTH_ME_URL = `${API_BASE_URL}/auth/me`;
const WISHLIST_API_URL = `${API_BASE_URL}/wishlist`;

export async function GET() {
    const headersList = headers();
    const authorization = headersList.get('authorization');

    if (!authorization) {
        return NextResponse.json({ message: 'Authorization header is missing' }, { status: 401 });
    }

    try {
        // 1. Get user data to extract householdId
        const meResponse = await fetch(AUTH_ME_URL, {
            headers: { 'Authorization': authorization }
        });

        if (!meResponse.ok) {
            throw new Error('Failed to fetch user data');
        }

        const meData = await meResponse.json();
        const householdId = meData.data.householdId;

        if (!householdId) {
            throw new Error('No household ID found for user');
        }

        // 2. Fetch wishlist for household
        const response = await fetch(`${WISHLIST_API_URL}/household/${householdId}`, {
            headers: { 'Authorization': authorization }
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json({ message: data.message || 'Failed to fetch wishlist' }, { status: response.status });
        }

        return NextResponse.json(data);

    } catch (error: any) {
        return NextResponse.json({ message: 'BFF Error: Failed to fetch wishlist', error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const headersList = headers();
    const authorization = headersList.get('authorization');

    if (!authorization) {
        return NextResponse.json({ message: 'Authorization header is missing' }, { status: 401 });
    }

    try {
        const body = await request.json();

        const response = await fetch(WISHLIST_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': authorization,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json({ message: data.message || 'Failed to create wishlist item' }, { status: response.status });
        }

        return NextResponse.json(data);

    } catch (error: any) {
        return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
    }
}
