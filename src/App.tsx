import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import PassengerApp from './pages/PassengerApp';
import BookingPage from './pages/BookingPage';
import AdminDashboard from './pages/AdminDashboard';
import DriverApp from './pages/DriverApp';
import Login from './pages/Login';
import DriverLogin from './pages/DriverLogin';
import AirportTransfers from './pages/services/AirportTransfers';
import CorporateTravel from './pages/services/CorporateTravel';
import CuratedTours from './pages/services/CuratedTours';
import EventLogistics from './pages/services/EventLogistics';
import PrivacyPolicy from './pages/legal/PrivacyPolicy';
import TermsOfService from './pages/legal/TermsOfService';
import CookiePolicy from './pages/legal/CookiePolicy';
import DataSharing from './pages/legal/DataSharing';
import FAQ from './pages/legal/FAQ';
import { Car, ShieldCheck, LogIn, LogOut, ExternalLink, Navigation, Info, Mail, Phone, MapPin, Instagram, Twitter, Facebook, Moon, Sun } from 'lucide-react';
import { FirebaseProvider, useFirebase } from './FirebaseProvider';
import { db } from './firebase';
import { onSnapshot, doc } from 'firebase/firestore';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

function SplashScreen({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      className="fixed inset-0 z-[100] bg-pex-blue flex flex-col items-center justify-center"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="flex flex-col items-center"
      >
        <img 
          src="/logo.svg" 
          alt="Pex Ride" 
          className="h-24 object-contain mb-6"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            e.currentTarget.nextElementSibling?.classList.remove('hidden');
          }}
        />
        <div className="hidden flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-pex-gold flex items-center justify-center mb-4">
            <span className="text-pex-blue font-bold text-2xl">PR</span>
          </div>
          <h1 className="text-4xl font-bold text-white tracking-widest uppercase">Pex Ride</h1>
        </div>
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ duration: 2.5, ease: "easeInOut" }}
          className="h-0.5 bg-pex-gold mt-8 w-48"
        />
      </motion.div>
    </motion.div>
  );
}

