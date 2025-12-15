// =========================================================
// momentum-web/app/family/page.tsx
// Family View - The Primary Interface (Kiosk Mode)
// =========================================================
'use client';

import { Suspense } from 'react';
import { useSession } from '../components/layout/SessionContext';
import { useRouter } from 'next/navigation';
import { Settings } from 'lucide-react';
import KioskDashboard from '../components/kiosk/KioskDashboard';
import Loading from '../components/layout/Loading';
import ThemeSwitcher from '../components/settings/ThemeSwitcher';

/**
 * Family View - The main interface for daily family interaction
 * This is the default view after login for ALL users
 */
export default function FamilyPage() {
    console.log('[FamilyPage] Component rendering');
    const { user, isLoading } = useSession();
    const router = useRouter();

    console.log('[FamilyPage] User:', user, 'Loading:', isLoading);

    // Redirect if not authenticated
    if (!isLoading && !user) {
        console.log('[FamilyPage] No user found, redirecting to login');
        router.push('/login');
        return <Loading />;
    }

    if (isLoading || !user) {
        console.log('[FamilyPage] Loading user data...');
        return <Loading />;
    }

    const isParent = user.role === 'Parent';
    console.log('[FamilyPage] User authenticated, isParent:', isParent);

    return (
        <div className="min-h-screen bg-bg-canvas">
            {/* Minimal Header */}
            <header className="bg-bg-surface border-b border-border-subtle shadow-sm">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-text-primary">
                        Momentum
                    </h1>

                    <div className="flex items-center space-x-4">
                        {/* Theme Switcher - Always Visible */}
                        <ThemeSwitcher />
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 py-8">
                <Suspense fallback={<Loading />}>
                    <KioskDashboard />
                </Suspense>
            </main>
        </div>
    );
}