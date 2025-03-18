import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './OrderEdit.css';
import { orderApi, OrderData } from './services/api';


const OrderEdit: React.FC = () => {
    const { orderId } = useParams<{ orderId: string }>();
    const navigate = useNavigate();

    // 초기 상태 설정
    const [orderData, setOrderData] = useState<OrderData>({
        id: '',
        orderDate: null,
        itemCode: '',
        colorName: '',
        orderQuantity: 0,
        expectedArrivalStartDate: null,
        expectedArrivalEndDate: null,
        arrivalDate: null,
        arrivalQuantity: null,
        specialNote: '',
        remarks: '',
        status: '대기'
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // 날짜 선택기를 위한 상태
    const [expectedArrivalDateRange, setExpectedArrivalDateRange] = useState<[Date | null, Date | null]>([null, null]);
    const [arrivalDateSelected, setArrivalDateSelected] = useState<Date | null>(null);

    // 컴포넌트 마운트 시 발주 데이터 로드
    useEffect(() => {
        if (!orderId) {
            setError('발주 ID가 유효하지 않습니다.');
            setLoading(false);
            return;
        }
        const fetchOrderData = async () => {
            try {
                setLoading(true);
                setError(null);

                const data = await orderApi.getOrder(orderId);
                setOrderData(data);

                // 날짜 객체 설정
                if (data.expectedArrivalStartDate && data.expectedArrivalEndDate) {
                    setExpectedArrivalDateRange([
                        data.expectedArrivalStartDate,
                        data.expectedArrivalEndDate
                    ]);
                }

                if (data.arrivalDate) {
                    setArrivalDateSelected(data.arrivalDate);
                }

                setLoading(false);
            } catch (err) {
                console.error('발주 정보 로드 오류:', err);
                setError('발주 정보를 불러오는 중 오류가 발생했습니다.');
                setLoading(false);
            }
        };

        fetchOrderData();
    }, [orderId]);

    // 입력 필드 변경 핸들러
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        // 숫자 필드 처리
        if (name === 'orderQuantity' || name === 'arrivalQuantity') {
            const numValue = value === '' ? null : parseInt(value, 10);
            setOrderData(prev => ({ ...prev, [name]: numValue }));
        } else {
            setOrderData(prev => ({ ...prev, [name]: value }));
        }
    };

    // 입고예정일 범위 변경 핸들러
    const handleExpectedArrivalDateChange = (dates: [Date | null, Date | null]) => {
        setExpectedArrivalDateRange(dates);
        const [start, end] = dates;

        setOrderData(prev => ({
            ...prev,
            expectedArrivalStartDate: start,
            expectedArrivalEndDate: end
        }));
    };

    // 입고일 변경 핸들러
    const handleArrivalDateChange = (date: Date | null) => {
        setArrivalDateSelected(date);
        setOrderData(prev => ({
            ...prev,
            arrivalDate: date
        }));
    };

    // 폼 제출 핸들러
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setError(null);

        try {
            if (!orderId) {
                throw new Error('발주 ID가 유효하지 않습니다.');
            }
            // API 호출
            await orderApi.updateOrder(orderId, orderData);
            setSuccessMessage('발주 정보가 성공적으로 저장되었습니다.');
            setIsSaving(false);

            // 3초 후 목록 페이지로 이동
            setTimeout(() => {
                navigate('/list');
            }, 3000);
        } catch (err) {
            console.error('발주 정보 저장 중 오류 발생:', err);
            setError(err instanceof Error ? err.message : '발주 정보를 저장하는 중 오류가 발생했습니다.');
            setIsSaving(false);
        }
    };

    // 발주 삭제 처리
    const handleDelete = async () => {
        if (!orderId) {
            setError('발주 ID가 유효하지 않습니다.');
            return;
        }
        
        if (window.confirm('정말로 이 발주 정보를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
            try {
                setIsSaving(true);
                await orderApi.deleteOrder(orderId);
                alert('발주 정보가 성공적으로 삭제되었습니다.');
                navigate('/list');
            } catch (error) {
                console.error('발주 삭제 오류:', error);
                setError('발주 정보를 삭제하는 중 오류가 발생했습니다.');
                setIsSaving(false);
            }
        }
    };

    // 날짜 포맷 함수
    const formatDate = (date: Date | null): string => {
        if (!date) return '';
        return date.toISOString().split('T')[0];
    };

    if (loading) {
        return <div className="order-edit-loading">데이터를 불러오는 중...</div>;
    }

    if (error) {
        return <div className="order-edit-error">{error}</div>;
    }

    return (
        <div className="order-edit-container">
            <h2>발주 정보 수정</h2>

            {successMessage && (
                <div className="success-message">{successMessage}</div>
            )}

            {error && (
                <div className="error-message">{error}</div>
            )}

            {loading ? (
                <div className="loading-message">데이터를 불러오는 중...</div>
            ) : (
                <form onSubmit={handleSubmit} className="order-edit-form">
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="id">발주번호</label>
                            <input
                                type="text"
                                id="id"
                                name="id"
                                value={orderData.id || ''}
                                readOnly
                                className="read-only"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="orderDate">발주일자</label>
                            <input
                                type="text"
                                id="orderDate"
                                name="orderDate"
                                value={formatDate(orderData.orderDate)}
                                readOnly
                                className="read-only"
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="itemCode">품목코드</label>
                            <input
                                type="text"
                                id="itemCode"
                                name="itemCode"
                                value={orderData.itemCode}
                                readOnly
                                className="read-only"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="colorName">칼라/품명</label>
                            <input
                                type="text"
                                id="colorName"
                                name="colorName"
                                value={orderData.colorName}
                                readOnly
                                className="read-only"
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="orderQuantity">발주수량</label>
                            <input
                                type="number"
                                id="orderQuantity"
                                name="orderQuantity"
                                value={orderData.orderQuantity}
                                readOnly
                                className="read-only"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="expectedArrivalDate">입고예정일 (범위)</label>
                            <DatePicker
                                selectsRange={true}
                                startDate={expectedArrivalDateRange[0]}
                                endDate={expectedArrivalDateRange[1]}
                                onChange={handleExpectedArrivalDateChange}
                                dateFormat="yyyy-MM-dd"
                                placeholderText="YYYY-MM-DD ~ YYYY-MM-DD"
                                className="date-picker"
                                isClearable
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="arrivalDate">입고일</label>
                            <DatePicker
                                selected={arrivalDateSelected}
                                onChange={handleArrivalDateChange}
                                dateFormat="yyyy-MM-dd"
                                placeholderText="YYYY-MM-DD"
                                className="date-picker"
                                isClearable
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="arrivalQuantity">입고수량</label>
                            <input
                                type="number"
                                id="arrivalQuantity"
                                name="arrivalQuantity"
                                value={orderData.arrivalQuantity || ''}
                                onChange={handleInputChange}
                                min="0"
                                max={orderData.orderQuantity}
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group full-width">
                            <label htmlFor="specialNote">특이사항</label>
                            <textarea
                                id="specialNote"
                                name="specialNote"
                                value={orderData.specialNote}
                                onChange={handleInputChange}
                                rows={3}
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group full-width">
                            <label htmlFor="remarks">비고</label>
                            <textarea
                                id="remarks"
                                name="remarks"
                                value={orderData.remarks}
                                onChange={handleInputChange}
                                rows={3}
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="status">상태</label>
                            <select
                                id="status"
                                name="status"
                                value={orderData.status}
                                onChange={handleInputChange}
                            >
                                <option value="대기">대기</option>
                                <option value="입고완료">입고완료</option>
                                <option value="부분입고">부분입고</option>
                                <option value="지연">지연</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-actions">
                        <button
                            type="button"
                            className="cancel-button"
                            onClick={() => navigate('/list')}
                            disabled={isSaving}
                        >
                            취소
                        </button>
                        <button
                            type="button"
                            className="delete-button"
                            onClick={handleDelete}
                            disabled={isSaving}
                        >
                            삭제
                        </button>
                        <button
                            type="submit"
                            className="save-button"
                            disabled={isSaving}
                        >
                            {isSaving ? '저장 중...' : '저장'}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default OrderEdit; 