import React, { useState, useEffect } from 'react';
import './InventoryManagement.css';
import { inventoryApi, InventoryItem } from '../../services/api';
import { useNavigate } from 'react-router-dom';




const InventoryManagement: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [filteredInventory, setFilteredInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [isLogModalOpen, setIsLogModalOpen] = useState<boolean>(false);
  const [currentLogs, setCurrentLogs] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState<boolean>(false);
  const [updateData, setUpdateData] = useState<Partial<InventoryItem>>({});
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null);
  const [memoText, setMemoText] = useState<string>('수정');
  const navigate = useNavigate();


  // 재고 데이터 가져오기
  useEffect(() => {
    const fetchInventory = async () => {
      try {
        setLoading(true);
        const data = await inventoryApi.getInventory();
        setInventory(data);
        setFilteredInventory(data);
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

  // 재고 수정하기
  const handleUpdateInventory = (id: number) => {
    const item = inventory.find(item => item.id === id);
    if (item) {
      setSelectedItem(item);
      setUpdateData({
        stock: item.stock,
        safety_stock: item.safety_stock,
        location: item.location
      });
      setMemoText('수정');
      setIsUpdateModalOpen(true);
    }
  };

  // 업데이트 입력 변경 핸들러
  const handleUpdateInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    let processedValue: string | number = value;
    
    // 숫자 필드인 경우 숫자로 변환
    if (name === 'stock' || name === 'safety_stock') {
      processedValue = value === '' ? 0 : parseInt(value, 10);
    }
    
    setUpdateData({
      ...updateData,
      [name]: processedValue
    });
  };

  // 업데이트 제출 핸들러
  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedItem) return;
    
    // 변경 사항 체크
    const hasChanges = 
      updateData.stock !== selectedItem.stock ||
      updateData.safety_stock !== selectedItem.safety_stock ||
      updateData.location !== selectedItem.location;
    
    // 변경 사항이 없는 경우 오류 표시
    if (!hasChanges) {
      const errorMsg = '변경된 내용이 없습니다. 수정하려면 값을 변경해주세요.';
      setModalError(errorMsg);
      setTimeout(() => setModalError(null), 2000);
      return;
    }
    
    try {
      // API 호출을 통해 재고 업데이트 - 타입 에러를 방지하기 위해 별도로 전달할 데이터 구성
      const payload = {
        ...updateData
      };
      
      // @ts-ignore - memo 속성은 서버에서 처리되나 InventoryItem 타입에는 없습니다
      payload.memo = memoText;
      
      await inventoryApi.updateInventory(selectedItem.id, payload);
      
      // 성공 메시지 표시 및 새로운 데이터 로드
      setUpdateSuccess('재고가 성공적으로 업데이트되었습니다.');
      
      // 업데이트된 인벤토리 목록을 다시 가져옴
      const updatedInventory = await inventoryApi.getInventory();
      setInventory(updatedInventory);
      setFilteredInventory(updatedInventory);
      
      // 3초 후 성공 메시지 숨기기 및 모달 닫기
      setTimeout(() => {
        setUpdateSuccess(null);
        setIsUpdateModalOpen(false);
        setSelectedItem(null);
        setUpdateData({});
        setMemoText('수정');
      }, 1000);
    } catch (err) {
      console.error('재고 업데이트 오류:', err);
      setModalError('재고를 업데이트하는 중 오류가 발생했습니다.');
    }
  };

  // 업데이트 모달 닫기
  const closeUpdateModal = () => {
    setIsUpdateModalOpen(false);
    setSelectedItem(null);
    setUpdateData({});
    setUpdateSuccess(null);
    setMemoText('수정');
    setModalError(null);
  };

  // 상세 이력 보기
  const handleViewDetailLog = async (id: number) => {
    try {
      const logs = await inventoryApi.getInventoryLogs(id);
      console.log('재고 로그:', logs);
      
      // 현재 선택된 아이템 찾기
      const item = inventory.find(item => item.id === id) || null;
      setSelectedItem(item);
      
      // 로그 데이터 저장 및 모달 열기
      setCurrentLogs(logs);
      setIsLogModalOpen(true);
    } catch (err) {
      console.error('재고 로그 조회 오류:', err);
      alert('재고 로그를 조회하는 중 오류가 발생했습니다.');
    }
  };
  
  // 모달 닫기
  const closeLogModal = () => {
    setIsLogModalOpen(false);
    setCurrentLogs([]);
    setSelectedItem(null);
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


  // 재고 삭제 핸들러
  const handleDeleteInventory = async (id: number) => {
    try {
      await inventoryApi.deleteInventory(id);
      const updatedInventory = inventory.filter(item => item.id !== id);
      setInventory(updatedInventory);
      setFilteredInventory(updatedInventory);
    } catch (err) {
      console.error('재고 삭제 오류:', err);
      setError('재고를 삭제하는 중 오류가 발생했습니다.');
    }
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
                <th>삭제</th>
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
                      onClick={() => handleUpdateInventory(item.id)}
                      title="재고 수정하기"
                    >
                      수정
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
                  <td className="center-align">
                    <button
                      className="delete-button"
                      onClick={() => handleDeleteInventory(item.id)}
                      title="재고 삭제"
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="inventory-summary">
        <div className="summary-content">
          <button onClick={() => navigate('/inventory-system/form')} className="add-inventory-button">재고 추가</button>
          <p>총 {filteredInventory.length}개의 재고 품목이 있습니다.</p>
        </div>
      </div>
      
      {/* 재고 로그 모달 */}
      {isLogModalOpen && (
        <div className="modal-overlay log-modal" onClick={closeLogModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedItem?.item_name} 재고 이력</h3>
              <button className="modal-close-button" onClick={closeLogModal}>×</button>
            </div>
            <div className="modal-body">
              {currentLogs.length === 0 ? (
                <p className="no-data-message">이력 데이터가 없습니다.</p>
              ) : (
                <table className="log-table">
                  <thead>
                    <tr>
                      <th>날짜</th>
                      <th>수량</th>
                      <th>유형</th>
                      <th>책임</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentLogs.map((log, index) => (
                      <tr key={index}>
                        <td>{formatDate(log.created_at)}</td>
                        <td className={log.quantity > 0 ? 'positive-change' : 'negative-change'}>
                          {log.quantity > 0 ? '+' : ''}{log.quantity} {selectedItem?.unit}
                        </td>
                        <td>{log.memo}</td>
                        <td>{log.created_by}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 재고 수정 모달 */}
      {isUpdateModalOpen && (
        <div className="modal-overlay update-modal" onClick={closeUpdateModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedItem?.item_name} 재고 수정</h3>
              <button className="modal-close-button" onClick={closeUpdateModal}>×</button>
            </div>
            <div className="modal-body">
              {updateSuccess ? (
                <div className="success-message">{updateSuccess}</div>
              ) : (
                <form onSubmit={handleUpdateSubmit} className="inventory-form">
                  {modalError && <div className="error-message modal-error">{modalError}</div>}
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="stock">재고 수량</label>
                      <input
                        type="number"
                        id="stock"
                        name="stock"
                        value={updateData.stock || 0}
                        onChange={handleUpdateInputChange}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className='form-row'>
                    <div className="form-group">
                      <label htmlFor="safety_stock">안전 재고</label>
                      <input
                        type="number"
                        id="safety_stock"
                        name="safety_stock"
                        value={updateData.safety_stock || 0}
                        onChange={handleUpdateInputChange}
                      />
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="location">위치</label>
                      <input
                        type="text"
                        id="location"
                        name="location"
                        value={updateData.location || ''}
                        onChange={handleUpdateInputChange}
                      />
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group full-width">
                      <label htmlFor="memo">메모</label>
                      <textarea
                        id="memo"
                        name="memo"
                        value={memoText}
                        onChange={(e) => setMemoText(e.target.value)}
                        placeholder="변경 사유 또는 메모"
                        rows={3}
                      ></textarea>
                    </div>
                  </div>
                  
                  <div className="form-actions">
                    <button type="submit" className="submit-button">저장</button>
                    <button type="button" className="cancel-button" onClick={closeUpdateModal}>취소</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryManagement;