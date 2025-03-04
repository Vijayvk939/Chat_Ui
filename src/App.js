import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Auth/login";
import Signup from "./pages/Auth/signup";
import Dashboard from "./pages/Dashboard/dashboard";
import ProtectedRoute from "./ProtectedRoute";
import "./App.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} /> 
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
