import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { API_BASE_URL } from '@/lib/config';

const WISHLIST_API_URL = `${API_BASE_URL}/wishlist`;

export async function POST(
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

        const response = await fetch(`${WISHLIST_API_URL}/${id}/purchase`, {
            method: 'POST',
            headers: {
                'Authorization': authorization,
            },
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json({ message: data.message || 'Failed to purchase item' }, { status: response.status });
        }

        return NextResponse.json(data);

    } catch (error: any) {
        return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
    }
}
