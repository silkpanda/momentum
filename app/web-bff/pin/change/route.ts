import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { API_BASE_URL } from '@/lib/config';

const PIN_API_URL = `${API_BASE_URL}/pin`;

export async function PUT(request: Request) {
    const headersList = headers();
    const authorization = headersList.get('authorization');

    if (!authorization) {
        return NextResponse.json({ message: 'Authorization header is missing' }, { status: 401 });
    }

    try {
        const body = await request.json();

        const response = await fetch(`${PIN_API_URL}/change-pin`, {
            method: 'PUT',
            headers: {
                'Authorization': authorization,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json({ message: data.message || 'Failed to change PIN' }, { status: response.status });
        }

        return NextResponse.json(data);

    } catch (error: any) {
        return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
    }
}
