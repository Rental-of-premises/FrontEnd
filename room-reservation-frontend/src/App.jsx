import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Catalog from './pages/Catalog'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import CreateRoom from './pages/CreateRoom'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Catalog />} />
        <Route path="/catalog" element={<Catalog />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/create-room" element={<CreateRoom />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App