import React, { createContext, useContext, useState } from 'react';

const LocaleContext = createContext();

export const LocaleProvider = ({ children }) => {
  const [locale, setLocale] = useState(() => {
    return localStorage.getItem('locale') || 'en-IN';
  });

  const [dateFormat, setDateFormat] = useState(() => {
    return localStorage.getItem('dateFormat') || 'DD/MM/YYYY';
  });

  const [currencyFormat, setCurrencyFormat] = useState(() => {
    return localStorage.getItem('currencyFormat') || 'INR';
  });

  const changeLocale = (newLocale) => {
    setLocale(newLocale);
    localStorage.setItem('locale', newLocale);
  };

  const changeDateFormat = (format) => {
    setDateFormat(format);
    localStorage.setItem('dateFormat', format);
  };

  const changeCurrencyFormat = (format) => {
    setCurrencyFormat(format);
    localStorage.setItem('currencyFormat', format);
  };

  return (
    <LocaleContext.Provider
      value={{
        locale,
        changeLocale,
        dateFormat,
        changeDateFormat,
        currencyFormat,
        changeCurrencyFormat,
      }}
    >
      {children}
    </LocaleContext.Provider>
  );
};

export const useLocale = () => {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used within LocaleProvider');
  }
  return context;
};
