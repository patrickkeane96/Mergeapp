"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/supabase';

// Define user type
export type User = {
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string;
};

// Context type definition
export type UserContextType = {
  currentUser: User | null;
  users: User[];
  isLoading: boolean;
  switchUser: (userId: string) => void;
  fetchUsers: () => Promise<void>;
};

// Create context with default values
const UserContext = createContext<UserContextType>({
  currentUser: null,
  users: [],
  isLoading: true,
  switchUser: () => {},
  fetchUsers: async () => {},
});

// Sample users for development
const sampleUsers: User[] = [
  {
    id: '1',
    name: 'John Smith',
    email: 'john.smith@example.com',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
  },
  {
    id: '2',
    name: 'Jane Doe',
    email: 'jane.doe@example.com',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jane',
  },
  {
    id: '3',
    name: 'Alex Johnson',
    email: 'alex.johnson@example.com',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
  },
];

// Provider component
export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch users from Supabase
  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      
      // Try to fetch users from Supabase
      const { data, error } = await supabase
        .from('users')
        .select('*');
      
      if (error) {
        console.error('Error fetching users:', error);
        // Fall back to sample users if there's an error
        setUsers(sampleUsers);
        if (!currentUser && sampleUsers.length > 0) {
          setCurrentUser(sampleUsers[0]);
        }
      } else if (data && data.length > 0) {
        // Map Supabase data to User type
        const mappedUsers: User[] = data.map(user => ({
          id: user.id,
          name: user.name,
          email: user.email,
          avatarUrl: user.avatar_url,
        }));
        
        setUsers(mappedUsers);
        
        // Set current user if not already set
        if (!currentUser && mappedUsers.length > 0) {
          setCurrentUser(mappedUsers[0]);
        }
      } else {
        // Fall back to sample users if no users in database
        setUsers(sampleUsers);
        if (!currentUser && sampleUsers.length > 0) {
          setCurrentUser(sampleUsers[0]);
        }
      }
    } catch (error) {
      console.error('Error in fetchUsers:', error);
      // Fall back to sample users
      setUsers(sampleUsers);
      if (!currentUser && sampleUsers.length > 0) {
        setCurrentUser(sampleUsers[0]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Switch to a different user
  const switchUser = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setCurrentUser(user);
      // Save current user ID to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('currentUserId', userId);
      }
    }
  };

  // Load initial data
  useEffect(() => {
    // Try to get current user ID from localStorage
    const savedUserId = typeof window !== 'undefined' ? localStorage.getItem('currentUserId') : null;
    
    fetchUsers().then(() => {
      // If we have a saved user ID, try to set that user as current
      if (savedUserId) {
        const savedUser = users.find(u => u.id === savedUserId);
        if (savedUser) {
          setCurrentUser(savedUser);
        }
      }
    });
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchUsers();

    // Set up polling interval
    const interval = setInterval(() => {
      if (users.length === 0) {
        fetchUsers();
      }
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(interval);
  }, [fetchUsers, users]);

  // Context value
  const value = {
    currentUser,
    users,
    isLoading,
    switchUser,
    fetchUsers,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

// Custom hook for using the user context
export const useUser = () => useContext(UserContext); 