import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { PixelTracker } from '../PixelTracker';

export const Layout: React.FC = () => {
  return (
    <>
      <PixelTracker />
      <Header />
      <div className="pt-20"> 
        {/* Main Content Area */}
        <Outlet />
      </div>
      <Footer />
    </>
  );
};
