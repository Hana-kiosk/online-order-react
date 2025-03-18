import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
// import { useNavigate } from 'react-router-dom';
import 'react-datepicker/dist/react-datepicker.css';
import './OrderForm.css';
import { orderApi, OrderData } from './services/api';

const OrderForm: React.FC = () => {
    // const navigate = useNavigate();
    // 초기 상태 설정
    const initialOrderData: OrderData = {
        orderDate: null,
        itemCode: '',
        colorName: '',
        orderQuantity: 0,
        expectedArrivalStartDate: null,
        expectedArrivalEndDate: null,
        arrivalDate: null,
        arrivalQuantity: 0,
        specialNote: '',
        remarks: ''
    };

    const [orderData, setOrderData] = useState<OrderData>(initialOrderData);
    const [submitted, setSubmitted] = useState<boolean>(false);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // 입력 필드 변경 처리
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        // 숫자 필드인 경우 숫자로 변환
        if (name === 'orderQuantity' || name === 'arrivalQuantity') {
            setOrderData({
                ...orderData,
                [name]: value === '' ? 0 : parseInt(value, 10)
            });
        } else {
            setOrderData({
                ...orderData,
                [name]: value
            });
        }
    };

    // 날짜 변경 처리
    const handleDateChange = (date: Date | null, fieldName: string) => {
        setOrderData({
            ...orderData,
            [fieldName]: date ?? null
        });
    };

    // 입고예정일 범위 변경 처리
    const handleExpectedArrivalDateChange = (dates: [Date | null, Date | null]) => {
        const [start, end] = dates;
        setOrderData({
            ...orderData,
            expectedArrivalStartDate: start ?? null,
            expectedArrivalEndDate: end ?? null
        });
    };

    // 폼 제출 처리
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            // 필수 필드 검증
            if (!orderData.orderDate) {
                throw new Error('발주일자를 입력해주세요.');
            }
            if (!orderData.itemCode || orderData.itemCode.trim() === '') {
                throw new Error('품목을 입력해주세요.');
            }
            if (!orderData.colorName || orderData.colorName.trim() === '') {
                throw new Error('칼라/품명을 입력해주세요.');
            }
            if (!orderData.orderQuantity || orderData.orderQuantity <= 0) {
                throw new Error('발주수량을 입력해주세요.');
            }

            console.log('발주 데이터 제출:', orderData);

            // API 호출
            const response = await orderApi.createOrder(orderData);

            console.log('발주 생성 성공:', response);

            setSubmitted(true);
            setIsSubmitting(false);

            // 폼 초기화
            setOrderData(initialOrderData);

            // 3초 후 알림 메시지 숨기기
            setTimeout(() => {
                setSubmitted(false);
            }, 3000);
        } catch (err) {
            console.error('발주 정보 저장 중 오류 발생:', err);
            setError(err instanceof Error ? err.message : '발주 정보 저장 중 오류가 발생했습니다.');
            setIsSubmitting(false);
        }
    };

    // 폼 초기화
    const handleReset = () => {
        setOrderData(initialOrderData);
        setError(null);
    };

    return (
        <div className="order-form-container">
            <h2>발주 정보 입력</h2>

            {submitted && (
                <div className="success-message">
                    발주 정보가 성공적으로 저장되었습니다!
                </div>
            )}

            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="order-form">
                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="orderDate">발주일자</label>
                        <DatePicker
                            id="orderDate"
                            selected={orderData.orderDate}
                            onChange={(date) => handleDateChange(date, 'orderDate')}
                            dateFormat="yyyy-MM-dd"
                            placeholderText="YYYY-MM-DD"
                            required
                            className="date-picker"
                            autoComplete="off"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="itemCode">품목</label>
                        <input
                            type="text"
                            id="itemCode"
                            name="itemCode"
                            value={orderData.itemCode}
                            onChange={handleChange}
                            required
                            autoComplete="off"
                        />
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="colorName">칼라/품명</label>
                        <input
                            type="text"
                            id="colorName"
                            name="colorName"
                            value={orderData.colorName}
                            onChange={handleChange}
                            required
                            autoComplete="off"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="orderQuantity">발주수량</label>
                        <input
                            type="number"
                            id="orderQuantity"
                            name="orderQuantity"
                            value={orderData.orderQuantity === 0 ? '' : orderData.orderQuantity}
                            onChange={handleChange}
                            required
                            autoComplete="off"
                        />
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="expectedArrivalDate">입고예정일 (범위)</label>
                        <DatePicker
                            id="expectedArrivalDate"
                            selectsRange={true}
                            startDate={orderData.expectedArrivalStartDate}
                            endDate={orderData.expectedArrivalEndDate}
                            onChange={handleExpectedArrivalDateChange}
                            dateFormat="yyyy-MM-dd"
                            placeholderText="YYYY-MM-DD ~ YYYY-MM-DD"
                            className="date-picker"
                            autoComplete="off"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="arrivalDate">입고일</label>
                        <DatePicker
                            id="arrivalDate"
                            selected={orderData.arrivalDate}
                            onChange={(date) => handleDateChange(date, 'arrivalDate')}
                            dateFormat="yyyy-MM-dd"
                            placeholderText="YYYY-MM-DD"
                            className="date-picker"
                            autoComplete="off"
                        />
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="arrivalQuantity">입고수량</label>
                        <input
                            type="number"
                            id="arrivalQuantity"
                            name="arrivalQuantity"
                            value={orderData.arrivalQuantity === 0 ? '' : orderData.arrivalQuantity ?? ''}
                            onChange={handleChange}
                            autoComplete="off"
                        />
                    </div>

                    <div className="form-group">
                        {/* 빈 공간 - 균형을 위해 */}
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group full-width">
                        <label htmlFor="specialNote">특이사항</label>
                        <textarea
                            id="specialNote"
                            name="specialNote"
                            value={orderData.specialNote}
                            onChange={handleChange}
                            rows={3}
                            autoComplete="off"
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
                            onChange={handleChange}
                            rows={3}
                            autoComplete="off"
                        />
                    </div>
                </div>

                <div className="form-actions">
                    <button
                        type="button"
                        className="cancel-button"
                        onClick={handleReset}
                        disabled={isSubmitting}
                    >
                        초기화
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

export default OrderForm;