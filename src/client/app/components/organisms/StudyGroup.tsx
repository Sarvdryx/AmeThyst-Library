import React from 'react';
import StudyGroupCard from '../molecules/StudyGroupCard';

const GROUPS = [
  { id: 1, name: "Architecture", members: "12 members" },
  { id: 2, name: "Quantum Physics", members: "8 members" },
  { id: 3, name: "Algorithms & Data Structures", members: "45 members" },
  { id: 4, name: "Artificial Intelligence", members: "32 members" },
  { id: 5, name: "Data Science", members: "20 members" },
  { id: 6, name: "Find More", members: "Browse all groups", isFindMore: true }
];

export default function StudyGroup() {
  return (
    <div className="w-full max-w-7xl mx-auto my-12 px-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-navy font-manrope text-2xl font-bold tracking-[0.01em]">
          Study Group
        </h2>
      </div>

      {/* Group Grid - 3 columns, 2 rows */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {GROUPS.map((group) => {
          const Card = StudyGroupCard as any;
          return (
            <Card 
              key={group.id}
              name={group.name}
              members={group.members}
              isFindMore={group.isFindMore}
            />
          );
        })}
      </div>
    </div>
  );
}
