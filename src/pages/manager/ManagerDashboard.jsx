// pages/manager/ManagerDashboard.jsx
import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import HotelInfo from './components/HotelInfo';
import RoomsManager from './components/RoomsManager';
import BookingsManager from './components/BookingsManager';
import ServicesManager from './components/ServicesManager';
import Statistics from './components/Statistics';
import './ManagerDashboard.css';

const TABS = [
  { key: 'hotel', label: '🏨 Thông tin khách sạn', component: HotelInfo },
  { key: 'rooms', label: '🛏️ Quản lý phòng', component: RoomsManager },
  { key: 'bookings', label: '📅 Đặt phòng', component: BookingsManager },
  { key: 'services', label: '✨ Dịch vụ thêm', component: ServicesManager },
  { key: 'stats', label: '📊 Thống kê', component: Statistics },
];

export default function ManagerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('hotel');

  useEffect(() => {
    const tab = new URLSearchParams(location.search).get('tab');
    if (TABS.some((item) => item.key === tab)) {
      setActiveTab(tab);
    }
  }, [location.search]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const ActiveComponent = TABS.find(tab => tab.key === activeTab)?.component || HotelInfo;

  return (
    <div className="manager-dashboard">
      <aside className="manager-sidebar">
        <div className="sidebar-header">
          <h2>🏨 Hotel Manager</h2>
          <p>{user?.firstName} {user?.lastName}</p>
        </div>
        <nav className="sidebar-nav">
          {TABS.map(tab => (
            <button
              key={tab.key}
              className={`sidebar-nav-item ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => {
                setActiveTab(tab.key);
                navigate('/manager', { replace: true });
              }}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="manager-content">
        <div className="content-header">
          <h1>{TABS.find(tab => tab.key === activeTab)?.label}</h1>
        </div>
        <div className="content-body">
          <ActiveComponent />
        </div>
      </main>
    </div>
  );
}
