// =========================================================
// momentum-web/app/components/kiosk/KioskDashboard.tsx
// Main Kiosk View - The "Always-On" Family Command Center
// Shows: Family Roster, Calendar, Meal Plan, Pending Tasks
// =========================================================
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from '../layout/SessionContext';
import { IHouseholdMemberProfile } from '../members/MemberList';
import { ITask } from '../tasks/TaskList';
import { IStoreItem } from '../store/StoreItemList';
import { Loader, AlertTriangle, User, Calendar, UtensilsCrossed, ListTodo, Bell, Settings } from 'lucide-react';
import KioskMemberProfileModal from './KioskMemberProfileModal';
import PinVerificationModal from '../auth/PinVerificationModal';
import { useRouter } from 'next/navigation';
import { useSocketEvent } from '../../../lib/hooks/useSocket';
import { SOCKET_EVENTS, TaskUpdatedEvent, MemberPointsUpdatedEvent, StoreItemUpdatedEvent, HouseholdUpdatedEvent } from '../../../lib/socket';

// --- Types ---

// --- Types ---

interface IWeeklyMealPlan {
    _id: string;
    startDate: string;
    endDate: string;
    meals: {
        _id: string;
        date: string;
        mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
        itemType: 'Recipe' | 'Restaurant' | 'Custom';
        itemId?: { _id: string; name: string; title?: string; description?: string };
        customTitle?: string;
    }[];
}

interface IRecipe {
    _id: string;
    name: string;
    description?: string;
    prepTime?: number;
    cookTime?: number;
}

// --- Member Avatar Card Component ---
interface MemberAvatarProps {
    member: IHouseholdMemberProfile;
    taskCount: number;
    onClick: () => void;
}

const MemberAvatar: React.FC<MemberAvatarProps> = ({ member, taskCount, onClick }) => {
    return (
        <button
            onClick={onClick}
            className="group relative flex flex-col items-center p-6 bg-bg-surface/60 backdrop-blur-sm rounded-2xl 
                       border-2 border-border-subtle hover:border-action-primary 
                       shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105
                       min-w-[160px]"
            style={{
                borderColor: member.profileColor ? `${member.profileColor}40` : undefined,
            }}
        >
            {/* Avatar Circle */}
            <div
                className="w-24 h-24 rounded-full flex items-center justify-center text-white font-bold text-3xl mb-3 
                           shadow-lg group-hover:shadow-xl transition-shadow"
                style={{ backgroundColor: member.profileColor || '#6B7280' }}
            >
                {member.role === 'Parent' ? (
                    <User className="w-12 h-12" />
                ) : (
                    member.displayName.charAt(0).toUpperCase()
                )}
            </div>

            {/* Name */}
            <h3 className="text-lg font-semibold text-text-primary mb-1">
                {member.displayName}
            </h3>

            {/* Stats Row */}
            <div className="flex items-center space-x-4 mt-2">
                {/* Points */}
                <div className="text-center">
                    <p className="text-2xl font-bold text-action-primary">
                        {member.pointsTotal}
                    </p>
                    <p className="text-xs text-text-secondary">Points</p>
                </div>

                {/* Task Count */}
                <div className="text-center">
                    <p className="text-2xl font-bold text-text-primary">
                        {taskCount}
                    </p>
                    <p className="text-xs text-text-secondary">Tasks</p>
                </div>
            </div>

            {/* Task Badge (if tasks pending) */}
            {taskCount > 0 && (
                <div className="absolute -top-2 -right-2 bg-signal-success text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-lg">
                    {taskCount}
                </div>
            )}
        </button>
    );
};

// --- Quick Info Card Component ---
interface InfoCardProps {
    icon: React.ElementType;
    title: string;
    children: React.ReactNode;
}

const InfoCard: React.FC<InfoCardProps> = ({ icon: Icon, title, children }) => {
    return (
        <div className="bg-bg-surface/60 backdrop-blur-sm rounded-2xl border border-border-subtle shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
                <div className="bg-action-primary/10 p-3 rounded-xl">
                    <Icon className="w-6 h-6 text-action-primary" />
                </div>
                <h2 className="text-xl font-semibold text-text-primary">{title}</h2>
            </div>
            <div>{children}</div>
        </div>
    );
};

