import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { API_BASE_URL } from '@/lib/config';

export async function DELETE(
    req: Request,
    { params }: { params: { id: string; mealId: string } }
) {
    const headersList = headers();
    const authorization = headersList.get('authorization');
    const { id, mealId } = params;

    if (!authorization) {
        return NextResponse.json({ message: 'Authorization header is missing' }, { status: 401 });
    }

    const API_URL = `${API_BASE_URL}/meals/plans/${id}/meals/${mealId}`;

    try {
        const apiResponse = await fetch(API_URL, {
            method: 'DELETE',
            headers: {
                'Authorization': authorization,
            },
        });

        if (!apiResponse.ok) {
            const data = await apiResponse.json();
            return NextResponse.json(data, { status: apiResponse.status });
        }

        return NextResponse.json({ status: 'success' }, { status: 204 });

    } catch (err: any) {
        return NextResponse.json({ message: 'BFF Error: Failed to remove meal from plan', error: err.message }, { status: 500 });
    }
}
