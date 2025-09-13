import React, { useState, useEffect } from 'react';
import { Login } from './components/Login';
import { Register } from './components/Register';
import  UserHome  from './components/UserHome';
import { AdminHome } from './components/AdminHome';

type User = {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
};

type AuthState = 'login' | 'register' | 'authenticated';

export default function App() {
  const [authState, setAuthState] = useState<AuthState>('login');
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    // Initialize demo data if not exists
    if (!localStorage.getItem('users')) {
      const demoUsers = [
        {
          id: '1',
          email: 'user@demo.com',
          password: 'password123',
          name: 'Demo User',
          isAdmin: false
        },
        {
          id: '2',
          email: 'admin@demo.com',
          password: 'admin123',
          name: 'Admin User',
          isAdmin: true
        }
      ];
      localStorage.setItem('users', JSON.stringify(demoUsers));
    }

    if (!localStorage.getItem('reports')) {
      const demoReports = [
        {
          id: '1',
          userId: '1',
          title: 'Large Pothole on Main Street',
          description: 'Deep pothole causing damage to vehicles. Located near the traffic signal.',
          category: 'pothole',
          imageUrl: 'https://images.unsplash.com/photo-1709934730506-fba12664d4e4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb3Rob2xlJTIwcm9hZCUyMGRhbWFnZXxlbnwxfHx8fDE3NTc2OTYyMDd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
          location: {
            latitude: 28.6139,
            longitude: 77.2090,
            address: 'Main Street, Near Traffic Signal',
            village: 'Central Delhi',
            district: 'New Delhi',
            pincode: '110001',
            state: 'Delhi'
          },
          status: 'pending' as const,
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '2',
          userId: '1',
          title: 'Streetlight Not Working',
          description: 'Street light has been non-functional for over a week, making the area unsafe at night.',
          category: 'streetlight',
          imageUrl: 'https://images.unsplash.com/photo-1742119193536-7d228ef7f466?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxicm9rZW4lMjBzdHJlZXRsaWdodHxlbnwxfHx8fDE3NTc2MTI0ODR8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
          location: {
            latitude: 28.6129,
            longitude: 77.2295,
            address: 'Park Road, Sector 5',
            village: 'Sector 5',
            district: 'New Delhi',
            pincode: '110001',
            state: 'Delhi'
          },
          status: 'in-progress' as const,
          timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          assignedTo: 'Admin User',
          department: 'Public Works'
        }
      ];
      localStorage.setItem('reports', JSON.stringify(demoReports));
    }

    // Check if user is already logged in
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
      setAuthState('authenticated');
    }
  }, []);

  const handleLogin = (email: string, password: string) => {
    // Mock login - in real app, this would authenticate with backend
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find((u: any) => u.email === email && u.password === password);
    
    if (user) {
      const { password: _, ...userWithoutPassword } = user;
      setCurrentUser(userWithoutPassword);
      localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
      setAuthState('authenticated');
      return true;
    }
    return false;
  };

  const handleRegister = (email: string, password: string, name: string, isAdmin: boolean) => {
    // Mock registration
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const newUser = {
      id: Date.now().toString(),
      email,
      password,
      name,
      isAdmin
    };
    
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    const { password: _, ...userWithoutPassword } = newUser;
    setCurrentUser(userWithoutPassword);
    localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
    setAuthState('authenticated');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    setAuthState('login');
  };

  if (authState === 'login') {
    return (
      <Login
        onLogin={handleLogin}
        onSwitchToRegister={() => setAuthState('register')}
      />
    );
  }

  if (authState === 'register') {
    return (
      <Register
        onRegister={handleRegister}
        onSwitchToLogin={() => setAuthState('login')}
      />
    );
  }

  if (authState === 'authenticated' && currentUser) {
    return currentUser.isAdmin ? (
      <AdminHome user={currentUser} onLogout={handleLogout} />
    ) : (
      <UserHome user={currentUser} onLogout={handleLogout} />
    );
  }

  return null;
}