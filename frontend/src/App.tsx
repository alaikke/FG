import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Checkout } from './pages/Checkout';
import { PaymentPix } from './pages/PaymentPix';
import { TrackOrder } from './pages/TrackOrder';
import { Growth } from './pages/Growth';
import { Success } from './pages/Success';
import { AdminDashboard } from './pages/AdminDashboard';
import { Blog } from './pages/Blog';
import { BlogPost } from './pages/BlogPost';
import { Terms } from './pages/Terms';
import { Privacy } from './pages/Privacy';
import { HelpCenter } from './pages/HelpCenter';
import { WhatsApp } from './pages/WhatsApp';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        {/* Admin - fora do layout público */}
        <Route path="/din" element={<AdminDashboard />} />
        
        {/* Site público */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Growth />} />
          <Route path="precos" element={<Home />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="payment/pix" element={<PaymentPix />} />
          <Route path="track" element={<TrackOrder />} />
          <Route path="success" element={<Success />} />
          <Route path="blog" element={<Blog />} />
          <Route path="blog/:slug" element={<BlogPost />} />
          <Route path="termos" element={<Terms />} />
          <Route path="privacidade" element={<Privacy />} />
          <Route path="ajuda" element={<HelpCenter />} />
          <Route path="whatsapp" element={<WhatsApp />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
