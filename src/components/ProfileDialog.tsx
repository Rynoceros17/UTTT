
'use client';

import { useState, useEffect } from 'react';
import type { Player } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { auth } from '@/lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { db_firestore } from '@/lib/state';
import { useAuth } from '@/hooks/use-auth';
import { Camera, CircleUser, Crown, Shield, Swords } from 'lucide-react';

const COLORS = [
  '#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e',
  '#14b8a6', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#ec4899',
];

const ICONS = {
  Swords: <Swords />,
  Crown: <Crown />,
  Shield: <Shield />,
  Camera: <Camera />,
  CircleUser: <CircleUser />,
};

type IconName = keyof typeof ICONS;

interface ProfileDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  isEdit?: boolean;
}

export function ProfileDialog({ isOpen, onOpenChange, isEdit = false }: ProfileDialogProps) {
  const { player, setPlayer, user } = useAuth();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [icon, setIcon] = useState<IconName>('Swords');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  useEffect(() => {
    if (isOpen) {
      if (isEdit && player) {
        setName(player.name);
        setColor(player.color);
        setIcon(player.icon as IconName);
      } else {
        setName('');
        setColor(COLORS[Math.floor(Math.random() * COLORS.length)]);
        setIcon('Swords');
        setEmail('');
        setPassword('');
        setAuthMode('signin');
      }
    }
  }, [isOpen, isEdit, player]);

  const handleAuth = async () => {
    if (authMode === 'signup') {
      if (name.trim().length < 2) {
        toast({ title: 'Invalid Name', description: 'Name must be at least 2 characters.', variant: 'destructive' });
        return;
      }
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const newPlayer: Player = {
          uid: userCredential.user.uid,
          name: name.trim(),
          icon,
          color,
        };
        await db_firestore.players.save(newPlayer);
        setPlayer(newPlayer);
        onOpenChange(false);
        toast({ title: `Welcome, ${newPlayer.name}!` });
      } catch (error: any) {
        toast({ title: 'Sign-up Failed', description: error.message, variant: 'destructive' });
      }
    } else { // signin
      try {
        await signInWithEmailAndPassword(auth, email, password);
        onOpenChange(false);
        toast({ title: 'Signed in successfully!' });
      } catch (error: any) {
        toast({ title: 'Sign-in Failed', description: error.message, variant: 'destructive' });
      }
    }
  };

  const handleProfileUpdate = async () => {
    if (!user || !player) return;
    if (name.trim().length < 2) {
      toast({ title: 'Invalid Name', description: 'Name must be at least 2 characters.', variant: 'destructive' });
      return;
    }
    const updatedPlayer: Player = {
      ...player,
      name: name.trim(),
      icon,
      color,
    };
    await db_firestore.players.save(updatedPlayer);
    setPlayer(updatedPlayer);
    onOpenChange(false);
    toast({ title: 'Profile updated!' });
  };

  const renderAuthForm = () => (
    <>
      <DialogHeader>
        <DialogTitle>{authMode === 'signin' ? 'Sign In' : 'Create an Account'}</DialogTitle>
        <DialogDescription>
          {authMode === 'signin' ? 'Enter your credentials to sign in.' : 'Fill out the form to create your profile.'}
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {authMode === 'signup' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="name">Display Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your display name" />
            </div>
            <div className="space-y-2">
              <Label>Icon</Label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(ICONS).map(([name, IconComponent]) => (
                  <button
                    key={name}
                    className={cn(
                      'h-10 w-10 rounded-md border-2 flex items-center justify-center transition-transform hover:scale-110',
                      icon === name ? 'border-ring bg-accent' : 'border-transparent bg-muted'
                    )}
                    onClick={() => setIcon(name as IconName)}
                  >
                    {React.cloneElement(IconComponent, { className: "w-6 h-6" })}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((c) => (
                  <button key={c} className={cn('h-8 w-8 rounded-full border-2 transition-transform hover:scale-110', color === c ? 'border-ring' : 'border-transparent')} style={{ backgroundColor: c }} onClick={() => setColor(c)} />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
      <DialogFooter className="sm:justify-between">
        <Button variant="ghost" onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}>
          {authMode === 'signin' ? 'Need an account?' : 'Already have an account?'}
        </Button>
        <Button onClick={handleAuth}>{authMode === 'signin' ? 'Sign In' : 'Sign Up'}</Button>
      </DialogFooter>
    </>
  );

  const renderEditProfileForm = () => (
    <>
      <DialogHeader>
        <DialogTitle>Edit Profile</DialogTitle>
        <DialogDescription>
          Update your display name, icon, and color.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="name">Display Name</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your display name" />
        </div>
        <div className="space-y-2">
          <Label>Icon</Label>
           <div className="flex flex-wrap gap-2">
              {Object.entries(ICONS).map(([name, IconComponent]) => (
                <button
                  key={name}
                  className={cn(
                    'h-10 w-10 rounded-md border-2 flex items-center justify-center transition-transform hover:scale-110',
                    icon === name ? 'border-ring bg-accent' : 'border-transparent bg-muted'
                  )}
                  onClick={() => setIcon(name as IconName)}
                >
                  {React.cloneElement(IconComponent, { className: "w-6 h-6" })}
                </button>
              ))}
            </div>
        </div>
        <div className="space-y-2">
          <Label>Color</Label>
          <div className="flex flex-wrap gap-2">
            {COLORS.map((c) => (
              <button key={c} className={cn('h-8 w-8 rounded-full border-2 transition-transform hover:scale-110', color === c ? 'border-ring' : 'border-transparent')} style={{ backgroundColor: c }} onClick={() => setColor(c)} />
            ))}
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
        <Button onClick={handleProfileUpdate}>Save Changes</Button>
      </DialogFooter>
    </>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        {isEdit ? renderEditProfileForm() : renderAuthForm()}
      </DialogContent>
    </Dialog>
  );
}
