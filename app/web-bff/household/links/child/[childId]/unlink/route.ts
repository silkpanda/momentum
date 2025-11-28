import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { API_BASE_URL } from '@/lib/config';

const CHILD_API_URL = `${API_BASE_URL}/household/child`;

export async function POST(
    request: Request,
    { params }: { params: { childId: string } }
) {
    const headersList = headers();
    const authorization = headersList.get('authorization');

    if (!authorization) {
        return NextResponse.json({ message: 'Authorization header is missing' }, { status: 401 });
    }

    try {
        const { childId } = params;

        const response = await fetch(`${CHILD_API_URL}/${childId}/unlink`, {
            method: 'POST',
            headers: {
                'Authorization': authorization,
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json({ message: data.message || 'Failed to unlink child' }, { status: response.status });
        }

        return NextResponse.json(data);

    } catch (error: any) {
        return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
    }
}
