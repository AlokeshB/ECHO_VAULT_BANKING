import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import './styles.css'; // Consolidated styles file
import App from './App.jsx';
import store from './store/store';
import { ThemeProvider } from './context/ThemeContext';
import { LocaleProvider } from './context/LocaleContext';
import { LayoutProvider } from './context/LayoutContext';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <ThemeProvider>
          <LocaleProvider>
            <LayoutProvider>
              <App />
            </LayoutProvider>
          </LocaleProvider>
        </ThemeProvider>
      </BrowserRouter>
    </Provider>
  </StrictMode>
);
