import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { API_BASE_URL } from '@/lib/config';

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    const headersList = headers();
    const authorization = headersList.get('authorization');
    const { id } = params;

    if (!authorization) {
        return NextResponse.json({ message: 'Authorization header is missing' }, { status: 401 });
    }

    try {
        const response = await fetch(`${API_BASE_URL}/households/${id}/invite-code`, {
            headers: { 'Authorization': authorization },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Failed to fetch invite code');
        }

        const data = await response.json();
        return NextResponse.json(data);

    } catch (err: any) {
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    const headersList = headers();
    const authorization = headersList.get('authorization');
    const { id } = params;

    if (!authorization) {
        return NextResponse.json({ message: 'Authorization header is missing' }, { status: 401 });
    }

    try {
        const response = await fetch(`${API_BASE_URL}/households/${id}/invite-code`, {
            method: 'POST',
            headers: { 'Authorization': authorization },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Failed to regenerate invite code');
        }

        const data = await response.json();
        return NextResponse.json(data);

    } catch (err: any) {
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}
