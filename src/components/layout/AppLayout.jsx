// src/components/layout/AppLayout.jsx
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import MainMenu from '../MainMenu';
import Logo from '../Logo';

export default function AppLayout() {
  return (
    <div className='min-h-dvh flex flex-col'>
      <Header>
        <MainMenu>
          <Logo />
        </MainMenu>
      </Header>
      <main className='flex-1'>
        <Outlet /> {/* children routes render here */}
      </main>
      <Footer />
    </div>
  );
}
