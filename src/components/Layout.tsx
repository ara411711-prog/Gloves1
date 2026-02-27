import React from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Home, Package, ArrowRightLeft, Users, FileText } from 'lucide-react';
import { motion } from 'motion/react';
import { useAndroidBack } from '../hooks/useAndroidBack';

export const Layout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  useAndroidBack(() => {
    const path = location.pathname;
    
    // إذا كان في الرئيسية، اترك الأندرويد يتعامل مع زر الرجوع (للخروج من التطبيق)
    if (path === '/') {
      return false;
    }
    
    // إذا كان في أحد التبويبات الرئيسية، ارجع للرئيسية
    if (['/products', '/transactions', '/entities', '/reports'].includes(path)) {
      navigate('/');
      return true;
    }
    
    // إذا كان داخل تفاصيل جهة، ارجع لصفحة الجهات
    if (path.startsWith('/entities/')) {
      navigate('/entities');
      return true;
    }
    
    // أي صفحة أخرى
    navigate(-1);
    return true;
  }, true);

  const navItems = [
    { to: '/', icon: Home, label: 'الرئيسية' },
    { to: '/products', icon: Package, label: 'المنتجات' },
    { to: '/transactions', icon: ArrowRightLeft, label: 'العمليات' },
    { to: '/entities', icon: Users, label: 'الجهات' },
    { to: '/reports', icon: FileText, label: 'التقارير' },
  ];

  return (
    <div className="h-[100dvh] w-full bg-slate-950 text-slate-100 font-sans overflow-hidden flex flex-col" dir="rtl">
      {/* Main Content Area */}
      <main className="flex-1 w-full relative bg-slate-950 overflow-hidden">
        <div className="h-full w-full">
          <Outlet />
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="absolute bottom-0 left-0 right-0 z-40 pb-safe px-4 mb-4 pointer-events-none">
        <div className="glass-panel rounded-3xl mx-auto max-w-md pointer-events-auto">
          <ul className="flex justify-between items-center h-16 px-2">
            {navItems.map((item) => (
              <li key={item.to} className="flex-1 h-full">
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `relative flex flex-col items-center justify-center w-full h-full space-y-1 transition-all duration-300 active:scale-90 ${
                      isActive ? 'text-sky-400' : 'text-slate-400 hover:text-slate-200'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <motion.div
                          layoutId="nav-pill"
                          className="absolute inset-0 bg-sky-500/10 rounded-2xl"
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        />
                      )}
                      <item.icon className={`w-5 h-5 z-10 ${isActive ? 'drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]' : ''}`} strokeWidth={isActive ? 2.5 : 2} />
                      <span className="text-[10px] font-medium z-10">{item.label}</span>
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </div>
  );
};
