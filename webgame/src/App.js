import './App.css';
import { Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './Component/Home/HomePage';
import Login from './Component/User/Login';
import Register from './Component/User/Register';

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
