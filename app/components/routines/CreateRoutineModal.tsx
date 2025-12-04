// =========================================================
// silkpanda/momentum/app/components/routines/CreateRoutineModal.tsx
// Modal for creating a new routine
// =========================================================
'use client';

import React, { useState, useEffect } from 'react';
import { X, Calendar, Award, Check, Loader, AlertTriangle, Plus, Trash2 } from 'lucide-react';
import { useSession } from '../layout/SessionContext';
import { IRoutine } from './RoutineList';
import { IHouseholdMemberProfile } from '../../types';

interface CreateRoutineModalProps {
    onClose: () => void;
    onRoutineCreated: (routine: IRoutine) => void;
    members: IHouseholdMemberProfile[];
}

const CreateRoutineModal: React.FC<CreateRoutineModalProps> = ({ onClose, onRoutineCreated, members }) => {
    const { token } = useSession();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        assignedTo: members.length > 0 ? members[0]._id : '',
        pointsReward: 10,
        frequency: 'daily',
        steps: [''] // Start with one empty step
    });

    // Update assignedTo if members change or initially
    useEffect(() => {
        if (members.length > 0 && !formData.assignedTo) {
            setFormData(prev => ({ ...prev, assignedTo: members[0]._id }));
        }
    }, [members]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'pointsReward' ? parseInt(value) || 0 : value
        }));
    };

    const handleStepChange = (index: number, value: string) => {
        const newSteps = [...formData.steps];
        newSteps[index] = value;
        setFormData(prev => ({ ...prev, steps: newSteps }));
    };

    const addStep = () => {
        setFormData(prev => ({ ...prev, steps: [...prev.steps, ''] }));
    };

    const removeStep = (index: number) => {
        if (formData.steps.length > 1) {
            const newSteps = formData.steps.filter((_, i) => i !== index);
            setFormData(prev => ({ ...prev, steps: newSteps }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!formData.title || !formData.assignedTo || formData.steps.some(s => !s.trim())) {
            setError('Please fill in all required fields and ensure steps are not empty.');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Format payload for API
            const payload = {
                ...formData,
                schedule: { frequency: formData.frequency },
                steps: formData.steps.map(title => ({ title, isCompleted: false }))
            };

            const response = await fetch('/web-bff/routines', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to create routine');
            }

            onRoutineCreated(data.data.routine);
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div className="relative w-full max-w-lg p-6 bg-bg-surface rounded-xl shadow-xl border border-border-subtle max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-full text-text-secondary hover:bg-border-subtle">
                    <X className="w-5 h-5" />
                </button>

                <h2 className="text-xl font-bold text-text-primary mb-6 flex items-center">
                    <Calendar className="w-6 h-6 mr-2 text-action-primary" />
                    Create New Routine
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Routine Title</label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="e.g., Morning Routine"
                            className="w-full p-3 rounded-lg border border-border-subtle bg-bg-canvas text-text-primary focus:ring-2 focus:ring-action-primary/20 focus:border-action-primary outline-none transition-all"
                            autoFocus
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Description</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={2}
                            placeholder="Brief description..."
                            className="w-full p-3 rounded-lg border border-border-subtle bg-bg-canvas text-text-primary focus:ring-2 focus:ring-action-primary/20 focus:border-action-primary outline-none transition-all resize-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Assigned To */}
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Assign To</label>
                            <select
                                name="assignedTo"
                                value={formData.assignedTo}
                                onChange={handleChange}
                                className="w-full p-3 rounded-lg border border-border-subtle bg-bg-canvas text-text-primary focus:ring-2 focus:ring-action-primary/20 focus:border-action-primary outline-none"
                            >
                                {members.map(m => (
                                    <option key={m._id} value={m._id}>{m.displayName}</option>
                                ))}
                            </select>
                        </div>

                        {/* Frequency */}
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Frequency</label>
                            <select
                                name="frequency"
                                value={formData.frequency}
                                onChange={handleChange}
                                className="w-full p-3 rounded-lg border border-border-subtle bg-bg-canvas text-text-primary focus:ring-2 focus:ring-action-primary/20 focus:border-action-primary outline-none"
                            >
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                            </select>
                        </div>
                    </div>

                    {/* Points */}
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Points Reward</label>
                        <div className="relative">
                            <Award className="absolute left-3 top-3 w-5 h-5 text-action-primary" />
                            <input
                                type="number"
                                name="pointsReward"
                                value={formData.pointsReward}
                                onChange={handleChange}
                                min="1"
                                className="w-full pl-10 p-3 rounded-lg border border-border-subtle bg-bg-canvas text-text-primary focus:ring-2 focus:ring-action-primary/20 focus:border-action-primary outline-none"
                            />
                        </div>
                    </div>

                    {/* Steps */}
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">Routine Steps</label>
                        <div className="space-y-2">
                            {formData.steps.map((step, index) => (
                                <div key={index} className="flex items-center space-x-2">
                                    <div className="flex-1">
                                        <input
                                            type="text"
                                            value={step}
                                            onChange={(e) => handleStepChange(index, e.target.value)}
                                            placeholder={`Step ${index + 1}`}
                                            className="w-full p-2 rounded-lg border border-border-subtle bg-bg-canvas text-text-primary focus:ring-2 focus:ring-action-primary/20 focus:border-action-primary outline-none"
                                        />
                                    </div>
                                    {formData.steps.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeStep(index)}
                                            className="p-2 text-text-tertiary hover:text-signal-alert transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={addStep}
                            className="mt-2 text-sm text-action-primary hover:text-action-primary/80 font-medium flex items-center"
                        >
                            <Plus className="w-4 h-4 mr-1" /> Add Step
                        </button>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="flex items-center text-sm text-signal-alert bg-signal-alert/10 p-3 rounded-lg">
                            <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`w-full flex justify-center items-center py-3 px-4 rounded-lg text-white font-medium transition-all
                            ${isLoading ? 'bg-action-primary/70 cursor-not-allowed' : 'bg-action-primary hover:bg-action-primary/90 shadow-md hover:shadow-lg'}`}
                    >
                        {isLoading ? <Loader className="w-5 h-5 animate-spin" /> : <><Check className="w-5 h-5 mr-2" /> Create Routine</>}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CreateRoutineModal;
