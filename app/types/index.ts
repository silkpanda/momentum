// =========================================================
// momentum-web/app/types/index.ts
// Centralized Type Definitions
// =========================================================

// --- Task Interface ---
export interface ITask {
    _id: string;
    title: string;
    description: string;
    pointsValue: number;
    isCompleted: boolean;
    status?: 'Pending' | 'In Progress' | 'Completed' | 'Approved' | 'PendingApproval';
    assignedTo: {
        _id: string;
        displayName: string;
        profileColor?: string;
    }[];
    householdRefId: string;
    completedBy?: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
}

// --- Quest Interface ---
export interface IQuestClaim {
    memberId: string;
    status: 'claimed' | 'completed' | 'approved';
    claimedAt: string;
    completedAt?: string;
    approvedAt?: string;
}

export interface IQuest {
    _id: string;
    title: string;
    description: string;
    pointsValue: number;
    isActive: boolean;
    claims: IQuestClaim[];
    createdBy?: string;
    createdAt?: Date | string;
    // Added fields for edit modal compatibility
    questType: 'one-time' | 'recurring';
    maxClaims?: number;
    dueDate?: string;
    recurrence?: {
        frequency: 'daily' | 'weekly' | 'monthly';
        nextReset?: string; // Optionalized to be safe
    };
    status?: 'active' | 'claimed' | 'completed' | 'approved' | 'Active' | 'Completed' | 'Expired';
    requirements?: string[];
    expiresAt?: Date | string;
}

// --- Store Item Interface ---
export interface IStoreItem {
    _id: string;
    itemName: string;
    description: string;
    cost: number;
    householdRefId: string;
    stock?: number;
    isInfinite?: boolean;
    image?: string;
    icon?: string;
}

// --- Member Interface ---
export interface IHouseholdMemberProfile {
    _id: string; // This is the sub-document ID
    familyMemberId: {
        _id: string;
        firstName: string;
        email?: string; // Populated for parents
    };
    displayName: string;
    role: 'Parent' | 'Child';
    profileColor?: string; // Optional: only for children
    pointsTotal: number;
    currentFocusTaskId?: string;
}

export interface IHousehold {
    _id: string;
    householdName: string;
    memberProfiles: IHouseholdMemberProfile[];
}

// --- Restaurant Interface ---
export interface IRestaurant {
    _id: string;
    name: string;
    cuisine?: string;
    address?: string;
    phone?: string;
    website?: string;
    rating?: number;
    priceRange?: '$' | '$$' | '$$$' | '$$$$';
}

// --- Recipe Interface ---
export interface IRecipe {
    _id: string;
    name: string;
    description?: string;
    prepTime?: number;
    cookTime?: number;
    servings?: number;
    ingredients?: string[];
    instructions?: string[];
    imageUrl?: string;
    tags?: string[];
}

// --- Meal Plan Interface ---
// --- Meal Entry Interface ---
export interface IMealEntry {
    _id: string;
    date: Date | string;
    mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
    itemId?: {
        _id: string;
        name?: string; // For recipes and restaurants
        description?: string;
    };
    itemType: 'Recipe' | 'Restaurant' | 'Custom';
    customTitle?: string;
    notes?: string;
}

// --- Weekly Meal Plan Interface ---
export interface IMealPlan {
    _id: string;
    startDate: string;
    endDate: string;
    meals: IMealEntry[];
}

// --- Routine Interface ---
export interface IRoutineStep {
    title: string;
    isCompleted: boolean;
    _id?: string; // Optional as per previous definition, but RoutineList doesn't have it. Keeping it optional just in case.
}

export interface IRoutine {
    _id: string;
    title: string;
    description?: string;
    assignedTo: string; // Member ID
    steps: IRoutineStep[];
    schedule: {
        frequency: 'daily' | 'weekly';
        days?: string[]; // e.g., ['Monday', 'Wednesday']
        timeOfDay?: string;
    };
    pointsReward: number;
    icon?: string;
    color?: string;
    isActive: boolean;
    lastCompleted?: string; // ISO Date
}

// --- Wishlist Item Interface ---
export interface IWishlistItem {
    _id: string;
    title: string;
    cost: number;
    url?: string;
    imageUrl?: string;
    memberId: string;
    isPurchased: boolean;
}
