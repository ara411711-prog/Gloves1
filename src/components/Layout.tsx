import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Home, Package, ArrowRightLeft, Users, FileText } from 'lucide-react';

export const Layout: React.FC = () => {
  const navItems = [
    { to: '/', icon: Home, label: 'الرئيسية' },
    { to: '/products', icon: Package, label: 'المنتجات' },
    { to: '/transactions', icon: ArrowRightLeft, label: 'العمليات' },
    { to: '/entities', icon: Users, label: 'الجهات' },
    { to: '/reports', icon: FileText, label: 'التقارير' },
  ];

  return (
    <div className="h-screen w-full bg-slate-950 text-slate-100 font-sans overflow-hidden flex flex-col" dir="rtl">
      {/* Main Content Area */}
      <main className="flex-1 w-full h-full relative bg-slate-950 overflow-y-auto">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-slate-900 border-t border-slate-800 z-40 pb-safe shrink-0">
        <div className="w-full px-2">
          <ul className="flex justify-between items-center h-16">
            {navItems.map((item) => (
              <li key={item.to} className="flex-1 h-full">
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors active:scale-95 ${
                      isActive ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
                    }`
                  }
                >
                  <item.icon className="w-6 h-6" strokeWidth={2} />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </div>
  );
};
