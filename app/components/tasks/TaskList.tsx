// =========================================================
// silkpanda/momentum/app/components/tasks/TaskList.tsx
// REFACTORED for Unified Task Assignment Model (API v3)
// REFACTORED (v4) to call Embedded Web BFF
//
// TELA CODICIS CLEANUP: Implemented optimistic state updates
// for Create, Update, and Delete to improve UI performance.
//
// TELA CODICIS CLEANUP: Removed flawed "Mark Complete"
// button from this management view.
// =========================================================
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Award, Plus, Loader, AlertTriangle, Trash, Edit, CheckSquare, ChevronDown, UserCheck, UserX } from 'lucide-react';
import CreateTaskModal from './CreateTaskModal';
import { useSession } from '../layout/SessionContext';
import EditTaskModal from './EditTaskModal';
import DeleteTaskModal from './DeleteTaskModal';
import { IHouseholdMemberProfile } from '../members/MemberList';
import Collapsible from '../layout/CollapsibleSection';

// --- Task Interface ---
export interface ITask {
    _id: string;
    title: string; // FIX: API uses 'title', not 'taskName'
    description: string;
    pointsValue: number;
    isCompleted: boolean;
    // FIX: API uses 'assignedTo', not 'assignedToRefs'
    // API populates with displayName and profileColor
    assignedTo: {
        _id: string;
        displayName: string; // FIX: API populates displayName, not firstName
        profileColor?: string;
    }[];
    householdRefId: string;
}

