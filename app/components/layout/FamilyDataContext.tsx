'use client';

import React, { createContext, useState, useEffect, useCallback, ReactNode, useContext } from 'react';
import { useSession } from './SessionContext';
import { IHouseholdMemberProfile, ITask, IStoreItem, IRecipe, IMealPlan, IQuest, IRoutine, IRestaurant } from '../../types';
import { useSocketEvent } from '../../../lib/hooks/useSocket';
import { useSocketContext } from '../../../lib/providers/SocketProvider';
import { SOCKET_EVENTS, TaskUpdatedEvent, MemberPointsUpdatedEvent, StoreItemUpdatedEvent, HouseholdUpdatedEvent, QuestUpdatedEvent, RoutineUpdatedEvent, MealPlanUpdatedEvent } from '../../../lib/socket';

interface FamilyData {
    members: IHouseholdMemberProfile[];
    tasks: ITask[];
    quests: IQuest[];
    storeItems: IStoreItem[];
    mealPlans: IMealPlan[];
    recipes: IRecipe[];
    restaurants: IRestaurant[];
    routines: IRoutine[];
    loading: boolean;
    error: string | null;
    addTask: (task: ITask) => void;
    updateTask: (taskId: string, updates: Partial<ITask>) => void;
    refresh: (silent?: boolean) => Promise<void>;
}

export const FamilyDataContext = createContext<FamilyData | undefined>(undefined);

export const useFamilyDataContext = () => {
    const context = useContext(FamilyDataContext);
    if (!context) {
        throw new Error('useFamilyDataContext must be used within a FamilyDataProvider');
    }
    return context;
};

interface FamilyDataProviderProps {
    children: ReactNode;
}

export const FamilyDataProvider: React.FC<FamilyDataProviderProps> = ({ children }) => {
    const { token, householdId } = useSession();
    const [members, setMembers] = useState<IHouseholdMemberProfile[]>([]);
    const [tasks, setTasks] = useState<ITask[]>([]);
    const [quests, setQuests] = useState<IQuest[]>([]);
    const [storeItems, setStoreItems] = useState<IStoreItem[]>([]);
    const [mealPlans, setMealPlans] = useState<IMealPlan[]>([]);
    const [recipes, setRecipes] = useState<IRecipe[]>([]);
    const [restaurants, setRestaurants] = useState<IRestaurant[]>([]);
    const [routines, setRoutines] = useState<IRoutine[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const addTask = useCallback((task: ITask) => {
        setTasks(prev => [task, ...prev]);
    }, []);

    const updateTask = useCallback((taskId: string, updates: Partial<ITask>) => {
        setTasks(prev => prev.map(t => t._id === taskId ? { ...t, ...updates } : t));
    }, []);

    const fetchData = useCallback(async (showLoading = true) => {
        if (!token || !householdId) {
            setLoading(false);
            return;
        }

        if (showLoading) setLoading(true);
        setError(null);

        try {
            const response = await fetch('/web-bff/family/page-data', {
                headers: { 'Authorization': `Bearer ${token}` },
                cache: 'no-store'
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
                setRestaurants(data.restaurants || []);
                setRoutines(data.routines || []);
            } else {
                throw new Error('Invalid data structure');
            }

        } catch (e: any) {
            setError(e.message);
        } finally {
            if (showLoading) setLoading(false);
        }
    }, [token, householdId]);

    useEffect(() => {
        fetchData(true); // Initial load with spinner
    }, [fetchData]);

    // WebSocket Listeners
    const { socket, isConnected } = useSocketContext(); // We need socket instance to emit join

    useEffect(() => {
        if (socket && isConnected && householdId) {
            console.log(`[FamilyDataContext] Joining household room: ${householdId} (Socket ID: ${socket.id})`);
            socket.emit('join_household', householdId);
        } else {
            console.log('[FamilyDataContext] Waiting to join room...', {
                hasSocket: !!socket,
                connected: isConnected,
                hasHouseholdId: !!householdId
            });
        }
    }, [socket, isConnected, householdId]);

    // Re-join on reconnect
    useEffect(() => {
        if (!socket) return;
        const onConnect = () => {
            if (householdId) {
                console.log('[FamilyDataContext] Re-joining household room after reconnect:', householdId);
                socket.emit('join_household', householdId);
            }
        }
        socket.on('connect', onConnect);
        return () => { socket.off('connect', onConnect); }
    }, [socket, householdId]);

    useSocketEvent<MealPlanUpdatedEvent>(SOCKET_EVENTS.MEAL_PLAN_UPDATED, (data) => {
        console.log('[WebSocket] Meal Plan Updated:', data);
        fetchData(false); // Silent refresh
    });

    useSocketEvent<TaskUpdatedEvent>(SOCKET_EVENTS.TASK_UPDATED, (data) => {
        console.log('[WebSocket] Task Updated:', data);
        fetchData(false); // Silent refresh
    });

    useSocketEvent<MemberPointsUpdatedEvent>(SOCKET_EVENTS.MEMBER_POINTS_UPDATED, (data) => {
        console.log('[WebSocket] Member Points Updated:', data);
        if (data.householdId === householdId) {
            setMembers(prev => prev.map(m =>
                m.familyMemberId._id === data.memberId
                    ? { ...m, pointsTotal: data.pointsTotal }
                    : m
            ));
        }
    });

    useSocketEvent<StoreItemUpdatedEvent>(SOCKET_EVENTS.STORE_ITEM_UPDATED, (data) => {
        console.log('[WebSocket] Store Item Updated:', data);
        fetchData(false); // Silent refresh
    });

    useSocketEvent<QuestUpdatedEvent>(SOCKET_EVENTS.QUEST_UPDATED, (data) => {
        console.log('[WebSocket] Quest Updated:', data);
        fetchData(false); // Silent refresh
    });

    useSocketEvent<RoutineUpdatedEvent>(SOCKET_EVENTS.ROUTINE_UPDATED, (data) => {
        console.log('[WebSocket] Routine Updated:', data);
        fetchData(false); // Silent refresh
    });

    useSocketEvent<HouseholdUpdatedEvent>(SOCKET_EVENTS.HOUSEHOLD_UPDATED, (data) => {
        console.log('[WebSocket] Household Updated:', data);
        if (data.householdId === householdId) {
            fetchData(false); // Silent refresh
        }
    });
    const value = {
        members,
        tasks,
        quests,
        storeItems,
        mealPlans,
        recipes,
        routines,
        restaurants,
        loading,
        error,
        addTask,
        updateTask,
        refresh: () => fetchData(false) // Default exposed refresh is silent
    };

    return (
        <FamilyDataContext.Provider value={value}>
            {children}
        </FamilyDataContext.Provider>
    );
};
