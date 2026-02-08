import React from 'react';
import {BrowserRouter, Navigate, Route, Routes} from 'react-router-dom';
import {Toaster} from 'react-hot-toast';
import {AuthProvider} from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import TailorDashboardPage from './pages/TailorDashboardPage';
import CustomersPage from './pages/CustomersPage';
import OrdersPage from './pages/OrdersPage';
import MainLayout from './components/layout/MainLayout';
import MeasurementsPage from "./pages/MeasurementsPage";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import PaymentsPage from "./pages/PaymentsPage";
import UsersPage from "./pages/UsersPage";

function App() {
    return (
        <AuthProvider>

            <BrowserRouter>
                <Toaster position="top-right"/>
                <Routes>
                    <Route path="/login" element={<LoginPage/>}/>
                    <Route path="/" element={<ProtectedRoute><MainLayout/></ProtectedRoute>}>
                        <Route index element={<Navigate to="/dashboard" replace/>}/>
                        <Route path="dashboard" element={<DashboardPage/>}/>
                        <Route path="tailor-dashboard" element={<TailorDashboardPage/>}/>
                        <Route path="customers" element={<CustomersPage/>}/>
                        <Route path="orders" element={<OrdersPage/>}/>
                        <Route path="payments" element={<PaymentsPage/>}/>
                        <Route path="measurements" element={<MeasurementsPage/>}/>
                        <Route path="users" element={<UsersPage/>}/>
                    </Route>
                </Routes>
            </BrowserRouter>

        </AuthProvider>
    );
}

export default App;
