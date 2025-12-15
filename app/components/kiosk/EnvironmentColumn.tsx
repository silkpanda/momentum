'use client';

import React, { useState, useEffect } from 'react';
import { IMealPlan, IQuest, IRecipe } from '../../types';
import { UtensilsCrossed, Trophy, Flame } from 'lucide-react';

interface EnvironmentColumnProps {
    mealPlans: IMealPlan[];
    recipes: IRecipe[];
    quests: IQuest[];
}

const EnvironmentColumn: React.FC<EnvironmentColumnProps> = ({ mealPlans, recipes, quests }) => {

    // --- Clock Logic ---
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000); // Update every second
        return () => clearInterval(timer);
    }, []);

    // --- Meal Logic ---
    const getTodaysDinner = () => {
        const todayStr = new Date().toISOString().split('T')[0];
        let dinner: any = null;

        for (const plan of mealPlans) {
            const meal = plan.meals.find(m => {
                const mDate = typeof m.date === 'string' ? m.date : new Date(m.date).toISOString();
                return mDate.startsWith(todayStr) && m.mealType === 'Dinner';
            });
            if (meal) {
                dinner = meal;
                break;
            }
        }

        if (!dinner) return null;

        if (dinner.itemType === 'Restaurant') {
            return {
                title: dinner.itemId?.name || 'Restaurant Night',
                subtitle: 'Eating Out'
            };
        }

        const title = dinner.itemId?.name || dinner.customTitle || 'Dinner';
        const sub = 'Home Cooked';
        return { title, subtitle: sub };
    };

    const dinner = getTodaysDinner();

    // --- Quest Logic ---
    // Just grab the first active quest for now as a "Pinned" family goal
    const activeQuest = quests.find(q => q.isActive && q.questType !== 'unlimited');

    return (
        <div className="h-full flex flex-col gap-6">

            {/* Widget A: The Temporal Anchor (Clock) */}
            <div className="flex-1 bg-action-primary text-white rounded-3xl p-6 flex flex-col items-center justify-center shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform">
                    <ClockDisplayIcon className="w-32 h-32" />
                </div>

                <h2 className="text-6xl font-black tracking-tighter mb-2">
                    {time.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                </h2>
                <p className="text-xl font-medium text-white/80 uppercase tracking-widest">
                    {time.toLocaleDateString([], { weekday: 'long' })}
                </p>
                <div className="mt-2 text-sm bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                    {time.toLocaleDateString([], { month: 'long', day: 'numeric' })}
                </div>
            </div>

            {/* Widget B: Fuel (Meal) */}
            <div className="bg-signal-alert text-white rounded-3xl p-6 shadow-lg relative overflow-hidden">
                <div className="flex items-center gap-4 relative z-10">
                    <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                        <UtensilsCrossed className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <p className="text-indigo-100/80 text-xs font-bold uppercase tracking-wider mb-1">On The Menu</p>
                        <h3 className="text-xl font-bold leading-tight">
                            {dinner ? dinner.title : "What's for dinner?"}
                        </h3>
                        {dinner && <p className="text-sm text-white/90">{dinner.subtitle}</p>}
                    </div>
                </div>
                {/* Decoration */}
                <div className="absolute -bottom-4 -right-4 text-white/10 rotate-12">
                    <UtensilsCrossed className="w-24 h-24" />
                </div>
            </div>

            {/* Widget C: Quest */}
            <div className="bg-bg-surface border border-border-subtle rounded-3xl p-6 shadow-lg flex flex-col justify-between relative overflow-hidden">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <p className="text-text-secondary text-xs font-bold uppercase tracking-wider mb-1">Active Quest</p>
                        <h3 className="text-lg font-bold text-text-primary">
                            {activeQuest ? activeQuest.title : "No Active Quests"}
                        </h3>
                    </div>
                    <div className="p-2 bg-yellow-100 rounded-xl text-yellow-600">
                        <Trophy className="w-6 h-6" />
                    </div>
                </div>

                {activeQuest && (
                    <div className="w-full">
                        <div className="flex justify-between text-xs font-bold text-text-secondary mb-1">
                            <span>Progress</span>
                            <span>{Math.round((activeQuest.currentClaims / (activeQuest.maxClaims || 10)) * 100)}%</span>
                        </div>
                        <div className="w-full h-3 bg-bg-canvas rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"
                                style={{ width: `${Math.min(100, (activeQuest.currentClaims / (activeQuest.maxClaims || 10)) * 100)}%` }}
                            />
                        </div>
                    </div>
                )}

                {!activeQuest && (
                    <div className="text-sm text-text-secondary italic">
                        Check the Quest Board to start an adventure!
                    </div>
                )}
            </div>
        </div>
    );
};

// Simple Icon Component for the clock background
const ClockDisplayIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
    </svg>
);

export default EnvironmentColumn;
