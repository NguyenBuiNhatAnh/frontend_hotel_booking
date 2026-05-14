import { Routes, Route, Outlet } from 'react-router-dom';

import Header from './components/common/Header.jsx';
import Footer from './components/common/Footer.jsx';
import AuthPage from './pages/common/AuthPage.jsx';
import HomePage from './pages/common/HomePage.jsx';

import './index.css';

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

function MyBookingsPage() {
  return <div>Đơn hàng của tôi</div>;
}

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/hotels" element={<HotelsPage />} />
        <Route path="/my-bookings" element={<MyBookingsPage />} />
        <Route path="/auth" element={<AuthPage />} />
      </Route>
    </Routes>
  );
}

export default App;