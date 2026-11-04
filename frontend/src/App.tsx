import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useStore } from './store';
import { I18nProvider } from './i18n';
import TabBar from './components/TabBar';

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
import Consultation from './pages/Consultation';

// Admin Pages
import AdminLogin from './pages/admin/AdminLogin';
import AdminExamItems from './pages/admin/AdminExamItems';
import AdminExaminees from './pages/admin/AdminExaminees';

// 需要隐藏 TabBar 的页面路径
const HIDE_TABBAR_PATHS = ['/login', '/orders/create'];
const HIDE_TABBAR_PREFIXES = ['/packages/', '/institutions/', '/orders/', '/reports', '/examinees', '/admin', '/consultations'];

function Layout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const shouldHide =
    HIDE_TABBAR_PATHS.includes(pathname) ||
    HIDE_TABBAR_PREFIXES.some((prefix) => pathname.startsWith(prefix) && pathname !== prefix);

  return (
    <>
      {children}
      {!shouldHide && <TabBar />}
    </>
  );
}

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
    <I18nProvider>
      <BrowserRouter>
        <Layout>
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
          <Route path="/consultations" element={<ProtectedRoute><Consultation /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

          {/* 后台管理路由（独立布局，不走 TabBar） */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/exam-items" element={<AdminExamItems />} />
          <Route path="/admin/examinees" element={<AdminExaminees />} />

          {/* 兜底 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Layout>
      </BrowserRouter>
    </I18nProvider>
  );
}
