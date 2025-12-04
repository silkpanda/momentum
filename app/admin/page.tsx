// =========================================================
// momentum-web/app/admin/page.tsx
// Consolidated Parent View - Bento Command Center
// =========================================================
'use client';

import React from 'react';
import { useSession } from '../components/layout/SessionContext';
import { useRouter } from 'next/navigation';
import { Shield, ArrowLeft } from 'lucide-react';
import Loading from '../components/layout/Loading';
import BentoDashboard from '../components/admin/BentoDashboard';

export default function AdminPage() {
    const { user } = useSession();
    const router = useRouter();

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
                            <h1 className="text-xl font-bold text-text-primary">
                                Command Center
                            </h1>
                        </div>
                        <div className="text-sm text-text-secondary">
                            Logged in as {user.firstName}
                        </div>
                    </div>
                </div>
            </header>

            {/* Dashboard Content */}
            <BentoDashboard />
        </div>
    );
}
