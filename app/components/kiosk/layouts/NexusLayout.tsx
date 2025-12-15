import React from 'react';
import { IHouseholdMemberProfile, ITask } from '../../../types';
import TimelineCard from '../TimelineCard';
import RosterGrid from '../RosterGrid';
import EnvironmentColumn from '../EnvironmentColumn';

interface NexusLayoutProps {
    members: IHouseholdMemberProfile[];
    tasks: ITask[];
    mealPlans: any[];
    recipes: any[];
    quests: any[];
    onMemberClick: (member: IHouseholdMemberProfile) => void;
    onFocusClick: (e: React.MouseEvent, member: IHouseholdMemberProfile) => void;
}

const NexusLayout: React.FC<NexusLayoutProps> = ({
    members,
    tasks,
    mealPlans,
    recipes,
    quests,
    onMemberClick,
    onFocusClick
}) => {
    return (
        <div className="grid grid-cols-12 gap-6 h-full">
            {/* Zone 1: Timeline (40% => ~5 cols) */}
            <div className="col-span-12 lg:col-span-5 h-full min-h-[400px]">
                <TimelineCard />
            </div>

            {/* Zone 2: Squad Status (35% => ~4 cols) */}
            <div className="col-span-12 lg:col-span-4 h-full min-h-[400px]">
                <RosterGrid
                    members={members}
                    tasks={tasks}
                    onMemberClick={onMemberClick}
                    onFocusClick={onFocusClick}
                />
            </div>

            {/* Zone 3: Environment (25% => ~3 cols) */}
            <div className="col-span-12 lg:col-span-3 h-full min-h-[400px]">
                <EnvironmentColumn
                    mealPlans={mealPlans}
                    recipes={recipes}
                    quests={quests}
                />
            </div>
        </div>
    );
};

export default NexusLayout;
