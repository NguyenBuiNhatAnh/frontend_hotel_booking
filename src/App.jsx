import { Routes, Route, Outlet } from 'react-router-dom';

import Header from './components/common/Header.jsx';
import Footer from './components/common/Footer.jsx';
import AuthPage from './pages/common/AuthPage.jsx';
import HomePage from './pages/common/HomePage.jsx';
import MyBookingsPage from './pages/customer/MyBookingsPage.jsx';
import RegisterHotelPage from './pages/customer/RegisterHotelPage.jsx';
import AdminDashboardPage from './pages/admin/AdminDashboardPage.jsx';
import AdminHotelsPage from './pages/admin/AdminHotelsPage.jsx';
import AdminUsersPage from './pages/admin/AdminUsersPage.jsx';
import ManagerDashboard from './pages/manager/ManagerDashboard.jsx';
import HotelSearchPage from './pages/customer/HotelSearchPage';
import HotelDetailPage from './pages/customer/HotelDetailPage';

import './index.css';
import PaymentSuccess from './pages/customer/PaymentSuccess.jsx';
import PaymentFailed from './pages/customer/PaymentFailed.jsx';
import AccountProfilePage from './pages/common/AccountProfilePage.jsx';
import ChangePasswordPage from './pages/common/ChangePasswordPage.jsx';

function Layout() {
  return (
    <>
      <Header />

      <main className="main-content">
        <Outlet />
      </main>

      <Footer />
    </>
  );
}

function HotelsPage() {
  return <div>Danh sách khách sạn</div>;
}

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/my-bookings" element={<MyBookingsPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="register-hotel" element={<RegisterHotelPage />} />
        <Route path="/manager" element={<ManagerDashboard />} />
        <Route path="/hotels" element={<HotelSearchPage />} />
        <Route path="/hotels/:hotelId" element={<HotelDetailPage />} />
        <Route path="/payment/success" element={<PaymentSuccess />} />
        <Route path="/payment/failed" element={<PaymentFailed />} />
        <Route path="/account/profile" element={<AccountProfilePage />} />
        <Route path="/account/change-password" element={<ChangePasswordPage />} />
      </Route>
      {/* Routes KHÔNG có Header & Footer */}
      <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
      <Route path="/admin/hotels" element={<AdminHotelsPage />} />
      <Route path="/admin/users" element={<AdminUsersPage />} />
    </Routes>
  );
}

export default App;