function AppContent() {
  const { user, profile, logout, loading } = useFirebase();
  const location = useLocation();
  const navigate = useNavigate();
  const [showSplash, setShowSplash] = useState(true);
  
  const [footerSettings, setFooterSettings] = useState({
    address: 'Av. da Liberdade 110, 1269-042 Lisboa, Portugal',
    phone: '+351 213 811 400',
    email: 'concierge@pex-ride.com',
    instagram: 'https://instagram.com',
    twitter: 'https://twitter.com',
    facebook: 'https://facebook.com'
  });

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'footer'), (docSnap) => {
      if (docSnap.exists()) {
        setFooterSettings(prev => ({ ...prev, ...docSnap.data() }));
      }
    });
    return () => unsub();
  }, []);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) return savedTheme === 'dark';
      return false;
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Redirect logic after splash screen
  useEffect(() => {
    if (!showSplash && !loading) {
      const publicRoutes = ['/login', '/driver/login', '/legal/privacy-policy', '/legal/terms-of-service', '/legal/cookie-policy', '/legal/data-sharing', '/faq'];
      if (!user && !publicRoutes.includes(location.pathname)) {
        navigate('/login');
      }
    }
  }, [showSplash, loading, user, location.pathname, navigate]);

  if (loading || showSplash) {
    return (
      <>
        <AnimatePresence>
          {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
        </AnimatePresence>
        {loading && !showSplash && (
          <div className="min-h-screen bg-pex-blue flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pex-gold"></div>
          </div>
        )}
      </>
    );
  }

  // Determine if we should show the web nav/footer
  // For a mobile app feel, we hide them on the main passenger app, booking, login, and driver app.
  const isMobileAppRoute = ['/', '/login', '/book', '/driver', '/driver/login'].includes(location.pathname);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {!isMobileAppRoute && (
        <nav className="bg-pex-blue text-white p-4 flex justify-between items-center shadow-md z-50">
          <Link to="/" className="flex items-center gap-2">
            <img 
              src="/logo.svg" 
              alt="Pex Ride" 
              className="h-12 object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <div className="hidden flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-pex-gold flex items-center justify-center">
                <span className="text-pex-blue font-bold text-sm">PR</span>
              </div>
              <span className="font-semibold tracking-widest text-lg uppercase">Pex Ride</span>
            </div>
          </Link>
          <div className="flex gap-4 items-center">
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 hover:bg-white/10 rounded-full transition-colors text-pex-gold"
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            {profile?.role === 'admin' && (
              <Link to="/admin" className="flex items-center gap-2 hover:text-pex-gold transition-colors text-sm uppercase tracking-wider">
                <ShieldCheck size={16} />
                Admin
              </Link>
            )}
            <Link to="/book" className="flex items-center gap-2 bg-pex-gold text-pex-blue px-4 py-1.5 rounded-full font-bold text-sm hover:bg-white transition-colors ml-4">
              <Car size={16} />
              BOOK NOW
            </Link>
            {user ? (
              <div className="flex items-center gap-3 ml-4 border-l border-white/20 pl-4">
                <div className="flex flex-col items-end">
                  <span className="text-xs font-medium">{user.displayName}</span>
                  <span className="text-[10px] opacity-70 uppercase tracking-tighter">{profile?.role}</span>
                </div>
                <button onClick={logout} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <Link to="/login" className="flex items-center gap-2 bg-pex-gold text-pex-blue px-4 py-1.5 rounded-full font-bold text-sm hover:bg-white transition-colors ml-4">
                <LogIn size={16} />
                LOGIN
              </Link>
            )}
          </div>
        </nav>
      )}

      <main className="flex-1 flex flex-col relative">
        <Routes>
          <Route path="/" element={<PassengerApp />} />
          <Route path="/book" element={<BookingPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/driver" element={<DriverApp />} />
          <Route path="/driver/login" element={<DriverLogin />} />
          <Route path="/login" element={<Login />} />
          <Route path="/services/airport-transfers" element={<AirportTransfers />} />
          <Route path="/services/corporate-travel" element={<CorporateTravel />} />
          <Route path="/services/curated-tours" element={<CuratedTours />} />
          <Route path="/services/event-logistics" element={<EventLogistics />} />
          <Route path="/legal/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/legal/terms-of-service" element={<TermsOfService />} />
          <Route path="/legal/cookie-policy" element={<CookiePolicy />} />
          <Route path="/legal/data-sharing" element={<DataSharing />} />
          <Route path="/faq" element={<FAQ />} />
        </Routes>
      </main>

      {/* Footer */}
      {!isMobileAppRoute && (
        <footer className="bg-pex-blue text-white pt-16 pb-8 border-t border-white/10">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="space-y-4">
              <Link to="/" className="flex items-center gap-2">
                <img 
                  src="/logo.svg" 
                  alt="Pex Ride" 
                  className="h-12 object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <div className="hidden flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-pex-gold flex items-center justify-center">
                    <span className="text-pex-blue font-bold text-sm">PR</span>
                  </div>
                  <span className="font-semibold tracking-widest text-lg uppercase">Pex Ride</span>
                </div>
              </Link>
              <p className="text-sm text-white/60 leading-relaxed">
                Experience the pinnacle of private transportation with Pex Ride. Our elite chauffeur service provides quiet luxury, safety, and punctuality across Portugal's most exclusive destinations.
              </p>
              <div className="flex gap-4 pt-2">
                <a href={footerSettings.instagram} target="_blank" rel="noopener noreferrer">
                  <Instagram size={20} className="text-white/40 hover:text-pex-gold cursor-pointer transition-colors" />
                </a>
                <a href={footerSettings.twitter} target="_blank" rel="noopener noreferrer">
                  <Twitter size={20} className="text-white/40 hover:text-pex-gold cursor-pointer transition-colors" />
                </a>
                <a href={footerSettings.facebook} target="_blank" rel="noopener noreferrer">
                  <Facebook size={20} className="text-white/40 hover:text-pex-gold cursor-pointer transition-colors" />
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-pex-gold uppercase tracking-widest text-xs mb-6">Quick Links</h4>
              <ul className="space-y-3 text-sm text-white/60">
                <li><Link to="/" className="hover:text-white transition-colors">Book a Ride</Link></li>
                <li><Link to="/login" className="hover:text-white transition-colors">Client Login</Link></li>
                <li><Link to="/driver" className="hover:text-white transition-colors">Driver Portal</Link></li>
                <li><Link to="/admin" className="hover:text-white transition-colors">Admin Dashboard</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-pex-gold uppercase tracking-widest text-xs mb-6">Services</h4>
              <ul className="space-y-3 text-sm text-white/60">
                <li><Link to="/services/airport-transfers" className="hover:text-white transition-colors">Airport Transfers</Link></li>
                <li><Link to="/services/corporate-travel" className="hover:text-white transition-colors">Corporate Travel</Link></li>
                <li><Link to="/services/curated-tours" className="hover:text-white transition-colors">Curated Tours</Link></li>
                <li><Link to="/services/event-logistics" className="hover:text-white transition-colors">Event Logistics</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-pex-gold uppercase tracking-widest text-xs mb-6">Contact Us</h4>
              <ul className="space-y-4 text-sm text-white/60">
                <li className="flex items-start gap-3">
                  <MapPin size={18} className="text-pex-gold shrink-0" />
                  <span>{footerSettings.address}</span>
                </li>
                <li className="flex items-center gap-3">
                  <Phone size={18} className="text-pex-gold shrink-0" />
                  <span>{footerSettings.phone}</span>
                </li>
                <li className="flex items-center gap-3">
                  <Mail size={18} className="text-pex-gold shrink-0" />
                  <span>{footerSettings.email}</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] uppercase tracking-widest text-white/40 font-bold">
            <p>© 2026 Pex Ride. All rights reserved.</p>
            <div className="flex gap-8">
              <Link to="/legal/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link to="/legal/terms-of-service" className="hover:text-white transition-colors">Terms of Service</Link>
              <Link to="/legal/data-sharing" className="hover:text-white transition-colors">Data Sharing</Link>
              <Link to="/faq" className="hover:text-white transition-colors">FAQ</Link>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <FirebaseProvider>
        <Router>
          <AppContent />
        </Router>
      </FirebaseProvider>
    </ErrorBoundary>
  );
}
