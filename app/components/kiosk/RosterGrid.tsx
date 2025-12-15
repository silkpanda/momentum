'use client';

import React from 'react';
import { IHouseholdMemberProfile, ITask } from '../../types';
import { User, Target, Zap } from 'lucide-react';

interface RosterGridProps {
    members: IHouseholdMemberProfile[];
    tasks: ITask[];
    onMemberClick: (member: IHouseholdMemberProfile) => void;
    onFocusClick: (e: React.MouseEvent, member: IHouseholdMemberProfile) => void;
}

const RosterGrid: React.FC<RosterGridProps> = ({ members, tasks, onMemberClick, onFocusClick }) => {

    // Helper to get stats
    const getTaskCount = (memberId: string) => {
        return tasks.filter(task =>
            !task.completedBy && // Not completed
            task.status !== 'Approved' && // Not approved
            task.assignedTo?.some(assignee => assignee._id === memberId)
        ).length;
    };

    const getFocusedTask = (member: IHouseholdMemberProfile) => {
        if (!member.focusedTaskId) return undefined;
        return tasks.find(t => t._id === member.focusedTaskId);
    };

    // Sort: Parents first, then kids
    const sortedMembers = [...members].sort((a, b) => {
        if (a.role === 'Parent' && b.role !== 'Parent') return -1;
        if (a.role !== 'Parent' && b.role === 'Parent') return 1;
        return a.displayName.localeCompare(b.displayName);
    });

    return (
        <div className="h-full flex flex-col bg-bg-surface rounded-3xl border border-border-subtle shadow-xl overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-border-subtle bg-bg-surface">
                <h2 className="text-xl font-bold text-text-secondary uppercase tracking-wider text-center">
                    Squad Status
                </h2>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                <div className="grid grid-cols-1 gap-4">
                    {sortedMembers.map((member) => {
                        const taskCount = getTaskCount(member._id);
                        const focusedTask = getFocusedTask(member);

                        return (
                            <button
                                key={member._id}
                                onClick={() => onMemberClick(member)}
                                className="group relative w-full flex items-center p-4 bg-bg-canvas/50 hover:bg-white rounded-2xl 
                                           border-2 border-transparent hover:border-action-primary 
                                           transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg"
                            >
                                {/* Active Focus Indicator (Background Glow) */}
                                {focusedTask && (
                                    <div className="absolute inset-0 bg-action-primary/5 rounded-2xl border-action-primary/20 pointer-events-none" />
                                )}

                                {/* Avatar */}
                                <div className="relative">
                                    <div
                                        className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-md border-2 border-white ring-2 ring-transparent group-hover:ring-action-primary/20 transition-all"
                                        style={{ backgroundColor: member.profileColor }}
                                    >
                                        {member.role === 'Parent' ? <User className="w-8 h-8" /> : member.displayName[0]}
                                    </div>

                                    {/* Task Badge */}
                                    {taskCount > 0 && (
                                        <div className="absolute -top-1 -right-1 bg-signal-alert text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shadow-sm ring-2 ring-white">
                                            {taskCount}
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="ml-4 flex-1 text-left">
                                    <div className="flex justify-between items-center mb-1">
                                        <h3 className="text-lg font-bold text-text-primary group-hover:text-action-primary transition-colors">
                                            {member.displayName}
                                        </h3>
                                        <span className="px-2 py-0.5 bg-bg-surface border border-border-subtle rounded-full text-xs font-bold text-text-secondary">
                                            {member.pointsTotal} pts
                                        </span>
                                    </div>

                                    {/* Status Line */}
                                    {focusedTask ? (
                                        <div className="flex items-center text-action-primary text-sm font-medium animate-pulse">
                                            <Zap className="w-3.5 h-3.5 mr-1 fill-current" />
                                            <span className="truncate max-w-[120px]">{focusedTask.title}</span>
                                        </div>
                                    ) : (
                                        <div className="text-sm text-text-secondary">
                                            {taskCount === 0 ? 'All caught up!' : `${taskCount} tasks pending`}
                                        </div>
                                    )}
                                </div>

                                {/* Focus Action Button */}
                                <div
                                    role="button"
                                    onClick={(e) => onFocusClick(e, member)}
                                    className={`ml-2 p-2 rounded-full transition-all 
                                        ${focusedTask
                                            ? 'bg-action-primary text-white shadow-md'
                                            : 'bg-transparent text-text-tertiary hover:bg-bg-canvas hover:text-action-primary'
                                        }`}
                                >
                                    <Target className="w-5 h-5" />
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default RosterGrid;
