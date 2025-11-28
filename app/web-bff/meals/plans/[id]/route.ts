// =========================================================
// silkpanda/momentum/app/web-bff/meals/plans/[id]/route.ts
// EMBEDDED WEB BFF
// Handle individual meal plan operations (Update)
// =========================================================
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { API_BASE_URL } from '@/lib/config';

export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    const headersList = headers();
    const authorization = headersList.get('authorization');

    if (!authorization) {
        return NextResponse.json({ message: 'Authorization header is missing' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { id } = params;

        // API_BASE_URL is .../api/v1
        const url = `${API_BASE_URL}/meals/plans/${id}`;

        const response = await fetch(url, {
            method: 'PATCH',
            headers: {
                'Authorization': authorization,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json({ message: data.message || 'Failed to update meal plan' }, { status: response.status });
        }

        return NextResponse.json(data);

    } catch (error: any) {
        return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    const headersList = headers();
    const authorization = headersList.get('authorization');

    if (!authorization) {
        return NextResponse.json({ message: 'Authorization header is missing' }, { status: 401 });
    }

    try {
        const { id } = params;
        // API_BASE_URL is .../api/v1
        const url = `${API_BASE_URL}/meals/plans/${id}`;

        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Authorization': authorization,
            },
        });


        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            return NextResponse.json({ message: data.message || 'Failed to delete meal plan' }, { status: response.status });
        }

        return new NextResponse(null, { status: 204 });

    } catch (error: any) {
        // Return the actual error message to help debugging
        return NextResponse.json({
            message: 'Internal Server Error',
            error: error.message,
            cause: error.cause ? String(error.cause) : undefined
        }, { status: 500 });
    }
}
