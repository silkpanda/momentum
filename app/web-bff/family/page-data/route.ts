// =========================================================
// silkpanda/momentum/app/web-bff/family/page-data/route.ts
// EMBEDDED WEB BFF (v4 Blueprint)
// Aggregates all data for the "Family View" page
// =========================================================
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { API_BASE_URL } from '@/lib/config';
import { populateTaskAssignments } from '../../utils/populateTaskAssignments';

// Internal API URLs
const AUTH_ME_URL = `${API_BASE_URL}/auth/me`;
const TASK_API_URL = `${API_BASE_URL}/tasks`;
const STORE_API_URL = `${API_BASE_URL}/store-items`;

/**
 * @desc    Get all data for the Family View page
 * @route   GET /web-bff/family/page-data
 * @access  Private (via DashboardLayout)
 */
export async function GET() {
    const headersList = headers();
    const authorization = headersList.get('authorization');

    if (!authorization) {
        return NextResponse.json({ message: 'Authorization header is missing' }, { status: 401 });
    }

    try {
        // 1. First, get user data to extract householdId
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

        // 2. Make parallel calls to the internal 'momentum-api' with the householdId
        const [householdResponse, taskResponse, storeResponse, mealPlansResponse, recipesResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/households/${householdId}`, {
                headers: { 'Authorization': authorization }
            }),
            fetch(TASK_API_URL, { headers: { 'Authorization': authorization } }),
            fetch(STORE_API_URL, { headers: { 'Authorization': authorization } }),
            fetch(`${API_BASE_URL}/meals/plans`, { headers: { 'Authorization': authorization } }),
            fetch(`${API_BASE_URL}/meals/recipes`, { headers: { 'Authorization': authorization } }),
        ]);

        // 3. Check all responses
        if (!householdResponse.ok) throw new Error('Failed to fetch household data');
        if (!taskResponse.ok) throw new Error('Failed to fetch task data');
        if (!storeResponse.ok) throw new Error('Failed to fetch store item data');

        // 4. Parse data
        const householdData = await householdResponse.json();
        const taskData = await taskResponse.json();
        const storeData = await storeResponse.json();
        const mealPlansData = mealPlansResponse.ok ? await mealPlansResponse.json() : { data: { mealPlans: [] } };
        const recipesData = recipesResponse.ok ? await recipesResponse.json() : { data: { recipes: [] } };

        // 5. Populate task assignments with member details
        const memberProfiles = householdData.data.memberProfiles || [];
        const populatedTasks = taskData.data.tasks
            ? populateTaskAssignments(taskData.data.tasks, memberProfiles)
            : [];

        // 6. Aggregate and return the combined data
        return NextResponse.json({
            memberProfiles: memberProfiles,
            currentUser: meData.data.user, // Pass current user data (includes pinSetupCompleted)
            tasks: Array.isArray(populatedTasks) ? populatedTasks : [populatedTasks],
            storeItems: storeData.data.storeItems || [],
            mealPlans: mealPlansData.data.mealPlans || [],
            recipes: recipesData.data.recipes || [],
        });

    } catch (err: any) {
        return NextResponse.json({ message: 'BFF Error: Failed to fetch family page data', error: err.message }, { status: 500 });
    }
}