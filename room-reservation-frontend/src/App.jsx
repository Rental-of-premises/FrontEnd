import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import Catalog from './pages/Catalog';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CreateRoom from './pages/CreateRoom';
import MyBookings from './pages/MyBookings';
import RoomDetails from './pages/RoomDetails';
import BookingForm from './pages/BookingForm';
import Settings from './pages/Settings';
import MyRooms from './pages/MyRooms';
import EditRoom from './pages/EditRoom';
import Reviews from './pages/Reviews';
import ConfirmEmail from './pages/ConfirmEmail';

// Компонент-обертка для проверки авторизации
function AuthChecker() {
  const { user, logout } = useAuth();

  useEffect(() => {
    const checkAuth = async () => {
      if (localStorage.getItem('user')) {
        try {
          const response = await fetch('https://team3.verstack.ru/api/account/my-apartments', {
            credentials: 'include',
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (response.status === 401) {
            localStorage.removeItem('user');
            if (!window.location.pathname.includes('/login') && 
                !window.location.pathname.includes('/register')) {
              window.location.href = '/login';
            }
          }
        } catch (error) {
          console.error('Ошибка проверки авторизации:', error);
        }
      }
    };

    checkAuth();
  }, []);

  return null;
}

function AppContent() {
  return (
    <Routes>
      <Route path="/" element={<Catalog />} />
      <Route path="/catalog" element={<Catalog />} />
      <Route path="/catalog/:id" element={<RoomDetails />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/confirm-email" element={<ConfirmEmail />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/create-room" element={<CreateRoom />} />
      <Route path="/my-bookings" element={<MyBookings />} />
      <Route path="/booking/:id" element={<BookingForm />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/my-rooms" element={<MyRooms />} />
      <Route path="/edit-room/:id" element={<EditRoom />} />
      <Route path="/reviews/:id" element={<Reviews />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthChecker />
      <AppContent />
    </BrowserRouter>
  );
}

export default App;