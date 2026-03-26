import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import PassengerApp from './pages/PassengerApp';
import AdminDashboard from './pages/AdminDashboard';
import { Car, ShieldCheck } from 'lucide-react';

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <nav className="bg-pex-blue text-white p-4 flex justify-between items-center shadow-md z-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-pex-gold flex items-center justify-center">
              <span className="text-pex-blue font-bold text-sm">PEX</span>
            </div>
            <span className="font-semibold tracking-widest text-lg">PEX RIDE</span>
          </div>
          <div className="flex gap-4">
            <Link to="/" className="flex items-center gap-2 hover:text-pex-gold transition-colors text-sm uppercase tracking-wider">
              <Car size={16} />
              Passenger App
            </Link>
            <Link to="/admin" className="flex items-center gap-2 hover:text-pex-gold transition-colors text-sm uppercase tracking-wider">
              <ShieldCheck size={16} />
              Admin
            </Link>
          </div>
        </nav>
        <main className="flex-1 flex flex-col relative">
          <Routes>
            <Route path="/" element={<PassengerApp />} />
            <Route path="/admin" element={<AdminDashboard />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
