import React, { useEffect, useState } from 'react';
import useStore from './store';
import FamilyTreeGraph from './components/FamilyTreeGraph';
import MemberInfoPanel from './components/MemberInfoPanel';
import CalendarSheet from './components/CalendarSheet'; // <-- ADDED IMPORT
import { Calendar } from 'lucide-react';

export default function App() {
  const initSync = useStore(state => state.initSync);
  const loading = useStore(state => state.loading);
  const members = useStore(state => state.members);
  const addMember = useStore(state => state.addMember);
  
  // UI State
  const [selectedMemberId, setSelectedMemberId] = useState(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = initSync();
    return () => unsubscribe();
  }, [initSync]);

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-gray-50 text-gray-600">Loading Family Tree...</div>;
  }

  return (
    <div className="relative h-screen w-full overflow-hidden bg-gray-50">
      
      {/* Top App Bar */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between bg-white/80 px-4 py-3 shadow-sm backdrop-blur-md">
        <h1 className="text-xl font-bold text-gray-800">Family Tree</h1>
        <button 
          onClick={() => setIsCalendarOpen(true)}
          className="rounded-full bg-white p-2 text-gray-600 shadow-sm hover:bg-gray-50"
        >
          <Calendar size={22} />
        </button>
      </div>

      {/* Empty State: Add the very first root member so the screen isn't blank */}
      {members.length === 0 && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center z-0 pointer-events-none">
          <p className="mb-4 text-gray-500">Your family tree is empty.</p>
          <button 
            onClick={() => addMember({ first_name: 'Root Member', gender: 'male' })}
            className="pointer-events-auto rounded-full bg-blue-600 px-6 py-3 font-semibold text-white shadow-lg hover:bg-blue-700"
          >
            Add First Member
          </button>
        </div>
      )}

      {/* Main Visualization Canvas */}
      <FamilyTreeGraph onNodeClick={(node) => setSelectedMemberId(node.id)} />

      {/* Section 3: Bottom Sheet Form */}
      <MemberInfoPanel 
        memberId={selectedMemberId} 
        onClose={() => setSelectedMemberId(null)} 
      />

      {/* Section 1: Calendar View (Replaced Placeholder) */}
      <CalendarSheet 
        isOpen={isCalendarOpen} 
        onClose={() => setIsCalendarOpen(false)} 
      />
      
    </div>
  );
}