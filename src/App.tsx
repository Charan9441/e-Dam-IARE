import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { LogoLoader } from './components/LogoLoader';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

// Public Pages
import { HomePage } from './pages/HomePage';
import { EventsPage } from './pages/EventsPage';
import { EventDetailPage } from './pages/EventDetailPage';
import { VerifyPage } from './pages/VerifyPage';
import { DomainsPage } from './pages/DomainsPage';
import { InitiativesPage } from './pages/InitiativesPage';
import { TeamPage } from './pages/TeamPage';
import { GalleryPage } from './pages/GalleryPage';
import { ContactPage } from './pages/ContactPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { TermsPage } from './pages/TermsPage';

// Admin Pages & Auth
import { AdminAuthProvider } from './context/AdminAuthContext';
import { ProtectedRoute } from './components/admin/ProtectedRoute';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminEventsPage } from './pages/admin/AdminEventsPage';
import { AdminCertificatesPage } from './pages/admin/AdminCertificatesPage';
import { AdminRegistrationsPage } from './pages/admin/AdminRegistrationsPage';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function MainLayout() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  const isHome = location.pathname === '/';

  const [loading, setLoading] = useState(isHome);
  const [isZoomingIn, setIsZoomingIn] = useState(false);

  return (
    <div className="min-h-screen bg-[#030305] text-[#F5F3FF] selection:bg-[#8B5CF6]/30 flex flex-col">
      <ScrollToTop />

      {isHome && loading && (
        <LogoLoader 
          onZoomStart={() => setIsZoomingIn(true)}
          onComplete={() => {
            setLoading(false);
            setIsZoomingIn(false);
          }} 
        />
      )}

      {(!loading || !isHome || isZoomingIn) && (
        <motion.div 
          className="relative z-10 flex flex-col flex-1"
          initial={{ opacity: isHome ? 0.8 : 1 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          {!isAdmin && <Navbar />}

          <main className="flex-1">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/events" element={<EventsPage />} />
              <Route path="/events/:slug" element={<EventDetailPage />} />
              <Route path="/verify" element={<VerifyPage />} />
              <Route path="/verify/:certId" element={<VerifyPage />} />
              <Route path="/domains" element={<DomainsPage />} />
              <Route path="/initiatives" element={<InitiativesPage />} />
              <Route path="/team" element={<TeamPage />} />
              <Route path="/gallery" element={<GalleryPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/terms" element={<TermsPage />} />

              {/* Admin Routes */}
              <Route path="/admin/login" element={<AdminLoginPage />} />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <AdminDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/events"
                element={
                  <ProtectedRoute>
                    <AdminEventsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/certificates"
                element={
                  <ProtectedRoute>
                    <AdminCertificatesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/registrations"
                element={
                  <ProtectedRoute>
                    <AdminRegistrationsPage />
                  </ProtectedRoute>
                }
              />

              {/* Catch-all redirect */}
              <Route path="*" element={<HomePage />} />
            </Routes>
          </main>

          {!isAdmin && <Footer />}
        </motion.div>
      )}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AdminAuthProvider>
        <MainLayout />
      </AdminAuthProvider>
    </BrowserRouter>
  );
}

export default App;
