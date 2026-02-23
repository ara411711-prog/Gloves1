/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { InventoryProvider } from './context/InventoryContext';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Products } from './pages/Products';
import { Transactions } from './pages/Transactions';
import { Entities } from './pages/Entities';
import { EntityDetails } from './pages/EntityDetails';
import { Reports } from './pages/Reports';

export default function App() {
  return (
    <InventoryProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="products" element={<Products />} />
            <Route path="transactions" element={<Transactions />} />
            <Route path="entities" element={<Entities />} />
            <Route path="entities/:id" element={<EntityDetails />} />
            <Route path="reports" element={<Reports />} />
          </Route>
        </Routes>
      </Router>
    </InventoryProvider>
  );
}
