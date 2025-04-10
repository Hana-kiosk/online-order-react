// src/components/common/Autocomplete.tsx
import React, { useState, useEffect, useRef } from 'react';
import './Autocomplete.css';

interface AutocompleteProps {
  items: any[]; // 드롭다운에 표시할 항목 배열
  value: string; // 입력 필드 값
  onChange: (value: string) => void; // 입력 값 변경 시 호출
  onSelect: (item: any) => void; // 항목 선택 시 호출
  placeholder: string;
  displayKey: string; // 표시할 항목의 속성 이름
  filterKey?: string; // 필터링할 항목의 속성 이름 (지정하지 않으면 displayKey 사용)
}

const Autocomplete: React.FC<AutocompleteProps> = ({
  items,
  value,
  onChange,
  onSelect,
  placeholder,
  displayKey,
  filterKey
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [filteredItems, setFilteredItems] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // 필터링 키 설정
  const searchKey = filterKey || displayKey;

  // 입력 값 변경 시 항목 필터링
  useEffect(() => {
    if (!inputValue.trim()) {
      setFilteredItems([]);
      return;
    }
    
    const filtered = items.filter(item => 
      item[searchKey]?.toLowerCase().includes(inputValue.toLowerCase())
    );
    
    setFilteredItems(filtered.slice(0, 10)); // 최대 10개 결과만 표시
    setIsOpen(filtered.length > 0);
  }, [inputValue, items, searchKey]);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 입력 값 변경 핸들러
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);
    
    if (newValue.trim()) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  // 항목 선택 핸들러
  const handleItemSelect = (item: any) => {
    setInputValue(item[displayKey]);
    onChange(item[displayKey]);
    onSelect(item);
    setIsOpen(false);
  };

  return (
    <div className="autocomplete-container">
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        placeholder={placeholder}
        className="autocomplete-input"
        onFocus={() => inputValue.trim() && setIsOpen(true)}
      />
      
      {isOpen && filteredItems.length > 0 && (
        <div ref={dropdownRef} className="autocomplete-dropdown">
          <ul className="autocomplete-list">
            {filteredItems.map((item, index) => (
              <li 
                key={index} 
                className="autocomplete-item"
                onClick={() => handleItemSelect(item)}
              >
                {item[displayKey]}
                {item.color && <span className="item-color"> ({item.color})</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Autocomplete;