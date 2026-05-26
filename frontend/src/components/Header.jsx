import React, { useState, useEffect } from 'react';
import { Layers, Sun, Moon } from 'lucide-react';

export const Header = () => {
  const [isDark, setIsDark] = useState(false);

  // Initialize theme from system preference or localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDark(true);
      document.body.classList.add('dark-mode');
    } else {
      setIsDark(false);
      document.body.classList.remove('dark-mode');
    }
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      document.body.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  };

  return (
    <header className="app-header glass-panel">
      <div className="brand">
        <Layers className="brand-logo" />
        <div>
          <h1>DeskFlow</h1>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '-0.2rem' }}>
            Support Ticket Triage Board
          </p>
        </div>
      </div>
      
      <div className="header-actions">
        <button 
          onClick={toggleTheme} 
          className="theme-toggle-btn"
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          aria-label="Toggle theme"
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
    </header>
  );
};

export default Header;
