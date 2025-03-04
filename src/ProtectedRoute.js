import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const userDetails = JSON.parse(localStorage.getItem("userDetails"));

  if (!userDetails || !userDetails.access_token) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
