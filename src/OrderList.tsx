import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './OrderList.css';
import { orderApi, OrderData } from './services/api';

// 발주 데이터 타입 정의
// interface Order {
//     id: string;
//     orderDate: string;
//     itemCode: string;
//     colorName: string;
//     orderQuantity: number;
//     expectedArrivalStartDate: string;
//     expectedArrivalEndDate: string;
//     arrivalDate: string | null;
//     arrivalQuantity: number | null;
//     specialNote: string;
//     remarks: string;
//     status: '대기' | '입고완료' | '부분입고' | '지연';
// }

const OrderList: React.FC = () => {
    // 라우터 네비게이션
    const navigate = useNavigate();

    // 상태 관리
    const [_, setOrders] = useState<OrderData[]>([]);
    const [filteredOrders, setFilteredOrders] = useState<OrderData[]>([]);
    const [selectedMonth, setSelectedMonth] = useState<string>('all');
    const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
    const [loading, setLoading] = useState<boolean>(true);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {

        const fetchOrders = async () => {
            try {
                setLoading(true);
                setError(null);

                const data = await orderApi.getOrders(
                    selectedYear !== 'all' ? selectedYear : undefined,
                    selectedMonth !== 'all' ? selectedMonth : undefined,
                    searchTerm || undefined
                );

                const sortedData = [...data].sort((a, b) => {
                    if (a.id && b.id) {
                        return b.id.localeCompare(a.id);
                    }
                    return 0;
                });

                setOrders(sortedData);
                setFilteredOrders(sortedData);
                setLoading(false);
            } catch (err) {
                console.error('발주 목록 로드 오류:', err);
                setError('발주 목록을 불러오는 중 오류가 발생했습니다.');
                setLoading(false);
            }
        };

        fetchOrders();
    }, [selectedYear, selectedMonth, searchTerm]);

    // 상태에 따른 스타일 클래스 반환
    const getStatusClass = (status: string): string => {
        switch (status) {
            case '입고완료':
                return 'status-completed';
            case '부분입고':
                return 'status-partial';
            case '지연':
                return 'status-delayed';
            default:
                return 'status-pending';
        }
    };

    // 연도 옵션 생성
    const generateYearOptions = () => {
        const currentYear = new Date().getFullYear();
        const years = ['all'];

        for (let year = currentYear; year >= currentYear - 5; year--) {
            years.push(year.toString());
        }

        return years.map(year => (
            <option key={year} value={year}>
                {year === 'all' ? '전체 연도' : `${year}년`}
            </option>
        ));
    };

    // 월 옵션 생성
    const generateMonthOptions = () => {
        const months = ['all', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
        const monthNames = ['전체 월', '1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

        return months.map((month, index) => (
            <option key={month} value={month}>
                {monthNames[index]}
            </option>
        ));
    };

    // 발주 정보 수정 페이지로 이동
    const handleEditOrder = (orderId: string) => {
        navigate(`/edit/${orderId}`);
    };

    // 발주 정보 삭제 처리
    const handleDeleteOrder = async (orderId: string) => {
        if (window.confirm('정말로 이 발주 정보를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
            try {
                await orderApi.deleteOrder(orderId);
                alert('발주 정보가 성공적으로 삭제되었습니다.');
                // 삭제 후 목록 다시 불러오기
                const data = await orderApi.getOrders(
                    selectedYear !== 'all' ? selectedYear : undefined,
                    selectedMonth !== 'all' ? selectedMonth : undefined,
                    searchTerm || undefined
                );
                setOrders(data);
                setFilteredOrders(data);
            } catch (error) {
                console.error('발주 삭제 오류:', error);
                alert('발주 정보를 삭제하는 중 오류가 발생했습니다.');
            }
        }
    };

    // 검색어 변경 핸들러
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    // 검색어 제출 핸들러
    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // 검색어 변경 시 useEffect에서 자동으로 API 호출
    };

    // 날짜 포맷 함수
    const formatDate = (date: Date | null): string => {
        if (!date) return '-';
        return date.toISOString().split('T')[0];
    };

    return (
        <div className="order-list-container">
            <h2>발주 목록</h2>

            <div className="order-list-filters">
                <div className="filter-group">
                    <label htmlFor="yearFilter">연도:</label>
                    <select
                        id="yearFilter"
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                    >
                        {generateYearOptions()}
                    </select>
                </div>

                <div className="filter-group">
                    <label htmlFor="monthFilter">월:</label>
                    <select
                        id="monthFilter"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                    >
                        {generateMonthOptions()}
                    </select>
                </div>

                <div className="filter-group search-group">
                    <form onSubmit={handleSearchSubmit}>
                        <input
                            type="text"
                            placeholder="검색어 입력..."
                            value={searchTerm}
                            onChange={handleSearchChange}
                            className="search-input"
                        />
                    </form>
                </div>
            </div>
            {error && (
                <div className="error-message">{error}</div>
            )}

            {loading ? (
                <div className="loading-message">데이터를 불러오는 중...</div>
            ) : filteredOrders.length === 0 ? (
                <div className="no-data-message">표시할 데이터가 없습니다.</div>
            ) : (
                <div className="order-table-container">
                    <table className="order-table">
                        <thead>
                            <tr>
                                <th>발주번호</th>
                                <th>발주일자</th>
                                <th>품목</th>
                                <th>칼라/품명</th>
                                <th>발주수량</th>
                                <th>입고예정일</th>
                                <th>입고일</th>
                                <th>입고수량</th>
                                <th>상태</th>
                                <th>작업</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrders.map((order) => (
                                <tr
                                    key={order.id}
                                    className={order.specialNote ? 'has-note' : ''}
                                >
                                    <td>{order.id}</td>
                                    <td>{formatDate(order.orderDate)}</td>
                                    <td>{order.itemCode}</td>
                                    <td>{order.colorName}</td>
                                    <td className="number-cell">{order.orderQuantity.toLocaleString()}</td>
                                    <td>
                                        {order.expectedArrivalStartDate === order.expectedArrivalEndDate
                                            ? formatDate(order.expectedArrivalStartDate)
                                            : `${formatDate(order.expectedArrivalStartDate)} ~ ${formatDate(order.expectedArrivalEndDate)}`}
                                    </td>
                                    <td>{order.arrivalDate ? formatDate(order.arrivalDate) : '-'}</td>
                                    <td className="number-cell">{order.arrivalQuantity?.toLocaleString() || '-'}</td>
                                    <td>
                                        <span className={`status-badge ${getStatusClass(order.status || '대기')}`}>
                                            {order.status || '대기'}
                                        </span>
                                    </td>
                                    <td>
                                        <button
                                            className="order-list-edit-button"
                                            onClick={() => handleEditOrder(order.id || '')}
                                            title="발주 정보 수정"
                                        >
                                            수정
                                        </button>
                                        <button
                                            className="order-list-delete-button"
                                            onClick={() => handleDeleteOrder(order.id || '')}
                                            title="발주 정보 삭제"
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

            <div className="order-list-summary">
                <p>총 {filteredOrders.length}개의 발주 내역이 있습니다.</p>
            </div>
        </div>
    );
};

export default OrderList; 