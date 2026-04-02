import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFirebase } from '../FirebaseProvider';
import { useNavigate } from 'react-router-dom';
import { Mail, Github, Chrome, Apple, ArrowRight, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Login() {
  const { signInWithGoogle, signInWithApple, signInWithEmail, signUpWithEmail } = useFirebase();
  const [view, setView] = useState<'welcome' | 'login' | 'signup'>('welcome');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (view === 'signup') {
        await signUpWithEmail(email, password, displayName);
      } else {
        await signInWithEmail(email, password);
      }
      navigate('/');
    } catch (err: any) {
      if (err.message?.includes('auth/invalid-credential')) {
        setError('Invalid email or password. Please try again or create an account.');
      } else if (err.message?.includes('auth/email-already-in-use')) {
        setError('This email is already in use. Please log in instead.');
      } else {
        setError(err.message);
      }
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleAppleSignIn = async () => {
    try {
      await signInWithApple();
      navigate('/');
    } catch (err: any) {
      if (err.message?.includes('auth/operation-not-allowed')) {
        setError('Apple Sign-In is not yet fully configured in the Firebase Console. Please use Google or Email for now.');
      } else {
        setError(err.message);
      }
    }
  };

  if (view === 'welcome') {
    return (
      <div className="min-h-screen relative flex flex-col items-center justify-between bg-pex-blue overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=2070&auto=format&fit=crop" 
            alt="Luxury Car Interior" 
            className="w-full h-full object-cover opacity-40"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-pex-blue/80 via-pex-blue/50 to-pex-blue"></div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative z-10 w-full pt-24 flex flex-col items-center"
        >
          <div className="w-20 h-20 rounded-full bg-pex-gold flex items-center justify-center mb-6 shadow-2xl">
            <span className="text-pex-blue font-bold text-3xl">PR</span>
          </div>
          <h1 className="text-4xl font-bold text-white tracking-widest uppercase mb-3">Pex Ride</h1>
          <p className="text-pex-gold uppercase tracking-widest text-sm font-bold">Quiet Luxury Chauffeur</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="relative z-10 w-full max-w-md px-6 pb-12 space-y-4"
        >
          <Button 
            onClick={() => setView('signup')}
            className="w-full bg-pex-gold text-pex-blue hover:bg-white font-bold h-14 rounded-2xl text-lg transition-colors shadow-xl"
          >
            Create Account
          </Button>
          <Button 
            onClick={() => setView('login')}
            variant="outline"
            className="w-full bg-transparent border-2 border-white/30 text-white hover:bg-white/10 hover:text-white font-bold h-14 rounded-2xl text-lg transition-colors"
          >
            Log In
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-pex-blue p-6 relative">
      <button 
        onClick={() => setView('welcome')}
        className="absolute top-8 left-6 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors z-20"
      >
        <ArrowLeft size={24} />
      </button>

      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-full max-w-md flex flex-col h-full justify-center z-10"
      >
        <div className="text-center mb-10 flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-pex-gold flex items-center justify-center mb-6 shadow-lg">
            <span className="text-pex-blue font-bold text-2xl">PR</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-widest uppercase mb-2">Pex Ride</h1>
        </div>

        <div className="bg-white/5 backdrop-blur-md rounded-3xl p-8 border border-white/10 shadow-2xl">
          <div className="space-y-1 mb-8 text-center">
            <h2 className="text-2xl font-bold text-white">
              {view === 'signup' ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p className="text-sm text-white/60">
              {view === 'signup' ? 'Enter your details to register' : 'Enter your credentials to access your account'}
            </p>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="w-full bg-transparent border-white/20 text-white hover:bg-white/10 hover:text-white" onClick={handleGoogleSignIn}>
                <Chrome className="mr-2 h-4 w-4" />
                Google
              </Button>
              <Button variant="outline" className="w-full bg-transparent border-white/20 text-white hover:bg-white/10 hover:text-white" onClick={handleAppleSignIn}>
                <Apple className="mr-2 h-4 w-4" />
                Apple
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-wider">
                <span className="bg-pex-blue px-4 text-white/40 rounded-full">Or continue with email</span>
              </div>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              {view === 'signup' && (
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-white/80 text-xs uppercase tracking-wider">Full Name</Label>
                  <Input 
                    id="name" 
                    placeholder="John Doe" 
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                    className="bg-white/10 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-pex-gold h-12 rounded-xl"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white/80 text-xs uppercase tracking-wider">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="m@example.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-white/10 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-pex-gold h-12 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white/80 text-xs uppercase tracking-wider">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-white/10 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-pex-gold h-12 rounded-xl"
                />
              </div>
              {error && <p className="text-xs text-red-400 font-medium text-center">{error}</p>}
              <Button type="submit" className="w-full bg-pex-gold text-pex-blue hover:bg-white font-bold h-12 rounded-xl mt-4 transition-colors">
                {view === 'signup' ? 'Register' : 'Login'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>

            <div className="text-center pt-4">
              <button 
                onClick={() => setView(view === 'signup' ? 'login' : 'signup')}
                className="text-white/60 hover:text-white text-sm font-medium transition-colors"
              >
                {view === 'signup' ? 'Already have an account? Login' : "Don't have an account? Register"}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
