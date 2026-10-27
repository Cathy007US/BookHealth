import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useStore } from './store';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import InstitutionList from './pages/InstitutionList';
import InstitutionDetail from './pages/InstitutionDetail';
import PackageList from './pages/PackageList';
import PackageDetail from './pages/PackageDetail';
import OrderCreate from './pages/OrderCreate';
import OrderList from './pages/OrderList';
import OrderDetail from './pages/OrderDetail';
import ReportList from './pages/ReportList';
import ReportDetail from './pages/ReportDetail';
import Examinees from './pages/Examinees';
import Profile from './pages/Profile';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token, loadAuth } = useStore();
  useEffect(() => { loadAuth(); }, []);

  if (!token && !localStorage.getItem('token')) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  const { loadAuth } = useStore();
  useEffect(() => { loadAuth(); }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* 公开路由 */}
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Home />} />
        <Route path="/institutions" element={<InstitutionList />} />
        <Route path="/institutions/:id" element={<InstitutionDetail />} />
        <Route path="/packages" element={<PackageList />} />
        <Route path="/packages/:id" element={<PackageDetail />} />

        {/* 需要登录的路由 */}
        <Route path="/orders" element={<ProtectedRoute><OrderList /></ProtectedRoute>} />
        <Route path="/orders/create" element={<ProtectedRoute><OrderCreate /></ProtectedRoute>} />
        <Route path="/orders/:id" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><ReportList /></ProtectedRoute>} />
        <Route path="/reports/:id" element={<ProtectedRoute><ReportDetail /></ProtectedRoute>} />
        <Route path="/examinees" element={<ProtectedRoute><Examinees /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

        {/* 兜底 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
