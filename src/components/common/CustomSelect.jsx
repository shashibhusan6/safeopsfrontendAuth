import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export const CustomSelect = ({
  value,
  onChange,
  options = [],
  placeholder = 'Select an option',
  className = '',
  menuClassName = '',
  disabled = false,
  name = '',
  icon: Icon = null,
  label = null,
  size = 'md', // 'sm' | 'md' | 'lg'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef(null);

  // Normalize options array if passed as simple strings or objects { value, label }
  const normalizedOptions = options.map((opt) => {
    if (typeof opt === 'object' && opt !== null) {
      return { value: opt.value, label: opt.label || opt.value };
    }
    return { value: opt, label: String(opt) };
  });

  const selectedOption = normalizedOptions.find((opt) => String(opt.value) === String(value));

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (disabled) return;

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (isOpen && highlightedIndex >= 0 && highlightedIndex < normalizedOptions.length) {
        handleSelect(normalizedOptions[highlightedIndex].value);
      } else {
        setIsOpen(!isOpen);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setHighlightedIndex(0);
      } else {
        setHighlightedIndex((prev) => (prev < normalizedOptions.length - 1 ? prev + 1 : 0));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setHighlightedIndex(normalizedOptions.length - 1);
      } else {
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : normalizedOptions.length - 1));
      }
    }
  };

  const handleSelect = (val) => {
    if (onChange) {
      // Pass synthetic event format and raw value for maximum compatibility
      const event = {
        target: {
          name,
          value: val,
        },
      };
      onChange(event);
      if (typeof onChange === 'function' && onChange.length === 1 && typeof val !== 'object') {
        // Some handlers accept value directly
      }
    }
    setIsOpen(false);
  };

  // Size styles
  const sizeClasses = {
    sm: 'px-2.5 py-1.5 text-xs rounded-lg min-h-[34px]',
    md: 'px-3.5 py-2 text-xs sm:text-sm rounded-xl min-h-[40px]',
    lg: 'px-4 py-2.5 text-sm rounded-xl min-h-[44px]',
  }[size] || 'px-3.5 py-2 text-xs sm:text-sm rounded-xl min-h-[40px]';

  return (
    <div className={`relative w-full ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
          {label}
        </label>
      )}

      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full flex items-center justify-between gap-2 bg-white border text-slate-900 shadow-2xs transition-all duration-200 select-none ${sizeClasses} ${
          isOpen
            ? 'border-indigo-600 ring-2 ring-indigo-500/20 shadow-xs'
            : 'border-slate-300/90 hover:border-indigo-400 hover:bg-slate-50/50'
        } ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-100' : 'cursor-pointer'}`}
      >
        <div className="flex items-center gap-2 truncate">
          {Icon && <Icon className="w-4 h-4 text-indigo-600 shrink-0" />}
          <span className={`truncate ${selectedOption ? 'font-medium text-slate-900' : 'text-slate-400'}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>

        <ChevronDown
          className={`w-4 h-4 shrink-0 transition-transform duration-200 ease-out ${
            isOpen ? 'rotate-180 text-indigo-600' : 'text-slate-400'
          }`}
        />
      </button>

      {/* Animated Dropdown Menu */}
      <div
        role="listbox"
        className={`absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200/90 rounded-xl shadow-xl shadow-slate-900/10 p-1.5 z-50 transition-all duration-200 ease-out origin-top ${menuClassName} ${
          isOpen
            ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 scale-95 -translate-y-1.5 pointer-events-none'
        }`}
        style={{
          maxHeight: '260px',
          overflowY: 'auto',
        }}
      >
        {normalizedOptions.length === 0 ? (
          <div className="px-3 py-2 text-xs text-slate-400 text-center italic">
            No options available
          </div>
        ) : (
          normalizedOptions.map((opt, idx) => {
            const isSelected = String(opt.value) === String(value);
            const isHighlighted = idx === highlightedIndex;

            return (
              <div
                key={String(opt.value) + idx}
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(opt.value)}
                onMouseEnter={() => setHighlightedIndex(idx)}
                className={`flex items-center justify-between px-3 py-2 text-xs sm:text-sm rounded-lg cursor-pointer transition-colors duration-150 ${
                  isSelected
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : isHighlighted
                    ? 'bg-slate-100/80 text-slate-900 font-medium'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <span className="truncate">{opt.label}</span>
                {isSelected && <Check className="w-4 h-4 text-indigo-600 shrink-0 ml-2" />}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
