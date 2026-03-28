import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import PassengerApp from './pages/PassengerApp';
import AdminDashboard from './pages/AdminDashboard';
import DriverApp from './pages/DriverApp';
import { Car, ShieldCheck, LogIn, LogOut, ExternalLink, Navigation } from 'lucide-react';
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
            <button onClick={signIn} className="flex items-center gap-2 bg-pex-gold text-pex-blue px-4 py-1.5 rounded-full font-bold text-sm hover:bg-white transition-colors ml-4">
              <LogIn size={16} />
              LOGIN
            </button>
          )}
        </div>
      </nav>
      <main className="flex-1 flex flex-col relative">
        <Routes>
          <Route path="/" element={<PassengerApp />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/driver" element={<DriverApp />} />
        </Routes>
      </main>
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
