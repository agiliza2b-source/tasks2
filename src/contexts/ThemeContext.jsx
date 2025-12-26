import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('agiliza_theme') || 'dark';
  });

  useEffect(() => {
    const body = document.body;
    // Remove todas as classes de tema possíveis antes de adicionar a nova
    body.classList.remove('theme-light', 'theme-blue', 'theme-fume');
    
    if (theme !== 'dark') {
      body.classList.add(`theme-${theme}`);
    }
    
    localStorage.setItem('agiliza_theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};