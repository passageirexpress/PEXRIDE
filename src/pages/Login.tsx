import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFirebase } from '../FirebaseProvider';
import { useNavigate } from 'react-router-dom';
import { Mail, Github, Chrome, Apple, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

export default function Login() {
  const { signInWithGoogle, signInWithApple, signInWithEmail, signUpWithEmail } = useFirebase();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (isSignUp) {
        await signUpWithEmail(email, password, displayName);
      } else {
        await signInWithEmail(email, password);
      }
      navigate('/');
    } catch (err: any) {
      setError(err.message);
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
          <h1 className="hidden text-4xl font-bold text-pex-blue tracking-tighter mb-2 italic">PEX</h1>
          <p className="text-gray-500 uppercase tracking-widest text-xs font-bold">Quiet Luxury Chauffeur Service</p>
        </div>

        <Card className="border-none shadow-2xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              {isSignUp ? 'Create an account' : 'Welcome back'}
            </CardTitle>
            <p className="text-center text-sm text-gray-500">
              {isSignUp ? 'Enter your details to register' : 'Enter your credentials to login'}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="w-full" onClick={handleGoogleSignIn}>
                <Chrome className="mr-2 h-4 w-4" />
                Google
              </Button>
              <Button variant="outline" className="w-full" onClick={handleAppleSignIn}>
                <Apple className="mr-2 h-4 w-4" />
                Apple
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">Or continue with email</span>
              </div>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input 
                    id="name" 
                    placeholder="John Doe" 
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="m@example.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
              <Button type="submit" className="w-full bg-pex-blue text-white hover:bg-pex-blue/90">
                {isSignUp ? 'Register' : 'Login'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>

            <div className="text-center text-sm">
              <button 
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-pex-gold hover:underline font-medium"
              >
                {isSignUp ? 'Already have an account? Login' : "Don't have an account? Register"}
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
