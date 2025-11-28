// =========================================================
// momentum-web/app/admin/page.tsx
// Consolidated Parent View - ALL management in one place
// =========================================================
'use client';

import React, { useState } from 'react';
import { useSession } from '../components/layout/SessionContext';
import { useRouter } from 'next/navigation';
import {
    ListTodo,
    ShoppingCart,
    Users,
    UtensilsCrossed,
    CheckCircle,
    Settings,
    ArrowLeft,
    Shield
} from 'lucide-react';
import TaskList from '../components/tasks/TaskList';
import StoreItemList from '../components/store/StoreItemList';
import MemberList from '../components/members/MemberList';
import MealDashboard from '../components/meals/MealDashboard';
import ThemeSwitcher from '../components/settings/ThemeSwitcher';
import Loading from '../components/layout/Loading';
import ApprovalsDashboard from '../components/approvals/ApprovalsDashboard';
import InviteCodeManager from '../components/settings/InviteCodeManager';
import PinManagement from '../components/settings/PinManagement';

type AdminTab = 'tasks' | 'store' | 'members' | 'meals' | 'approvals' | 'settings';

export default function AdminPage() {
    const { user } = useSession();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<AdminTab>('tasks');

    // Role-based access control
    if (!user) {
        return <Loading />;
    }

    if (user.role !== 'Parent') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-bg-canvas p-8">
                <div className="bg-bg-surface p-8 rounded-2xl shadow-xl border border-border-subtle max-w-md text-center">
                    <Shield className="w-16 h-16 text-signal-alert mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-text-primary mb-2">Access Denied</h1>
                    <p className="text-text-secondary mb-6">
                        Only parents can access the Parent View.
                    </p>
                    <button
                        onClick={() => router.push('/family')}
                        className="px-6 py-3 bg-action-primary text-white rounded-lg font-medium hover:bg-action-hover transition-all"
                    >
                        Return to Family View
                    </button>
                </div>
            </div>
        );
    }

    // Tab configuration
    const tabs: { id: AdminTab; label: string; icon: React.ElementType }[] = [
        { id: 'tasks', label: 'Tasks', icon: ListTodo },
        { id: 'store', label: 'Store', icon: ShoppingCart },
        { id: 'members', label: 'Members', icon: Users },
        { id: 'meals', label: 'Meals', icon: UtensilsCrossed },
        { id: 'approvals', label: 'Approvals', icon: CheckCircle },
        { id: 'settings', label: 'Settings', icon: Settings },
    ];

    return (
        <div className="min-h-screen bg-bg-canvas">
            {/* Header */}
            <header className="bg-bg-surface border-b border-border-subtle shadow-sm">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => router.push('/family')}
                                className="flex items-center space-x-2 text-text-secondary hover:text-action-primary transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5" />
                                <span className="text-sm font-medium">Back to Family View</span>
                            </button>
                            <div className="h-6 w-px bg-border-subtle" />
                            <h1 className="text-2xl font-bold text-text-primary">
                                Parent View
                            </h1>
                        </div>
                        <div className="text-sm text-text-secondary">
                            Logged in as {user.firstName}
                        </div>
                    </div>
                </div>
            </header>

            {/* Tab Navigation */}
            <div className="bg-bg-surface border-b border-border-subtle">
                <div className="max-w-7xl mx-auto px-6">
                    <nav className="flex space-x-1">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center space-x-2 px-6 py-4 font-medium transition-all border-b-2 ${isActive
                                        ? 'border-action-primary text-action-primary bg-action-primary/5'
                                        : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-bg-canvas'
                                        }`}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span>{tab.label}</span>
                                </button>
                            );
                        })}
                    </nav>
                </div>
            </div >

            {/* Tab Content */}
            < main className="max-w-7xl mx-auto px-6 py-8" >
                {activeTab === 'tasks' && (
                    <div>
                        <h2 className="text-3xl font-semibold text-text-primary mb-6">
                            Task Management
                        </h2>
                        <TaskList />
                    </div>
                )
                }

                {
                    activeTab === 'store' && (
                        <div>
                            <h2 className="text-3xl font-semibold text-text-primary mb-6">
                                Reward Store
                            </h2>
                            <StoreItemList />
                        </div>
                    )
                }

                {
                    activeTab === 'members' && (
                        <div>
                            <h2 className="text-3xl font-semibold text-text-primary mb-6">
                                Family Team
                            </h2>
                            <MemberList />
                        </div>
                    )
                }

                {
                    activeTab === 'meals' && (
                        <div>
                            <MealDashboard />
                        </div>
                    )
                }

                {
                    activeTab === 'approvals' && (
                        <div>
                            <ApprovalsDashboard />
                        </div>
                    )
                }

                {
                    activeTab === 'settings' && (
                        <div>
                            <h2 className="text-3xl font-semibold text-text-primary mb-6">
                                Team Settings
                            </h2>
                            <div className="max-w-2xl">
                                <ThemeSwitcher />
                                <InviteCodeManager />
                                <PinManagement />
                            </div>
                        </div>
                    )
                }
            </main >
        </div >
    );
}
