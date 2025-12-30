
import React, { useState } from 'react';

interface ChoiceSelectorProps {
  options: string[];
  onSelect: (option: string) => void;
  onOther: () => void;
}

const ChoiceSelector: React.FC<ChoiceSelectorProps> = ({ options, onSelect, onOther }) => {
  const [selected, setSelected] = useState<string[]>([]);

  const toggleOption = (option: string) => {
    setSelected(prev => 
      prev.includes(option) 
        ? prev.filter(item => item !== option) 
        : [...prev, option]
    );
  };

  const handleConfirm = () => {
    if (selected.length > 0) {
      onSelect(selected.join(', '));
    }
  };

  return (
    <div className="mt-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex flex-wrap gap-2 mb-3">
        {options.map((option) => {
          const isSelected = selected.includes(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() => toggleOption(option)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm border ${
                isSelected 
                  ? 'bg-indigo-600 border-indigo-600 text-white' 
                  : 'bg-white border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-300'
              }`}
            >
              {isSelected && <i className="fa-solid fa-check mr-2 text-xs"></i>}
              {option}
            </button>
          );
        })}
        <button
          type="button"
          onClick={onOther}
          className="px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-100 transition-all shadow-sm flex items-center gap-2"
        >
          <i className="fa-solid fa-pen-to-square"></i>
          <span>Свій варіант</span>
        </button>
      </div>
      
      {selected.length > 0 && (
        <button
          type="button"
          onClick={handleConfirm}
          className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all animate-in zoom-in duration-200 flex items-center gap-2"
        >
          <span>Продовжити</span>
          <i className="fa-solid fa-arrow-right"></i>
        </button>
      )}
    </div>
  );
};

export default ChoiceSelector;
