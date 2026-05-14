import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { BrowserRouter } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { AuthProvider } from './contexts/AuthContext.jsx';

import 'react-toastify/dist/ReactToastify.css';

createRoot(document.getElementById('root')).render(
  <AuthProvider>
    <ToastContainer />
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </AuthProvider>  // 👈 sửa ở đây
);