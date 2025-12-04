'use client';

import React, { useState, useEffect } from 'react';
import { UtensilsCrossed, Loader, AlertTriangle, Plus } from 'lucide-react';
import Modal from '../shared/Modal';
import { useSession } from '../layout/SessionContext';
import { useFamilyData } from '../../../lib/hooks/useFamilyData';

interface MealPlannerModalProps {
    onClose: () => void;
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

const MealPlannerModal: React.FC<MealPlannerModalProps> = ({ onClose }) => {
    const { token } = useSession();
    const { mealPlans, recipes, loading } = useFamilyData();

    // Get current week's meal plan (simplified - just use first plan if available)
    const currentPlan = mealPlans && mealPlans.length > 0 ? mealPlans[0] : null;

    return (
        <Modal isOpen={true} onClose={onClose} title="Meal Planner">
            <div className="space-y-4 min-h-[400px]">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <p className="text-sm text-text-secondary">Plan your family's meals for the week</p>
                    <button
                        className="flex items-center space-x-2 px-3 py-2 bg-action-primary text-white rounded-lg hover:bg-action-hover text-sm"
                        onClick={() => alert('Create meal plan feature coming soon!')}
                    >
                        <Plus className="w-4 h-4" />
                        <span>New Plan</span>
                    </button>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-64">
                        <Loader className="w-8 h-8 text-action-primary animate-spin mb-2" />
                        <p className="text-text-secondary">Loading meal plans...</p>
                    </div>
                ) : !currentPlan ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center">
                        <UtensilsCrossed className="w-12 h-12 text-border-subtle mb-3" />
                        <p className="text-text-primary font-medium">No meal plan yet</p>
                        <p className="text-sm text-text-secondary mt-1">Create your first weekly meal plan to get started.</p>
                        <button
                            className="mt-4 px-4 py-2 bg-action-primary text-white rounded-lg hover:bg-action-hover"
                            onClick={() => alert('Create meal plan feature coming soon!')}
                        >
                            Create Meal Plan
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                        {/* Week Header */}
                        <div className="bg-bg-surface border border-border-subtle rounded-lg p-3">
                            <h3 className="font-semibold text-text-primary">
                                Week of {new Date(currentPlan.startDate).toLocaleDateString()}
                            </h3>
                            <p className="text-sm text-text-secondary">
                                {currentPlan.meals?.length || 0} meals planned
                            </p>
                        </div>

                        {/* Days Grid */}
                        <div className="space-y-3">
                            {DAYS_OF_WEEK.map((day, index) => {
                                // Filter meals for this day
                                const dayMeals = currentPlan.meals?.filter((meal: any) =>
                                    meal.dayOfWeek === day
                                ) || [];

                                return (
                                    <div key={day} className="bg-bg-surface border border-border-subtle rounded-lg p-4">
                                        <div className="flex justify-between items-center mb-3">
                                            <h4 className="font-semibold text-text-primary">{day}</h4>
                                            <button
                                                className="text-xs text-action-primary hover:underline"
                                                onClick={() => alert('Add meal feature coming soon!')}
                                            >
                                                + Add Meal
                                            </button>
                                        </div>

                                        {dayMeals.length === 0 ? (
                                            <p className="text-sm text-text-tertiary italic">No meals planned</p>
                                        ) : (
                                            <div className="space-y-2">
                                                {dayMeals.map((meal: any, mealIndex: number) => (
                                                    <div
                                                        key={mealIndex}
                                                        className="flex items-center justify-between p-2 bg-bg-canvas rounded border border-border-subtle"
                                                    >
                                                        <div className="flex items-center space-x-3">
                                                            <span className="text-xs font-medium text-text-secondary uppercase">
                                                                {meal.mealType}
                                                            </span>
                                                            <span className="text-sm text-text-primary">
                                                                {meal.customTitle || meal.itemId?.title || meal.itemId?.name || 'Untitled'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Info Footer */}
                <div className="mt-4 p-3 bg-bg-canvas rounded-lg border border-border-subtle">
                    <p className="text-xs text-text-secondary">
                        💡 <strong>Tip:</strong> Full meal planning features including recipe management,
                        restaurant favorites, and meal ratings are coming soon!
                    </p>
                </div>
            </div>
        </Modal>
    );
};

export default MealPlannerModal;
