import React, { createContext, useContext, ReactNode } from 'react';

interface UserContextType {
  userData: any;
  loading: boolean;
  error: any;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  userData: any;
  loading: boolean;
  error: any;
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ userData, loading, error, children }) => {
  const contextValue: UserContextType = {
    userData,
    loading,
    error,
  };

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export default UserContext;