// =========================================================
// silkpanda/momentum/app/components/quests/QuestItem.tsx
// Individual Quest Card with Actions
// =========================================================
'use client';

import React, { useState } from 'react';
import { useSession } from '../layout/SessionContext';
import { IQuest } from './QuestList';
import EditQuestModal from './EditQuestModal';
import QuestCard from '../shared/QuestCard';

interface QuestItemProps {
    quest: IQuest;
    onUpdate: (quest: IQuest) => void;
    onDelete: (questId: string) => void;
}

const QuestItem: React.FC<QuestItemProps> = ({ quest, onUpdate, onDelete }) => {
    const { user, token } = useSession();
    const [isLoading, setIsLoading] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const isParent = user?.role === 'Parent';

    // Helper to handle API calls
    const handleAction = async (action: 'claim' | 'complete' | 'approve' | 'delete') => {
        setIsLoading(true);
        try {
            let url = `/web-bff/quests/${quest._id}`;
            let method = 'POST';

            if (action === 'delete') {
                method = 'DELETE';
            } else {
                url += `/${action}`;
            }

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: action !== 'delete' ? JSON.stringify({ memberId: user?._id }) : undefined,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Failed to ${action} quest`);
            }

            if (action === 'delete') {
                onDelete(quest._id);
            } else {
                const data = await response.json();
                onUpdate(data.data.quest);
            }
        } catch (error) {
            console.error(`Error performing ${action}:`, error);
            alert(`Failed to ${action} quest. Please try again.`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <QuestCard
                quest={{
                    ...quest,
                    status: quest.status === 'active' ? 'Available' :
                        quest.status === 'claimed' ? 'Active' :
                            quest.status === 'completed' ? 'PendingApproval' :
                                quest.status === 'approved' ? 'Completed' : 'Available'
                }}
                isParent={isParent}
                isLoading={isLoading}
                onEdit={() => setIsEditModalOpen(true)}
                onDelete={() => handleAction('delete')}
                onApprove={() => handleAction('approve')}
                onClaim={() => handleAction('claim')}
                onComplete={() => handleAction('complete')}
            />

            {/* Edit Modal */}
            {isEditModalOpen && (
                <EditQuestModal
                    quest={quest}
                    onClose={() => setIsEditModalOpen(false)}
                    onQuestUpdated={onUpdate}
                />
            )}
        </>
    );
};

export default QuestItem;