// --- Task Item Component ---
const TaskItem: React.FC<{
    task: ITask;
    onEdit: () => void;
    onDelete: () => void;
}> = ({ task, onEdit, onDelete }) => {

    // Helper to get initials
    const getInitials = (name: string) => name ? name.charAt(0).toUpperCase() : '?';

    return (
        <li className="flex items-center justify-between p-4 bg-bg-surface rounded-lg shadow border border-border-subtle">
            <div className="flex items-center space-x-4">
                {/* Icon uses semantic color role */}
                <div className="flex-shrink-0 bg-action-primary/10 p-2 rounded-lg">
                    <Award className="w-5 h-5 text-action-primary" />
                </div>
                <div>
                    <p className="text-base font-medium text-text-primary">{task.title}</p>
                    <p className="text-sm text-text-secondary">{task.description || 'No description'}</p>

                    {/* Display assigned member avatars */}
                    {task.assignedTo && task.assignedTo.length > 0 && (
                        <div className="flex items-center space-x-1 mt-2">
                            <span className="text-xs text-text-secondary mr-1">Assigned:</span>
                            {task.assignedTo.map(member => (
                                <div
                                    key={member._id}
                                    title={member.displayName}
                                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                                    style={{ backgroundColor: member.profileColor || '#808080' }}
                                >
                                    {getInitials(member.displayName)}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <div className="flex items-center space-x-4">
                {/* Points Value uses signal color */}
                <div className="text-center">
                    <p className="text-lg font-semibold text-signal-success">+{task.pointsValue}</p>
                    <p className="text-xs text-text-secondary">Points</p>
                </div>

                {/* --- Task Actions & Status --- */}
                {task.isCompleted && (
                    <div className="flex items-center text-signal-success">
                        <CheckSquare className="w-4 h-4 mr-1" />
                        <span className="text-sm font-medium">Done</span>
                    </div>
                )}

                <button onClick={onEdit} className="p-2 text-text-secondary hover:text-action-primary transition-colors" title="Edit Task" disabled={task.isCompleted}>
                    <Edit className="w-4 h-4" />
                </button>
                <button onClick={onDelete} className="p-2 text-text-secondary hover:text-signal-alert transition-colors" title="Delete Task">
                    <Trash className="w-4 h-4" />
                </button>
            </div>
        </li>
    );
};

// --- Main Task List Component ---
const TaskList: React.FC = () => {
    const [tasks, setTasks] = useState<ITask[]>([]);
    const [householdMembers, setHouseholdMembers] = useState<IHouseholdMemberProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<ITask | null>(null);

    const { token, householdId } = useSession();

    const fetchData = useCallback(async () => {
        if (!token || !householdId) {
            setError('Session invalid. Please log in again.');
            setLoading(false);
            return;
        }
        setLoading(true);

        try {
            const response = await fetch('/web-bff/tasks/page-data', {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch task page data from BFF.');
            }

            const data = await response.json();

            if (data.tasks && data.householdMembers) {
                setTasks(data.tasks);
                setHouseholdMembers(data.householdMembers);
            } else {
                throw new Error('BFF returned malformed data.');
            }

            setError(null);

        } catch (e: any) {
            setError(`Failed to load tasks or members for assignment: ${e.message}`);
        } finally {
            setLoading(false);
        }
    }, [token, householdId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleTaskCreated = (newTask: ITask) => {
        // Refetch data to ensure assignedTo is properly populated
        // The API returns assignedTo as string IDs, but we need populated objects
        fetchData();
    };

    const handleTaskUpdated = (updatedTask: ITask) => {
        // Refetch to ensure proper population
        fetchData();
    };

    const handleTaskDeleted = () => {
        setTasks(current => current.filter(t => t._id !== selectedTask?._id));
    };

    const openEditModal = (task: ITask) => {
        setSelectedTask(task);
        setIsEditModalOpen(true);
    };

    const openDeleteModal = (task: ITask) => {
        setSelectedTask(task);
        setIsDeleteModalOpen(true);
    };

    if (loading && tasks.length === 0) {
        return (
            <div className="flex justify-center items-center p-8 bg-bg-surface rounded-lg shadow-md border border-border-subtle">
                <Loader className="w-6 h-6 text-action-primary animate-spin" />
                <p className="ml-3 text-text-secondary">Loading tasks...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center p-4 bg-signal-alert/10 text-signal-alert rounded-lg border border-border-subtle">
                <AlertTriangle className="w-5 h-5 mr-3" />
                <p className="text-sm font-medium">{error}</p>
            </div>
        );
    }

    return (
        <div className="w-full">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-text-secondary">
                    {tasks.length} {tasks.length === 1 ? 'Task' : 'Tasks'} Configured
                    {loading && <Loader className="w-4 h-4 ml-2 inline animate-spin" />}
                </h2>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="inline-flex items-center rounded-lg py-2 px-4 text-sm font-medium shadow-sm 
                     bg-action-primary text-white transition-all duration-200 
                     hover:bg-action-hover focus:ring-4 focus:ring-action-primary/50"
                >
                    <Plus className="w-4 h-4 mr-1.5" />
                    Add New Task
                </button>
            </div>

            {(() => {
                const completedTasks = tasks.filter(t => t.isCompleted);
                const incompleteTasks = tasks.filter(t => !t.isCompleted);
                const assignedIncompleteTasks = incompleteTasks.filter(
                    t => !t.isCompleted && t.assignedTo && t.assignedTo.length > 0
                );
                // Unassigned tasks are intentionally hidden from this view as per requirements

                return (
                    tasks.length > 0 ? (
                        <div className="space-y-4">
                            <Collapsible
                                Icon={UserCheck}
                                title="Assigned (Incomplete)"
                                count={assignedIncompleteTasks.length}
                                defaultOpen={true}
                                emptyMessage="No assigned (incomplete) tasks."
                            >
                                {assignedIncompleteTasks.map((task) => (
                                    <TaskItem key={task._id} task={task} onEdit={() => openEditModal(task)} onDelete={() => openDeleteModal(task)} />
                                ))}
                            </Collapsible>

                            <Collapsible
                                Icon={CheckSquare}
                                title="Complete"
                                count={completedTasks.length}
                                emptyMessage="No completed tasks."
                            >
                                {completedTasks.map((task) => (
                                    <TaskItem key={task._id} task={task} onEdit={() => openEditModal(task)} onDelete={() => openDeleteModal(task)} />
                                ))}
                            </Collapsible>
                        </div>
                    ) : (
                        <div className="text-center p-8 bg-bg-surface rounded-lg shadow-md border border-border-subtle">
                            <p className="text-text-secondary">No tasks found. Click "Add New Task" to get started.</p>
                        </div>
                    )
                );
            })()}

            {isCreateModalOpen && (
                <CreateTaskModal
                    onClose={() => setIsCreateModalOpen(false)}
                    onTaskCreated={handleTaskCreated}
                    householdMembers={householdMembers}
                />
            )}

            {isEditModalOpen && selectedTask && (
                <EditTaskModal
                    task={selectedTask}
                    onClose={() => setIsEditModalOpen(false)}
                    onTaskUpdated={handleTaskUpdated}
                    householdMembers={householdMembers}
                />
            )}

            {isDeleteModalOpen && selectedTask && (
                <DeleteTaskModal
                    task={selectedTask}
                    onClose={() => setIsDeleteModalOpen(false)}
                    onTaskDeleted={handleTaskDeleted}
                />
            )}
        </div>
    );
};

export default TaskList;