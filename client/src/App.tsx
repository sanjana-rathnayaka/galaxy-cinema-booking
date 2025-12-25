import { BrowserRouter, Routes, Route } from 'react-router-dom';
import BookingPage from './pages/BookingPage';
import AdminPage from './pages/AdminPage'; // 1. අලුතින් import කරගත්තා

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Customer යන පාර (Home Page) */}
        <Route path="/" element={<BookingPage />} />
        
        {/* Admin යන පාර (දැන් වැඩ) */}
        <Route path="/admin" element={<AdminPage />} /> 
      </Routes>
    </BrowserRouter>
  );
}

export default App;