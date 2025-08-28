import './App.css';
import { Routes, Route, Navigate } from 'react-router-dom';
import Header from './Component/layout/Header';
import Footer from './Component/layout/Footer';
import HomePage from './Component/Home/HomePage';
import Login from './Component/User/Login';
import Register from './Component/User/Register';
import CategoriesPage from './Component/Home/CategoriesPage';
import TagsPage from './Component/Home/TagsPage';
import GameDetail from './Component/Home/GameDetail';
import CartPage from './Component/Home/CartPage';
import CheckoutPage from './Component/Home/CheckoutPage';
import ThankYouPage from './Component/Home/ThankYouPage';

function App() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#171a21' }}>
      <Header />

      <div className="main-container">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/categories/:id" element={<CategoriesPage />} />
          <Route path="/tags" element={<TagsPage />} />
          <Route path="/games/:id" element={<GameDetail />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/thank-you" element={<ThankYouPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      <Footer />
    </div>
  );
}

export default App;
