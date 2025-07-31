
'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import type { Player, AuthContextType } from '@/types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (!user) {
        setPlayer(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (user) {
      const playerDocRef = doc(db, 'players', user.uid);
      const unsubscribePlayer = onSnapshot(playerDocRef, (doc) => {
        if (doc.exists()) {
          setPlayer(doc.data() as Player);
        } else {
          setPlayer(null); // No profile found for this user yet
        }
        setLoading(false);
      }, (error) => {
          console.error("Error fetching player profile:", error);
          setPlayer(null);
          setLoading(false);
      });
      return () => unsubscribePlayer();
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, player, loading, setPlayer }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