// --- Remind Parent FAB ---
const RemindParentButton: React.FC = () => {
    const handlePress = () => {
        // In a real app, this would send a push notification
        alert('Parent has been notified! (Simulation)');
    };

    return (
        <button
            onClick={handlePress}
            className="fixed bottom-8 right-8 bg-action-primary text-white p-4 rounded-full shadow-xl 
                       hover:bg-action-hover hover:scale-110 transition-all duration-300 z-50 flex items-center gap-2"
        >
            <Bell className="w-6 h-6" />
            <span className="font-bold pr-2">Remind Parent</span>
        </button>
    );
};

// --- Main Kiosk Dashboard Component ---
const KioskDashboard: React.FC = () => {
    console.log('[KioskDashboard] Component rendering');
    const { token, householdId, user } = useSession();
    console.log('[KioskDashboard] Session data - token:', !!token, 'householdId:', householdId, 'user:', user);

    const [members, setMembers] = useState<IHouseholdMemberProfile[]>([]);
    const [tasks, setTasks] = useState<ITask[]>([]);
    const [storeItems, setStoreItems] = useState<IStoreItem[]>([]);
    const [mealPlans, setMealPlans] = useState<IWeeklyMealPlan[]>([]);
    const [recipes, setRecipes] = useState<IRecipe[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modal state
    const [selectedMember, setSelectedMember] = useState<IHouseholdMemberProfile | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // --- Parent Dashboard Navigation ---
    const router = useRouter();
    const [isPinModalOpen, setIsPinModalOpen] = useState(false);
    const [parentMemberId, setParentMemberId] = useState<string>('');

    const fetchData = useCallback(async () => {
        console.log('[KioskDashboard] fetchData called');
        if (!token || !householdId) {
            console.log('[KioskDashboard] Missing auth - token:', !!token, 'householdId:', householdId);
            setError('Authentication error. Please log in again.');
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);

        try {
            console.log('[KioskDashboard] Fetching from /web-bff/family/page-data');
            // Use the family page-data endpoint (same data we need)
            const response = await fetch('/web-bff/family/page-data', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            console.log('[KioskDashboard] Response status:', response.status);
            if (!response.ok) {
                throw new Error('Failed to fetch kiosk data');
            }

            const data = await response.json();
            console.log('[KioskDashboard] Data received:', data);

            if (data.memberProfiles && data.tasks && data.storeItems) {
                setMembers(data.memberProfiles);
                setTasks(data.tasks);
                setStoreItems(data.storeItems);
                setMealPlans(data.mealPlans || []);
                setRecipes(data.recipes || []);
                console.log('[KioskDashboard] Data set successfully');
            } else {
                throw new Error('Invalid data structure');
            }

        } catch (e: any) {
            console.error('[KioskDashboard] Error:', e);
            setError(e.message);
        } finally {
            setLoading(false);
            console.log('[KioskDashboard] Loading complete');
        }
    }, [token, householdId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // ========================================
    // WebSocket Real-Time Updates
    // ========================================

    // Listen for task updates
    useSocketEvent<TaskUpdatedEvent>(SOCKET_EVENTS.TASK_UPDATED, (data) => {
        console.log('[KioskDashboard] Task updated via WebSocket:', data);

        if (data.type === 'create' && data.task) {
            // Add new task
            setTasks(prev => [data.task, ...prev]);
        } else if (data.type === 'update' && data.task) {
            // Update existing task
            setTasks(prev => prev.map(t => t._id === data.task._id ? data.task : t));

            // Update member points if included
            if (data.memberUpdate) {
                setMembers(prev => prev.map(m =>
                    m._id === data.memberUpdate!.memberId
                        ? { ...m, pointsTotal: data.memberUpdate!.pointsTotal }
                        : m
                ));
            }
        } else if (data.type === 'delete' && data.taskId) {
            // Remove deleted task
            setTasks(prev => prev.filter(t => t._id !== data.taskId));
        }
    });

    // Listen for member points updates
    useSocketEvent<MemberPointsUpdatedEvent>(SOCKET_EVENTS.MEMBER_POINTS_UPDATED, (data) => {
        console.log('[KioskDashboard] Member points updated via WebSocket:', data);

        setMembers(prev => prev.map(m =>
            m._id === data.memberId
                ? { ...m, pointsTotal: data.pointsTotal }
                : m
        ));
    });

    // Listen for store item updates
    useSocketEvent<StoreItemUpdatedEvent>(SOCKET_EVENTS.STORE_ITEM_UPDATED, (data) => {
        console.log('[KioskDashboard] Store item updated via WebSocket:', data);

        if (data.type === 'create' && data.storeItem) {
            setStoreItems(prev => [data.storeItem, ...prev]);
        } else if (data.type === 'update' && data.storeItem) {
            setStoreItems(prev => prev.map(item => item._id === data.storeItem._id ? data.storeItem : item));
        } else if (data.type === 'delete' && data.storeItemId) {
            setStoreItems(prev => prev.filter(item => item._id !== data.storeItemId));
        }
    });

    // Listen for household updates (renames, member add/remove/update)
    useSocketEvent<HouseholdUpdatedEvent>(SOCKET_EVENTS.HOUSEHOLD_UPDATED, (data) => {
        console.log('[KioskDashboard] Household updated via WebSocket:', data);

        // Only refresh if it matches our current household
        if (data.householdId === householdId) {
            console.log('[KioskDashboard] Refreshing data due to household update');
            fetchData();
        }
    });

    // Get task count for a member
    // NOTE: We use the member's PROFILE ID (_id), not the user ID (familyMemberId._id)
    const getTaskCount = (memberProfileId: string) => {
        return tasks.filter(task =>
            !task.isCompleted &&
            task.assignedTo?.some(assignee => assignee._id === memberProfileId)
        ).length;
    };

    // Handle member selection
    const handleMemberClick = (member: IHouseholdMemberProfile) => {
        setSelectedMember(member);
        setIsModalOpen(true);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setSelectedMember(null);
        // No need to refresh data - WebSocket updates handle this automatically
    };

    // --- Helpers for Meal Display ---
    const getTodaysMeal = () => {
        const today = new Date().toISOString().split('T')[0];

        // Find the meal for today in any of the weekly plans
        let todaysDinner: any = null;

        for (const plan of mealPlans) {
            const meal = plan.meals.find(m =>
                m.date.startsWith(today) && m.mealType === 'Dinner'
            );
            if (meal) {
                todaysDinner = meal;
                break;
            }
        }

        if (todaysDinner) {
            if (todaysDinner.itemType === 'Restaurant') {
                return {
                    title: todaysDinner.itemId?.name || 'Eating Out',
                    description: 'Restaurant Night!'
                };
            }

            const recipeName = todaysDinner.itemId?.title || todaysDinner.itemId?.name || todaysDinner.customTitle || 'Dinner';
            const recipeDesc = todaysDinner.itemId?.description || 'Delicious meal';

            return {
                title: recipeName,
                description: recipeDesc
            };
        }

        // Fallback: Show a random recipe if no plan
        if (recipes.length > 0) {
            const randomRecipe = recipes[0]; // Just take first for now
            return {
                title: randomRecipe.name,
                description: 'Suggested Meal'
            };
        }

        return null;
    };

    const todaysMeal = getTodaysMeal();


    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <Loader className="w-12 h-12 text-action-primary animate-spin mx-auto mb-4" />
                    <p className="text-text-secondary">Loading family data...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex items-center p-6 bg-signal-alert/10 text-signal-alert rounded-lg border border-signal-alert/30">
                    <AlertTriangle className="w-6 h-6 mr-3" />
                    <p className="font-medium">{error}</p>
                </div>
            </div>
        );
    }

    // Calculate stats
    const totalPendingTasks = tasks.filter(t => !t.isCompleted).length;
    const totalCompletedTasks = tasks.filter(t => t.isCompleted).length;



    const handleParentDashboardClick = () => {
        // Prioritize the current logged-in user if they are a parent
        // The user object from useSession contains the familyMemberId (as _id)
        // We need to find the corresponding profile in the members list to get the correct ID if needed,
        // but verifyPin expects memberId (which is the profile ID in household.memberProfiles).

        // Wait, user._id from session is usually the FamilyMember ID, not the HouseholdMemberProfile ID?
        // Let's check how user is populated in SessionProvider. 
        // Assuming user._id matches one of the member's familyMemberId or _id.
        // Actually, let's look at the members list. It contains _id (profile ID) and familyMemberId (user ID).

        let targetMemberId = '';

        // Try to find the current user in the members list
        // We don't have user object here yet, let's get it from useSession

        if (user && user.role === 'Parent') {
            // Find the member profile that corresponds to this user
            // We assume user._id is the FamilyMember ID.
            // But wait, the session user might be the profile ID? 
            // Let's assume for now we search by role 'Parent' and if multiple, we pick the one that matches user._id if possible.
            // Actually, let's just pick the first parent for now, BUT if the user is a parent, we should try to match them.

            // Since we don't have the user object destructured yet, let's add it.
            const currentUserProfile = members.find(m => m.familyMemberId._id === user._id || m._id === user._id);
            if (currentUserProfile && currentUserProfile.role === 'Parent') {
                targetMemberId = currentUserProfile._id;
            }
        }

        if (!targetMemberId) {
            // Fallback: Pick the first parent found
            const parent = members.find(m => m.role === 'Parent');
            if (parent) {
                targetMemberId = parent._id;
            }
        }

        if (targetMemberId) {
            setParentMemberId(targetMemberId);
            setIsPinModalOpen(true);
        } else {
            setError('No parent profile found to verify against.');
        }
    };

    const handlePinSuccess = () => {
        router.push('/admin');
    };

    return (
        <div className="space-y-8 pb-24 relative">
            {/* Page Title & Header Actions */}
            <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
                <div className="text-center md:text-left">
                    <h1 className="text-4xl font-bold text-text-primary mb-2">
                        Welcome to Your Family Dashboard
                    </h1>
                    <p className="text-lg text-text-secondary">
                        Tap a family member to view their tasks and rewards
                    </p>
                </div>

                <button
                    onClick={handleParentDashboardClick}
                    className="flex items-center gap-2 px-6 py-3 bg-bg-surface border border-border-subtle rounded-xl 
                               text-text-secondary hover:text-action-primary hover:border-action-primary 
                               transition-all shadow-sm hover:shadow-md"
                >
                    <Settings className="w-5 h-5" />
                    <span className="font-medium">Parent Dashboard</span>
                </button>
            </div>

            {/* Family Member Grid */}
            <section>
                <h2 className="text-2xl font-semibold text-text-primary mb-6 flex items-center">
                    <User className="w-6 h-6 mr-2 text-action-primary" />
                    Family Members
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {members
                        .sort((a, b) => {
                            // Parents first, then alphabetical
                            if (a.role === 'Parent' && b.role !== 'Parent') return -1;
                            if (a.role !== 'Parent' && b.role === 'Parent') return 1;
                            return a.displayName.localeCompare(b.displayName);
                        })
                        .map((member) => (
                            <MemberAvatar
                                key={member._id}
                                member={member}
                                taskCount={getTaskCount(member._id)}
                                onClick={() => handleMemberClick(member)}
                            />
                        ))}
                </div>
            </section>

            {/* Quick Info Grid */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Today's Tasks */}
                <InfoCard icon={ListTodo} title="Today's Tasks">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-text-secondary">Pending</span>
                            <span className="text-2xl font-bold text-action-primary">
                                {totalPendingTasks}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-text-secondary">Completed Today</span>
                            <span className="text-2xl font-bold text-signal-success">
                                {totalCompletedTasks}
                            </span>
                        </div>
                    </div>
                </InfoCard>

                {/* Calendar (Placeholder) */}
                <InfoCard icon={Calendar} title="Today's Schedule">
                    <div className="text-center py-4">
                        <p className="text-text-secondary">
                            No events scheduled for today
                        </p>
                    </div>
                </InfoCard>

                {/* Meal Plan */}
                <InfoCard icon={UtensilsCrossed} title="Today's Meals">
                    <div className="text-center py-2">
                        {todaysMeal ? (
                            <div>
                                <h3 className="text-lg font-bold text-text-primary">{todaysMeal.title}</h3>
                                <p className="text-text-secondary">{todaysMeal.description}</p>
                            </div>
                        ) : (
                            <p className="text-text-secondary">
                                No meal planned
                            </p>
                        )}
                    </div>
                </InfoCard>
            </section>

            {/* Remind Parent Button */}
            <RemindParentButton />

            {/* Member Profile Modal */}
            {
                isModalOpen && selectedMember && (
                    <KioskMemberProfileModal
                        member={selectedMember}
                        allTasks={tasks}
                        allItems={storeItems}
                        onClose={handleModalClose}
                    />
                )
            }

            {/* PIN Verification Modal */}
            <PinVerificationModal
                isOpen={isPinModalOpen}
                onClose={() => setIsPinModalOpen(false)}
                onSuccess={handlePinSuccess}
                title="Parent Access"
                description="Enter your PIN to access the Parent Dashboard."
                memberId={parentMemberId}
                householdId={householdId || ''}
            />
        </div>
    );
};

export default KioskDashboard;
