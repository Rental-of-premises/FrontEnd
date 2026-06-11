// src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Catalog from './pages/Catalog';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CreateRoom from './pages/CreateRoom';
import MyBookings from './pages/MyBookings';
import RoomDetails from './pages/RoomDetails';
import BookingForm from './pages/BookingForm';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Catalog />} />
        <Route path="/catalog" element={<Catalog />} />
        <Route path="/catalog/:id" element={<RoomDetails />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/create-room" element={<CreateRoom />} />
        <Route path="/my-bookings" element={<MyBookings />} />
        <Route path="/booking/:id" element={<BookingForm />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;