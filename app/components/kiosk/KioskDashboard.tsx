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
import { Loader, AlertTriangle, User, Calendar, UtensilsCrossed, ListTodo, Bell } from 'lucide-react';
import KioskMemberProfileModal from './KioskMemberProfileModal';
import { useSocketEvent } from '../../../lib/hooks/useSocket';
import { SOCKET_EVENTS, TaskUpdatedEvent, MemberPointsUpdatedEvent, StoreItemUpdatedEvent, HouseholdUpdatedEvent } from '../../../lib/socket';

// --- Types ---

interface IMealPlan {
    _id: string;
    date: string;
    meals: {
        dinner: {
            mainDishId?: string;
            sideDish?: string;
            restaurantId?: string;
            notes?: string;
        }
    }
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
    const { token, householdId } = useSession();
    console.log('[KioskDashboard] Session data - token:', !!token, 'householdId:', householdId);

    const [members, setMembers] = useState<IHouseholdMemberProfile[]>([]);
    const [tasks, setTasks] = useState<ITask[]>([]);
    const [storeItems, setStoreItems] = useState<IStoreItem[]>([]);
    const [mealPlans, setMealPlans] = useState<IMealPlan[]>([]);
    const [recipes, setRecipes] = useState<IRecipe[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modal state
    const [selectedMember, setSelectedMember] = useState<IHouseholdMemberProfile | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

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
        const todaysPlan = mealPlans.find(p => p.date.startsWith(today));

        if (todaysPlan) {
            if (todaysPlan.meals.dinner.restaurantId) {
                return {
                    title: 'Eating Out',
                    description: 'Restaurant Night!'
                };
            }
            const mainDish = recipes.find(r => r._id === todaysPlan.meals.dinner.mainDishId);
            return {
                title: mainDish ? mainDish.name : 'Dinner',
                description: todaysPlan.meals.dinner.sideDish || (mainDish?.description) || 'Delicious meal'
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

    return (
        <div className="space-y-8 pb-24">
            {/* Page Title */}
            <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-text-primary mb-2">
                    Welcome to Your Family Dashboard
                </h1>
                <p className="text-lg text-text-secondary">
                    Tap a family member to view their tasks and rewards
                </p>
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
        </div>
    );
};

export default KioskDashboard;
