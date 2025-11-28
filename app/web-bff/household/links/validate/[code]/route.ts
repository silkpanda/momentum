import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { API_BASE_URL } from '@/lib/config';

const LINK_API_URL = `${API_BASE_URL}/household/child`;

export async function GET(
    request: Request,
    { params }: { params: { code: string } }
) {
    const headersList = headers();
    const authorization = headersList.get('authorization');

    if (!authorization) {
        return NextResponse.json({ message: 'Authorization header is missing' }, { status: 401 });
    }

    try {
        const { code } = params;

        const response = await fetch(`${LINK_API_URL}/validate-code/${code}`, {
            headers: {
                'Authorization': authorization,
            },
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json({ message: data.message || 'Failed to validate code' }, { status: response.status });
        }

        return NextResponse.json(data);

    } catch (error: any) {
        return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
    }
}
