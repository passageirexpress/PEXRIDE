import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFirebase } from '../FirebaseProvider';
import { useNavigate } from 'react-router-dom';
import { Navigation, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

export default function DriverLogin() {
  const { signInWithEmail } = useFirebase();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithEmail(email, password);
      navigate('/driver');
    } catch (err: any) {
      setError(err.message || 'Failed to login. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8 flex flex-col items-center">
          <img 
            src="/logo.svg" 
            alt="Passageiro Express Luxury" 
            className="h-16 object-contain mb-4"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling?.classList.remove('hidden');
            }}
          />
          <div className="hidden w-16 h-16 bg-pex-blue rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
            <Navigation size={32} className="text-pex-gold" />
          </div>
          <h1 className="text-3xl font-bold text-pex-blue tracking-tighter mb-2">Driver Portal</h1>
          <p className="text-gray-500 uppercase tracking-widest text-xs font-bold">PASSAGEIRO EXPRESS PARTNERS</p>
        </div>

        <Card className="border-none shadow-2xl overflow-hidden">
          <div className="h-2 bg-pex-gold w-full" />
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-bold text-center">
              Sign In
            </CardTitle>
            <p className="text-center text-sm text-gray-500">
              Enter your driver credentials to access your dashboard
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-start gap-2 border border-red-100">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <p>{error}</p>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="driver@pexride.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password">Password</Label>
                  <a href="#" className="text-xs text-pex-blue hover:text-pex-gold transition-colors font-medium">Forgot password?</a>
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 bg-pex-blue hover:bg-pex-blue/90 text-white font-bold text-lg mt-6"
                disabled={loading}
              >
                {loading ? 'Authenticating...' : 'Access Dashboard'}
              </Button>
            </form>
            
            <div className="mt-8 text-center text-sm text-gray-500">
              <p>Not a partner yet?</p>
              <a href="mailto:partners@pexride.com" className="text-pex-gold font-bold hover:underline">Apply to drive with PEX</a>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
