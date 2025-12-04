// =========================================================
// momentum-web/app/components/kiosk/KioskDashboard.tsx
// Main Kiosk View - The "Always-On" Family Command Center
// Shows: Family Roster, Calendar, Meal Plan, Pending Tasks
// =========================================================
'use client';

import React, { useState } from 'react';
import { useSession } from '../layout/SessionContext';
import { IHouseholdMemberProfile, ITask, IStoreItem, IRecipe } from '../../types';
import { Loader, AlertTriangle, User, Calendar, UtensilsCrossed, ListTodo, Bell, Settings, Target } from 'lucide-react';
import KioskMemberProfileModal from './KioskMemberProfileModal';
import FocusModeModal from '../focus/FocusModeModal';
import PinVerificationModal from '../auth/PinVerificationModal';
import { useRouter } from 'next/navigation';
import { useFamilyData } from '../../../lib/hooks/useFamilyData';

// --- Types ---

// --- Member Avatar Card Component ---
interface MemberAvatarProps {
    member: IHouseholdMemberProfile;
    taskCount: number;
    focusedTask?: ITask;
    onClick: () => void;
    onFocusClick: (e: React.MouseEvent) => void;
}

const MemberAvatar: React.FC<MemberAvatarProps> = ({ member, taskCount, focusedTask, onClick, onFocusClick }) => {
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
            {/* Focus Mode Button */}
            <div
                onClick={onFocusClick}
                className={`absolute top-3 right-3 p-2 rounded-full transition-all z-10
                    ${focusedTask
                        ? 'bg-action-primary text-white shadow-lg scale-110'
                        : 'bg-bg-surface/50 text-text-tertiary hover:bg-action-primary hover:text-white hover:scale-110'}`}
                title={focusedTask ? `Focused: ${focusedTask.title}` : "Set Focus Task"}
            >
                <Target className="w-5 h-5" />
            </div>

            {/* Avatar Circle */}
            <div
                className={`w-24 h-24 rounded-full flex items-center justify-center text-white font-bold text-3xl mb-3 
                           shadow-lg group-hover:shadow-xl transition-shadow relative
                           ${focusedTask ? 'ring-4 ring-action-primary ring-offset-2 ring-offset-bg-surface' : ''}`}
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

            {/* Focused Task Label */}
            {focusedTask && (
                <div className="mb-2 px-3 py-1 rounded-full bg-action-primary/10 border border-action-primary/20">
                    <p className="text-xs font-medium text-action-primary truncate max-w-[120px]">
                        🎯 {focusedTask.title}
                    </p>
                </div>
            )}

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
    const { householdId, user } = useSession();
    const { members, tasks, storeItems, mealPlans, recipes, loading, error, refresh } = useFamilyData();

    // Modal state
    const [selectedMember, setSelectedMember] = useState<IHouseholdMemberProfile | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isFocusModalOpen, setIsFocusModalOpen] = useState(false);

    // --- Parent Dashboard Navigation ---
    const router = useRouter();
    const [isPinModalOpen, setIsPinModalOpen] = useState(false);
    const [parentMemberId, setParentMemberId] = useState<string>('');

    // Get task count for a member
    // NOTE: We use the member's PROFILE ID (_id), not the user ID (familyMemberId._id)
    const getTaskCount = (memberProfileId: string) => {
        return tasks.filter(task =>
            !task.isCompleted &&
            task.assignedTo?.some(assignee => assignee._id === memberProfileId)
        ).length;
    };

    const getFocusedTask = (member: IHouseholdMemberProfile) => {
        if (!member.currentFocusTaskId) return undefined;
        return tasks.find(t => t._id === member.currentFocusTaskId);
    };

    // Handle member selection
    const handleMemberClick = (member: IHouseholdMemberProfile) => {
        setSelectedMember(member);
        setIsModalOpen(true);
    };

    const handleFocusClick = (e: React.MouseEvent, member: IHouseholdMemberProfile) => {
        e.stopPropagation(); // Prevent opening the profile modal
        setSelectedMember(member);
        setIsFocusModalOpen(true);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setIsFocusModalOpen(false);
        setSelectedMember(null);
        // No need to refresh data - WebSocket updates handle this automatically
    };

    // --- Helpers for Meal Display ---
    const getTodaysMeal = () => {
        const today = new Date().toISOString().split('T')[0];

        // Find the meal for today in any of the weekly plans
        let todaysDinner: any = null;

        for (const plan of mealPlans) {
            const meal = plan.meals.find(m => {
                const mDate = typeof m.date === 'string' ? m.date : m.date.toISOString();
                return mDate.startsWith(today) && m.mealType === 'Dinner';
            });
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
                title: randomRecipe.title,
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
        let targetMemberId = '';

        console.log('[KioskDashboard] Finding parent member for PIN verification');
        console.log('[KioskDashboard] Current user:', user);
        console.log('[KioskDashboard] Available members:', members.map(m => ({
            _id: m._id,
            displayName: m.displayName,
            role: m.role,
            familyMemberId: typeof m.familyMemberId === 'object' ? m.familyMemberId._id : m.familyMemberId
        })));

        if (user && user.role === 'Parent') {
            const currentUserProfile = members.find(m => {
                // Handle both populated (object) and unpopulated (string) familyMemberId
                const familyMemberIdStr = typeof m.familyMemberId === 'object'
                    ? m.familyMemberId._id
                    : m.familyMemberId;
                return familyMemberIdStr === user._id;
            });

            console.log('[KioskDashboard] Found current user profile:', currentUserProfile);

            if (currentUserProfile && currentUserProfile.role === 'Parent') {
                targetMemberId = currentUserProfile._id;
            }
        }

        if (!targetMemberId) {
            // Fallback: Pick the first parent found
            const parent = members.find(m => m.role === 'Parent');
            console.log('[KioskDashboard] Fallback to first parent:', parent);
            if (parent) {
                targetMemberId = parent._id;
            }
        }

        if (targetMemberId) {
            console.log('[KioskDashboard] Parent member ID for PIN verification:', targetMemberId);
            console.log('[KioskDashboard] Household ID:', householdId);
            setParentMemberId(targetMemberId);
            setIsPinModalOpen(true);
        } else {
            console.error('[KioskDashboard] No parent profile found!');
            alert('No parent profile found to verify against.');
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
                                focusedTask={getFocusedTask(member)}
                                onClick={() => handleMemberClick(member)}
                                onFocusClick={(e) => handleFocusClick(e, member)}
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

            {/* Focus Mode Modal */}
            {
                isFocusModalOpen && selectedMember && (
                    <FocusModeModal
                        member={selectedMember}
                        tasks={tasks}
                        onClose={handleModalClose}
                        onFocusSet={() => {
                            // Optimistic update or refresh
                            refresh();
                        }}
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
