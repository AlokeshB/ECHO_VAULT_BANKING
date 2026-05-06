import { createContext, useContext, useState, module } from 'react';

const LayoutContext = createContext();

export const LayoutProvider = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved ? saved === 'true' : false;
  });

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const newState = !prev;
      localStorage.setItem('sidebarCollapsed', newState);
      return newState;
    });
  };

  const collapseSidebar = () => {
    setSidebarCollapsed(true);
    localStorage.setItem('sidebarCollapsed', 'true');
  };

  const expandSidebar = () => {
    setSidebarCollapsed(false);
    localStorage.setItem('sidebarCollapsed', 'false');
  };

  return (
    <LayoutContext.Provider
      value={{
        sidebarCollapsed,
        toggleSidebar,
        collapseSidebar,
        expandSidebar,
      }}
    >
      {children}
    </LayoutContext.Provider>
  );
};

export const useLayout = () => {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayout must be used within LayoutProvider');
  }
  return context;
};

export default {
  LayoutProvider,
  useLayout,
};