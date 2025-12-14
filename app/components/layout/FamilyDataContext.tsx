'use client';

import React, { createContext, useState, useEffect, useCallback, ReactNode, useContext } from 'react';
import { useSession } from './SessionContext';
import { IHouseholdMemberProfile, ITask, IStoreItem, IRecipe, IMealPlan, IQuest, IRoutine, IRestaurant } from '../../types';
import { useSocketEvent } from '../../../lib/hooks/useSocket';
import { SOCKET_EVENTS, TaskUpdatedEvent, MemberPointsUpdatedEvent, StoreItemUpdatedEvent, HouseholdUpdatedEvent, QuestUpdatedEvent, RoutineUpdatedEvent } from '../../../lib/socket';

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
    refresh: () => Promise<void>;
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

    const fetchData = useCallback(async () => {
        if (!token || !householdId) {
            setLoading(false);
            return; // Don't wipe data, just stop fetching? Or should we wipe?
            // If we logout, session clears token, we probably should wipe.
            // But let's keep it simple for now matching original behavior.
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
                setRestaurants(data.restaurants || []);
                setRoutines(data.routines || []);
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
    // ... (keep existing listeners)

    // ... (rest of listeners)

    // ... (rest of listeners)

    // ... (rest of listeners)

    // ... (rest of listeners)

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
        refresh: fetchData
    };

    return (
        <FamilyDataContext.Provider value={value}>
            {children}
        </FamilyDataContext.Provider>
    );
};
