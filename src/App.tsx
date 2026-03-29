import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import PassengerApp from './pages/PassengerApp';
import AdminDashboard from './pages/AdminDashboard';
import DriverApp from './pages/DriverApp';
import Login from './pages/Login';
import { Car, ShieldCheck, LogIn, LogOut, ExternalLink, Navigation, Info, Mail, Phone, MapPin, Instagram, Twitter, Facebook } from 'lucide-react';
import { FirebaseProvider, useFirebase } from './FirebaseProvider';

function AppContent() {
  const { user, profile, signIn, logout, loading } = useFirebase();

  const openInNewTab = () => {
    window.open(window.location.href, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pex-blue"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="bg-pex-blue text-white p-4 flex justify-between items-center shadow-md z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-pex-gold flex items-center justify-center">
            <span className="text-pex-blue font-bold text-sm">PEX</span>
          </div>
          <span className="font-semibold tracking-widest text-lg">PEX RIDE</span>
        </div>
        <div className="flex gap-4 items-center">
          <button 
            onClick={openInNewTab}
            className="flex items-center gap-2 hover:text-pex-gold transition-colors text-[10px] uppercase tracking-wider bg-white/10 px-3 py-1 rounded-full"
            title="Open in new tab to fix cookie issues"
          >
            <ExternalLink size={12} />
            New Tab
          </button>
          <Link to="/" className="flex items-center gap-2 hover:text-pex-gold transition-colors text-sm uppercase tracking-wider">
            <Car size={16} />
            Passenger App
          </Link>
          {(profile?.role === 'driver' || profile?.role === 'admin') && (
            <Link to="/driver" className="flex items-center gap-2 hover:text-pex-gold transition-colors text-sm uppercase tracking-wider">
              <Navigation size={16} />
              Driver
            </Link>
          )}
          {profile?.role === 'admin' && (
            <Link to="/admin" className="flex items-center gap-2 hover:text-pex-gold transition-colors text-sm uppercase tracking-wider">
              <ShieldCheck size={16} />
              Admin
            </Link>
          )}
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
      <main className="flex-1 flex flex-col relative">
        <Routes>
          <Route path="/" element={<PassengerApp />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/driver" element={<DriverApp />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="bg-pex-blue text-white pt-16 pb-8 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-pex-gold flex items-center justify-center">
                <span className="text-pex-blue font-bold text-sm">PEX</span>
              </div>
              <span className="font-semibold tracking-widest text-lg">PEX RIDE</span>
            </div>
            <p className="text-sm text-white/60 leading-relaxed">
              Experience the pinnacle of private transportation. Our elite chauffeur service provides quiet luxury, safety, and punctuality across Portugal's most exclusive destinations.
            </p>
            <div className="flex gap-4 pt-2">
              <Instagram size={20} className="text-white/40 hover:text-pex-gold cursor-pointer transition-colors" />
              <Twitter size={20} className="text-white/40 hover:text-pex-gold cursor-pointer transition-colors" />
              <Facebook size={20} className="text-white/40 hover:text-pex-gold cursor-pointer transition-colors" />
            </div>
          </div>

          <div>
            <h4 className="font-bold text-pex-gold uppercase tracking-widest text-xs mb-6">Quick Links</h4>
            <ul className="space-y-3 text-sm text-white/60">
              <li><Link to="/" className="hover:text-white transition-colors">Book a Ride</Link></li>
              <li><Link to="/login" className="hover:text-white transition-colors">Client Login</Link></li>
              <li><Link to="/driver" className="hover:text-white transition-colors">Driver Panel</Link></li>
              <li><Link to="/admin" className="hover:text-white transition-colors">Admin Dashboard</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-pex-gold uppercase tracking-widest text-xs mb-6">Services</h4>
            <ul className="space-y-3 text-sm text-white/60">
              <li className="hover:text-white cursor-pointer transition-colors">Airport Transfers</li>
              <li className="hover:text-white cursor-pointer transition-colors">Corporate Travel</li>
              <li className="hover:text-white cursor-pointer transition-colors">Curated Tours</li>
              <li className="hover:text-white cursor-pointer transition-colors">Event Logistics</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-pex-gold uppercase tracking-widest text-xs mb-6">Contact Us</h4>
            <ul className="space-y-4 text-sm text-white/60">
              <li className="flex items-start gap-3">
                <MapPin size={18} className="text-pex-gold shrink-0" />
                <span>Av. da Liberdade 110, 1269-042 Lisboa, Portugal</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={18} className="text-pex-gold shrink-0" />
                <span>+351 213 811 400</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={18} className="text-pex-gold shrink-0" />
                <span>concierge@pex-ride.com</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] uppercase tracking-widest text-white/40 font-bold">
          <p>© 2026 PEX RIDE. All rights reserved.</p>
          <div className="flex gap-8">
            <span className="hover:text-white cursor-pointer transition-colors">Privacy Policy</span>
            <span className="hover:text-white cursor-pointer transition-colors">Terms of Service</span>
            <span className="hover:text-white cursor-pointer transition-colors">Cookie Policy</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <FirebaseProvider>
      <Router>
        <AppContent />
      </Router>
    </FirebaseProvider>
  );
}
