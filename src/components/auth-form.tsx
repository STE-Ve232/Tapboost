
"use client";

import React, { useState } from 'react';
import { auth, isConfigValid, missingKeys } from '@/lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile 
} from 'firebase/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

// Inline SVGs to avoid lucide-react module factory errors during HMR
const Icons = {
  Coins: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/><path d="m16.71 13.88.7.71-2.82 2.82"/></svg>
  ),
  LogIn: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" x2="3" y1="12" y2="12"/></svg>
  ),
  UserPlus: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></svg>
  ),
  AlertCircle: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
  ),
  Settings: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
  )
};

export default function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConfigValid || !auth) {
      toast({ 
        title: "Configuration Error", 
        description: "Firebase credentials are missing or invalid.", 
        variant: "destructive" 
      });
      return;
    }

    setIsLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        toast({ title: "Welcome back!", description: "Successfully logged in." });
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        if (username) {
          await updateProfile(userCredential.user, { displayName: username });
        }
        toast({ title: "Account created!", description: "Start tapping to earn." });
      }
    } catch (error: any) {
      toast({ 
        title: "Authentication Failed", 
        description: error.message || "An error occurred during authentication.", 
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] w-full px-4 py-8">
      {!isConfigValid && (
        <div className="w-full max-w-md mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-800 rounded-r-lg shadow-md">
          <div className="flex items-start space-x-3">
            <div className="mt-0.5 shrink-0 text-red-500">
              <Icons.AlertCircle />
            </div>
            <div>
              <p className="font-bold text-sm">Critical: Missing Configuration</p>
              <p className="text-xs mb-2">The following environment variables are not set or contain placeholder text:</p>
              <ul className="list-disc list-inside text-[10px] font-mono bg-white/50 p-2 rounded">
                {missingKeys.map(key => (
                  <li key={key}>NEXT_PUBLIC_FIREBASE_{key.toUpperCase().replace(/([A-Z])/g, '_$1')}</li>
                ))}
              </ul>
              <div className="mt-3 flex items-center text-xs font-semibold">
                <Icons.Settings />
                <span>Set these in Vercel Settings > Environment Variables.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <Card className="w-full max-w-md shadow-2xl border-t-4 border-t-primary rounded-2xl">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <div className="p-3 bg-primary/10 rounded-full text-primary">
              <Icons.Coins />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">
            {isLogin ? 'Login to TapBoost' : 'Join TapBoost'}
          </CardTitle>
          <CardDescription>
            {isLogin ? 'Enter your details to resume earning' : 'Create an account to start earning real USD'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input 
                  id="username" 
                  placeholder="CoolTapper" 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)} 
                  required={!isLogin}
                  disabled={isLoading || !isConfigValid}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="you@example.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                disabled={isLoading || !isConfigValid}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                disabled={isLoading || !isConfigValid}
              />
            </div>
            <Button type="submit" className="w-full h-12 font-bold text-lg" disabled={isLoading || !isConfigValid}>
              {isLoading ? 'Processing...' : (isLogin ? <><Icons.LogIn /> Login</> : <><Icons.UserPlus /> Sign Up</>)}
            </Button>
          </form>
          
          <div className="mt-6 text-center text-sm">
            <button 
              onClick={() => setIsLogin(!isLogin)} 
              className="text-primary hover:underline font-medium"
              disabled={isLoading || !isConfigValid}
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Login"}
            </button>
          </div>
        </CardContent>
      </Card>
      
      <p className="mt-8 text-center text-xs text-muted-foreground max-w-xs leading-relaxed">
        Your privacy is protected. We use Firebase Authentication to ensure your earnings are secure.
      </p>
    </div>
  );
}
