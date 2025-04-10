import React, { useState } from 'react';
import './InventoryForm.css';
import { inventoryApi, InventoryItem } from '../../services/api';
import { useNavigate } from 'react-router-dom';

const InventoryForm: React.FC = () => {
  const navigate = useNavigate();
  const initialInventoryData: Partial<InventoryItem> = {
    item_name: '',
    color: '',
    stock: 0,
    safety_stock: 0,
    unit: '개',
    location: '',
  };

  const [inventoryData, setInventoryData] = useState<Partial<InventoryItem>>(initialInventoryData);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 입력 필드 변경 처리
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // 숫자 필드인 경우 숫자로 변환
    if (name === 'stock' || name === 'safety_stock') {
      setInventoryData({
        ...inventoryData,
        [name]: value === '' ? 0 : parseInt(value, 10)
      });
    } else {
      setInventoryData({
        ...inventoryData,
        [name]: value
      });
    }
  };

  // 폼 제출 처리
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // 필수 필드 검증
      if (!inventoryData.item_name || inventoryData.item_name.trim() === '') {
        throw new Error('품목명을 입력해주세요.');
      }

      console.log('재고 데이터 제출:', inventoryData);

      // API 호출
      const response = await inventoryApi.addInventory(inventoryData as InventoryItem);

      console.log('재고 생성 성공:', response);

      setSubmitted(true);
      setIsSubmitting(false);

      // 폼 초기화
      setInventoryData(initialInventoryData);

      // 3초 후 알림 메시지만 숨기기
      setTimeout(() => {
        setSubmitted(false);
      }, 3000);
    } catch (err) {
      console.error('재고 정보 저장 중 오류 발생:', err);
      setError(err instanceof Error ? err.message : '재고 정보 저장 중 오류가 발생했습니다.');
      setIsSubmitting(false);
    }
  };

  // 폼 초기화
  const handleReset = () => {
    // 확인 창 표시
    if (window.confirm('모든 입력 내용을 초기화하시겠습니까?')) {
      setInventoryData(initialInventoryData);
      setError(null);
    }
  };

  // 취소 버튼 처리
  const handleCancel = () => {
    if (window.confirm('입력을 취소하고 이전 페이지로 돌아가시겠습니까?')) {
      navigate(-1);
    }
  };

  return (
    <div className="inventory-form-container">
      <h2>재고 정보 입력</h2>

      {submitted && (
        <div className="success-message">
          재고 정보가 성공적으로 저장되었습니다!
        </div>
      )}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="inventory-form">
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
          <button
            type="button"
            className="cancel-button"
            onClick={handleReset}
            disabled={isSubmitting}
          >
            전체 초기화
          </button>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="item_name">품목명</label>
            <input
              type="text"
              id="item_name"
              name="item_name"
              value={inventoryData.item_name || ''}
              onChange={handleChange}
              required
              autoComplete="off"
            />
          </div>

          <div className="form-group">
            <label htmlFor="color">색상</label>
            <input
              type="text"
              id="color"
              name="color"
              value={inventoryData.color || ''}
              onChange={handleChange}
              autoComplete="off"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="stock">재고 수량</label>
            <input
              type="number"
              id="stock"
              name="stock"
              value={inventoryData.stock === 0 ? '' : inventoryData.stock}
              onChange={handleChange}
              required
              autoComplete="off"
            />
          </div>

          <div className="form-group">
            <label htmlFor="safety_stock">안전 재고</label>
            <input
              type="number"
              id="safety_stock"
              name="safety_stock"
              value={inventoryData.safety_stock === 0 ? '' : inventoryData.safety_stock}
              onChange={handleChange}
              autoComplete="off"
            />
          </div>
        </div>

        <div className="form-row">
          {/* <div className="form-group">
            <label htmlFor="unit">단위</label>
            <input
              type="text"
              id="unit"
              name="unit"
              value={inventoryData.unit || '개'}
              onChange={handleChange}
              autoComplete="off"
            />
          </div> */}

          <div className="form-group">
            <label htmlFor="location">위치</label>
            <input
              type="text"
              id="location"
              name="location"
              value={inventoryData.location || ''}
              onChange={handleChange}
              autoComplete="off"
            />
          </div>
          <div className="form-group">
            {/* 균형 맞추기 위해 빈 공간 추가 */}
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="back-button"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            취소
          </button>
          
          <button
            type="submit"
            className="save-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? '저장 중...' : '저장'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default InventoryForm; 