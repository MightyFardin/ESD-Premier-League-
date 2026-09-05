import React, { useState, useRef, useEffect } from 'react';

export default function CustomSelect({ name, options, value, onChange, placeholder = "Select...", required }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="relative" ref={dropdownRef}>
      <input type="hidden" name={name} value={value || ''} required={required} />
      
      <div 
        className={`input-field flex items-center justify-between cursor-pointer ${isOpen ? 'ring-2 ring-indigo-500 border-transparent dark:ring-indigo-500' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={value ? 'text-slate-900 dark:text-white font-medium' : 'text-slate-400'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <div className={`transition-transform duration-200 text-xs text-slate-400 ${isOpen ? 'rotate-180' : ''}`}>▼</div>
      </div>
      
      {isOpen && (
        <div className="w-full mt-2 bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-slate-800 rounded-xl shadow-inner overflow-hidden py-1 transition-all">
          {options.map((opt) => (
            <div
              key={opt.value}
              className={`px-4 py-3 text-sm cursor-pointer transition-colors ${value === opt.value ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 font-bold' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
