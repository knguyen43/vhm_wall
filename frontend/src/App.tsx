import React from 'react';
import { Routes, Route } from 'react-router-dom';

import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import NotFoundPage from './pages/NotFoundPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PersonsPage from './pages/PersonsPage';
import SearchPage from './pages/SearchPage';
import MemorialPage from './pages/MemorialPage';
import AdminPage from './pages/AdminPage';
import LocationsPage from './pages/LocationsPage';
import FamilyPage from './pages/FamilyPage';

const App: React.FC = () => {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/memorial/:personId" element={<MemorialPage />} />
        <Route path="/locations" element={<LocationsPage />} />
        <Route path="/family/:personId" element={<FamilyPage />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/persons"
          element={
            <ProtectedRoute>
              <PersonsPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Layout>
  );
};

export default App;
