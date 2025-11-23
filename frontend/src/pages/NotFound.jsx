import React from 'react';
import GuestLayout from '../layouts/GuestLayout';

const NotFound = () => (
  <GuestLayout>
    <div className="p-10 text-center">
      <h1 className="text-3xl font-bold">404 Not Found</h1>
      <p>The page you are looking for does not exist.</p>
    </div>
  </GuestLayout>
);

export default NotFound;
