import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const GuestLayout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Header /> {/* Common header with search, login/signup buttons */}
      <main className="flex-grow">{children}</main>
      <Footer /> 
      
    </div>
  );
};

export default GuestLayout;
