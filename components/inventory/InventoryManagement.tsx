import React, { useState, useEffect } from 'react';
import './InventoryManagement.css';
import axios from 'axios';

// API URL 설정 (기존 프로젝트와 일치시킴)
// const API_URL = 'https://port-0-online-order-flask-m47pn82w3295ead8.sel4.cloudtype.app/api';
const API_URL = 'http://localhost:5000/api';

// 재고 아이템 타입 정의
interface InventoryItem {
  id: number;
  item_name: string;
  color: string | null;
  stock: number;
  safety_stock: number;
  unit: string;
  location: string | null;
  updated_at: string;
}

const InventoryManagement: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [filteredInventory, setFilteredInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [locationFilter, setLocationFilter] = useState<string>('all');

  // 재고 데이터 가져오기
  useEffect(() => {
    const fetchInventory = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('인증 토큰이 없습니다.');
        }

        const response = await axios.get(`${API_URL}/inventory`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        setInventory(response.data);
        setFilteredInventory(response.data);
        setLoading(false);
      } catch (err) {
        console.error('재고 목록 로드 오류:', err);
        setError('재고 목록을 불러오는 중 오류가 발생했습니다.');
        setLoading(false);
      }
    };

    fetchInventory();
  }, []);

  // 검색어 변경 핸들러
  useEffect(() => {
    filterInventory();
  }, [searchTerm, locationFilter, inventory]);

  const filterInventory = () => {
    let filtered = [...inventory];

    // 검색어로 필터링
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(item => 
        item.item_name.toLowerCase().includes(searchLower) || 
        (item.color && item.color.toLowerCase().includes(searchLower))
      );
    }

    // 위치로 필터링
    if (locationFilter !== 'all') {
      filtered = filtered.filter(item => 
        item.location === locationFilter
      );
    }

    setFilteredInventory(filtered);
  };

  // 검색어 입력 핸들러
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // 위치 필터 변경 핸들러
  const handleLocationFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLocationFilter(e.target.value);
  };

  // 위치 옵션 생성
  const getLocationOptions = () => {
    const locations = new Set<string>();
    inventory.forEach(item => {
      if (item.location) {
        locations.add(item.location);
      }
    });
    
    return Array.from(locations).sort();
  };

  // 입출고 이력 보기
  const handleViewHistory = (id: number) => {
    // 향후 구현될 기능
    alert(`품목 ID: ${id}의 입출고 이력 기능은 아직 개발 중입니다.`);
  };

  // 상세 이력 보기
  const handleViewDetailLog = (id: number) => {
    // 향후 구현될 기능
    alert(`품목 ID: ${id}의 상세 이력 기능은 아직 개발 중입니다.`);
  };

  // 재고 상태에 따른 클래스 반환
  const getStockStatusClass = (item: InventoryItem): string => {
    if (item.stock <= 0) {
      return 'stock-empty';
    } else if (item.stock < item.safety_stock) {
      return 'stock-low';
    } else {
      return 'stock-normal';
    }
  };

  // 날짜 포맷 함수
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="inventory-management-container">
      <h2>재고 관리</h2>

      <div className="inventory-controls">
        <div className="search-filters">
          <div className="search-group">
            <input
              type="text"
              placeholder="품목명 또는 칼라로 검색..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="search-input"
            />
          </div>
          
          <div className="filter-group">
            <label htmlFor="locationFilter">위치:</label>
            <select
              id="locationFilter"
              value={locationFilter}
              onChange={handleLocationFilterChange}
            >
              <option value="all">전체 위치</option>
              {getLocationOptions().map(location => (
                <option key={location} value={location}>{location}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="error-message">{error}</div>
      )}

      {loading ? (
        <div className="loading-message">데이터를 불러오는 중...</div>
      ) : filteredInventory.length === 0 ? (
        <div className="no-data-message">표시할 재고 데이터가 없습니다.</div>
      ) : (
        <div className="inventory-table-container">
          <table className="inventory-table">
            <thead>
              <tr>
                <th>품목명</th>
                <th>색상</th>
                <th>재고수량</th>
                <th>안전재고</th>
                <th>위치</th>
                <th>재고 수정</th>
                <th>이력</th>
                <th>최종 수정일</th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.map((item) => (
                <tr key={item.id} className={getStockStatusClass(item)}>
                  <td className="center-align">{item.item_name}</td>
                  <td className="center-align">{item.color || '-'}</td>
                  <td className="center-align">{item.stock.toLocaleString()} {item.unit}</td>
                  <td className="center-align">{item.safety_stock.toLocaleString()} {item.unit}</td>
                  <td className="center-align">{item.location || '창고1'}</td>
                  <td className="center-align">
                    <button
                      className="history-button"
                      onClick={() => handleViewHistory(item.id)}
                      title="입출고 이력 보기"
                    >
                      입출고
                    </button>
                  </td>
                  <td className="center-align">
                    <button
                      className="search-button"
                      onClick={() => handleViewDetailLog(item.id)}
                      title="상세 이력 보기"
                    >
                      🔍
                    </button>
                  </td>
                  <td className="center-align">{formatDate(item.updated_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="inventory-summary">
        <p>총 {filteredInventory.length}개의 재고 품목이 있습니다.</p>
      </div>
    </div>
  );
};

export default InventoryManagement;