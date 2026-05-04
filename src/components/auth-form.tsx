
"use client";

import React, { useState } from 'react';
import { auth } from '@/lib/firebase';
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
import { Coins, LogIn, UserPlus } from 'lucide-react';

export default function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    
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
        description: error.message, 
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] w-full px-4">
      <Card className="w-full max-w-md shadow-2xl border-t-4 border-t-primary rounded-2xl">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <div className="p-3 bg-primary/10 rounded-full">
              <Coins className="w-10 h-10 text-primary" />
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
              />
            </div>
            <Button type="submit" className="w-full h-12 font-bold text-lg" disabled={isLoading}>
              {isLoading ? 'Processing...' : (isLogin ? <><LogIn className="mr-2 h-5 w-5" /> Login</> : <><UserPlus className="mr-2 h-5 w-5" /> Sign Up</>)}
            </Button>
          </form>
          
          <div className="mt-6 text-center text-sm">
            <button 
              onClick={() => setIsLogin(!isLogin)} 
              className="text-primary hover:underline font-medium"
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
