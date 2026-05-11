import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Layout from './components/Layout';

import Home from './pages/Home';
import Chat from './pages/Chat';
import Settings from './pages/Settings';
import Minecraft from './pages/Minecraft';
import Documents from './pages/Documents';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Đường dẫn đăng nhập */}
        <Route path="/login" element={<Login />} />
        
        {/* Đường dẫn có bọc giao diện Layout */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/home" replace />} />
          <Route path="home" element={<Home />} />
          <Route path="chat" element={<Chat />} />
          <Route path="documents" element={<Documents />} />
          <Route path="minecraft" element={<Minecraft />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
