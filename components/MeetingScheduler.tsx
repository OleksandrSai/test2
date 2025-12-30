
import React from 'react';

interface MeetingSchedulerProps {
  onSelect: (time: string) => void;
  onSkip: () => void;
}

const MeetingScheduler: React.FC<MeetingSchedulerProps> = ({ onSelect, onSkip }) => {
  const slots = [
    "Завтра о 10:00",
    "Завтра о 14:00",
    "Післязавтра об 11:30",
    "Наступний понеділок о 16:00"
  ];

  return (
    <div className="mt-4 p-4 bg-indigo-50 rounded-2xl border border-indigo-100 animate-in fade-in slide-in-from-bottom-2">
      <h4 className="text-sm font-bold text-indigo-900 mb-3 flex items-center gap-2">
        <i className="fa-solid fa-calendar-check"></i>
        Оберіть час для знайомства:
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {slots.map((slot) => (
          <button
            key={slot}
            onClick={() => onSelect(slot)}
            className="p-3 bg-white border border-indigo-200 text-indigo-700 rounded-xl text-xs font-semibold hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
          >
            {slot}
          </button>
        ))}
      </div>
      <button
        onClick={onSkip}
        className="mt-4 w-full p-2 text-[11px] text-gray-500 hover:text-indigo-600 font-bold uppercase tracking-wider"
      >
        Обрати час пізніше
      </button>
    </div>
  );
};

export default MeetingScheduler;
