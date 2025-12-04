import { useState, useEffect, useCallback } from 'react';
import { useSession } from '../../app/components/layout/SessionContext';
import { IHouseholdMemberProfile, ITask, IStoreItem, IRecipe, IMealPlan, IQuest } from '../../app/types';
import { useSocketEvent } from './useSocket';
import { SOCKET_EVENTS, TaskUpdatedEvent, MemberPointsUpdatedEvent, StoreItemUpdatedEvent, HouseholdUpdatedEvent, QuestUpdatedEvent } from '../socket';

// Define the return type
interface FamilyData {
    members: IHouseholdMemberProfile[];
    tasks: ITask[];
    quests: IQuest[];
    storeItems: IStoreItem[];
    mealPlans: IMealPlan[];
    recipes: IRecipe[];
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
}

export const useFamilyData = (): FamilyData => {
    const { token, householdId } = useSession();
    const [members, setMembers] = useState<IHouseholdMemberProfile[]>([]);
    const [tasks, setTasks] = useState<ITask[]>([]);
    const [quests, setQuests] = useState<IQuest[]>([]);
    const [storeItems, setStoreItems] = useState<IStoreItem[]>([]);
    const [mealPlans, setMealPlans] = useState<IMealPlan[]>([]);
    const [recipes, setRecipes] = useState<IRecipe[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        if (!token || !householdId) {
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/web-bff/family/page-data', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch family data');
            }

            const data = await response.json();

            if (data.memberProfiles && data.tasks && data.storeItems) {
                setMembers(data.memberProfiles);
                setTasks(data.tasks);
                setQuests(data.quests || []);
                setStoreItems(data.storeItems);
                setMealPlans(data.mealPlans || []);
                setRecipes(data.recipes || []);
            } else {
                throw new Error('Invalid data structure');
            }

        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, [token, householdId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // WebSocket Listeners
    useSocketEvent<TaskUpdatedEvent>(SOCKET_EVENTS.TASK_UPDATED, (data) => {
        if (data.type === 'create' && data.task) {
            setTasks(prev => [data.task!, ...prev]);
        } else if (data.type === 'update' && data.task) {
            setTasks(prev => prev.map(t => t._id === data.task!._id ? data.task! : t));
            if (data.memberUpdate) {
                setMembers(prev => prev.map(m =>
                    m._id === data.memberUpdate!.memberId
                        ? { ...m, pointsTotal: data.memberUpdate!.pointsTotal }
                        : m
                ));
            }
        } else if (data.type === 'delete' && data.taskId) {
            setTasks(prev => prev.filter(t => t._id !== data.taskId));
        }
    });

    useSocketEvent<MemberPointsUpdatedEvent>(SOCKET_EVENTS.MEMBER_POINTS_UPDATED, (data) => {
        setMembers(prev => prev.map(m =>
            m._id === data.memberId
                ? { ...m, pointsTotal: data.pointsTotal }
                : m
        ));
    });

    useSocketEvent<StoreItemUpdatedEvent>(SOCKET_EVENTS.STORE_ITEM_UPDATED, (data) => {
        if (data.type === 'create' && data.storeItem) {
            setStoreItems(prev => [data.storeItem!, ...prev]);
        } else if (data.type === 'update' && data.storeItem) {
            setStoreItems(prev => prev.map(item => item._id === data.storeItem!._id ? data.storeItem! : item));
        } else if (data.type === 'delete' && data.storeItemId) {
            setStoreItems(prev => prev.filter(item => item._id !== data.storeItemId));
        }
    });

    useSocketEvent<QuestUpdatedEvent>(SOCKET_EVENTS.QUEST_UPDATED, (data) => {
        if (data.type === 'create' && data.quest) {
            setQuests(prev => [data.quest!, ...prev]);
        } else if (data.type === 'update' && data.quest) {
            setQuests(prev => prev.map(q => q._id === data.quest!._id ? data.quest! : q));
        } else if (data.type === 'delete' && data.questId) {
            setQuests(prev => prev.filter(q => q._id !== data.questId));
        }
    });

    useSocketEvent<HouseholdUpdatedEvent>(SOCKET_EVENTS.HOUSEHOLD_UPDATED, (data) => {
        if (data.householdId === householdId) {
            fetchData();
        }
    });

    return {
        members,
        tasks,
        quests,
        storeItems,
        mealPlans,
        recipes,
        loading,
        error,
        refresh: fetchData
    };
};
