import React, { useState, useMemo } from 'react';
import useStore from '../store';
import BottomSheet from './BottomSheet';

type EventType = 'birthday' | 'marriage' | 'death';

interface FamilyEvent {
  id: string;
  type: EventType;
  title: string;
  originalDate: string; // YYYY-MM-DD
  currentYearDate: Date;
}

const FILTER_OPTIONS = [
  'Today',
  'This Week',
  'This Month',
  'Next Month',
  'Previous Month'
];

export default function CalendarSheet({ isOpen, onClose }) {
  const members = useStore((state) => state.members);
  const unions = useStore((state) => state.unions);
  
  const [activeFilter, setActiveFilter] = useState('This Month');

  const allEvents = useMemo(() => {
    const events: FamilyEvent[] = [];
    const today = new Date();
    const currentYear = today.getFullYear();

    members.forEach((m) => {
      if (m.isDeleted) return;
      
      if (m.birth_date) {
        const dateObj = new Date(m.birth_date);
        events.push({
          id: `${m.id}-birth`,
          type: 'birthday',
          title: `${m.first_name}'s Birthday`,
          originalDate: m.birth_date,
          currentYearDate: new Date(currentYear, dateObj.getMonth(), dateObj.getDate()),
        });
      }

      if (m.date_of_death) {
        const dateObj = new Date(m.date_of_death);
        events.push({
          id: `${m.id}-death`,
          type: 'death',
          title: `${m.first_name}'s Remembrance`,
          originalDate: m.date_of_death,
          currentYearDate: new Date(currentYear, dateObj.getMonth(), dateObj.getDate()),
        });
      }
    });

    unions.forEach((u) => {
      if (u.date) {
        const pA = members.find(m => m.id === u.partner_a_id);
        const pB = members.find(m => m.id === u.partner_b_id);
        const title = (pA && pB) ? `${pA.first_name} & ${pB.first_name}'s Anniversary` : 'Anniversary';
        
        const dateObj = new Date(u.date);
        events.push({
          id: `${u.id}-anniv`,
          type: 'marriage',
          title,
          originalDate: u.date,
          currentYearDate: new Date(currentYear, dateObj.getMonth(), dateObj.getDate()),
        });
      }
    });

    return events.sort((a, b) => a.currentYearDate.getTime() - b.currentYearDate.getTime());
  }, [members, unions]);

  const filteredEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); 
    
    const currentMonth = today.getMonth();
    
    return allEvents.filter((event) => {
      const evMonth = event.currentYearDate.getMonth();
      const evDate = event.currentYearDate.getDate();

      switch (activeFilter) {
        case 'Today':
          return evMonth === currentMonth && evDate === today.getDate();
        case 'This Week':
          const diffTime = event.currentYearDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return diffDays >= 0 && diffDays <= 7;
        case 'This Month':
          return evMonth === currentMonth;
        case 'Next Month':
          return evMonth === (currentMonth + 1) % 12;
        case 'Previous Month':
          return evMonth === (currentMonth - 1 + 12) % 12;
        default:
          return false;
      }
    });
  }, [allEvents, activeFilter]);

  const getEventIcon = (type: EventType) => {
    switch (type) {
      case 'birthday': return '🎂';
      case 'marriage': return '💍';
      case 'death': return '🕊️';
      default: return '📅';
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Important Dates">
      <div className="-mx-6 mb-4 overflow-x-auto hide-scrollbar px-6 pb-2">
        <div className="flex space-x-2 w-max">
          {FILTER_OPTIONS.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeFilter === filter 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 min-h-[300px]">
        {filteredEvents.length > 0 ? (
          filteredEvents.map((event) => (
            <div key={event.id} className="flex items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="text-2xl mr-4 bg-white p-2 rounded-lg shadow-sm">
                {getEventIcon(event.type)}
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">{event.title}</h3>
                <p className="text-sm text-gray-500">
                  {event.currentYearDate.toLocaleDateString('en-US', { 
                    month: 'long', 
                    day: 'numeric' 
                  })} 
                  <span className="text-gray-400 text-xs ml-2">
                    (Est. {new Date(event.originalDate).getFullYear()})
                  </span>
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 py-10">
            <span className="text-4xl mb-2">🗓️</span>
            <p>No family events found for {activeFilter.toLowerCase()}.</p>
          </div>
        )}
      </div>
    </BottomSheet>
  );
}