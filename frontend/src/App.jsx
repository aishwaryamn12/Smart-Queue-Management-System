import { BrowserRouter, Routes, Route } from "react-router-dom";

import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import AdminPage from "./pages/AdminPage";

import RegisterPage from "./pages/RegisterPage";
import CustomerLogin from "./pages/CustomerLogin";
import ForgotPassword from "./pages/ForgotPassword";

import CustomerPage from "./pages/CustomerPage";
import StatusPage from "./pages/StatusPage";

import AdminLogin from "./AdminLogin";
import AdminDashboard from "./AdminDashboard";


function App() {

    return (

        <BrowserRouter>

            <Routes>

                {/* ================= HOME ================= */}

                <Route
                    path="/"
                    element={<HomePage />}
                />


                {/* ================= CUSTOMER ================= */}

                <Route
                    path="/login"
                    element={<LoginPage />}
                />

                <Route
                    path="/register"
                    element={<RegisterPage />}
                />

                <Route
                    path="/customer-login"
                    element={<CustomerLogin />}
                />

                <Route
                    path="/forgot-password"
                    element={<ForgotPassword />}
                />

                <Route
                    path="/customer"
                    element={<CustomerPage />}
                />

                <Route
                    path="/status/:tokenNo"
                    element={<StatusPage />}
                />


                {/* ================= ADMIN ================= */}

                <Route
                    path="/admin-login"
                    element={<AdminLogin />}
                />

                <Route
                    path="/admin-dashboard"
                    element={<AdminDashboard />}
                />

                {/* Existing Admin Page */}

                <Route
                    path="/admin"
                    element={<AdminPage />}
                />

            </Routes>

        </BrowserRouter>

    );
}

export default App;