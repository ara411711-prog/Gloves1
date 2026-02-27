/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { InventoryProvider } from './context/InventoryContext';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Products } from './pages/Products';
import { Entities } from './pages/Entities';
import { EntityDetails } from './pages/EntityDetails';
import { Reports } from './pages/Reports';
import { LowStock } from './pages/LowStock';

export default function App() {
  return (
    <InventoryProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="products" element={<Products />} />
            <Route path="entities" element={<Entities />} />
            <Route path="entities/:id" element={<EntityDetails />} />
            <Route path="reports" element={<Reports />} />
            <Route path="low-stock" element={<LowStock />} />
          </Route>
        </Routes>
      </Router>
    </InventoryProvider>
  );
}
