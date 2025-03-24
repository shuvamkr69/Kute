import React, { createContext, useContext, useState } from 'react';

type RegistrationData = {
  email?: string;
  password?: string;
  name?: string;
  age?: string;
  gender?: string;
  location?: string;
  bio?: string;
  photos?: string[];
};

type RegistrationContextType = {
  data: RegistrationData;
  updateData: (newData: Partial<RegistrationData>) => void;
  clearData: () => void;
};

const RegistrationContext = createContext<RegistrationContextType | undefined>(undefined);

export const RegistrationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<RegistrationData>({});

  const updateData = (newData: Partial<RegistrationData>) => {
    setData((prev) => ({ ...prev, ...newData }));
  };

  const clearData = () => setData({});

  return (
    <RegistrationContext.Provider value={{ data, updateData, clearData }}>
      {children}
    </RegistrationContext.Provider>
  );
};

export const useRegistration = () => {
  const context = useContext(RegistrationContext);
  if (!context) {
    throw new Error('useRegistration must be used within a RegistrationProvider');
  }
  return context;
};
