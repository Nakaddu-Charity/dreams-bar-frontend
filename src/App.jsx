import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Sidebar from "./Components/Sidebar";
import Dashboard from "./Components/Dashboard";
import Bookings from "./Components/Bookings";
import Garden from "./Components/Garden";
import Inventory from "./Components/Inventory";
import Menu from "./Components/Menu";
import Reports from "./Components/Reports";
import Rooms from "./Components/Rooms";
import Customers from "./Components/Customers";
import Staff from "./Components/Staff";
import Login from "./Components/Login";
import NotFound from "./Components/NotFound";

function App() {
  return (
    <Router>
      <div className="app-container">
        {/* Sidebar Section */}
        <aside className="sidebar">
          <Sidebar />
        </aside>

        {/* Main Content Section */}
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/bookings" element={<Bookings />} />
            <Route path="/garden" element={<Garden />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/menu" element={<Menu />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/rooms" element={<Rooms />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/staff" element={<Staff />} />
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
