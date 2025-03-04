import React, { useState } from "react";
import axios from "axios";
import { TextField, Button, Box, Typography, Paper, Snackbar, Alert, Link } from "@mui/material";
import { useNavigate } from "react-router-dom";
import logoe from "../../assets/logoe.png";

const Login = () => {
    const [email, setEmail] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [loading, setLoading] = useState(false);

    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

    const navigate = useNavigate();

    const handleLogin = async () => {
        setLoading(true);

        try {
            const response = await axios.post("http://localhost:3000/v1/users/login", { email, phoneNumber });
            const { user, access_token } = response.data;

            localStorage.setItem("userDetails", JSON.stringify({ user, access_token }));
            setSnackbar({ open: true, message: "Login successful!", severity: "success" });

            setTimeout(() => navigate("/dashboard"), 1000);
        } catch (error) {
            const errorMessage = error.response?.data?.message || "Login failed. Please try again.";
            setSnackbar({ open: true, message: errorMessage, severity: "error" });
        } finally {
            setLoading(false);
        }
    };



    return (
        <Box
            sx={{
                width: "100vw",
                height: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#8BABD8",
            }}
        >
            <Paper
                elevation={3}
                sx={{
                    width: 400,
                    p: 7,
                    borderRadius: 2,
                    textAlign: "center",
                    background: "rgba(255, 255, 255)",
                    backdropFilter: "blur(10px)",
                }}
            >
                <Box sx={{ mb: 2 }}>
                    <img src={logoe} alt="Chat Logo" width={200} />
                </Box>
                <TextField fullWidth label="Email" variant="outlined" margin="normal" value={email} onChange={(e) => setEmail(e.target.value)} />
                <TextField fullWidth label="Phone Number" variant="outlined" margin="normal" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
                <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    sx={{ mt: 2, backgroundColor: "#6E80A4" }}
                    onClick={handleLogin}
                >
                    Sign in
                </Button>
                <Typography variant="body2" sx={{ mt: 2 }}>
                    Don't have an account?{" "}
                    <Link href="/signup" sx={{ color: "#6E80A4", cursor: "pointer" }}>
                        Create a new account
                    </Link>
                </Typography>
            </Paper>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: "top", horizontal: "right" }}
            >
                <Alert
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    severity={snackbar.severity}
                    sx={{ width: "100%" }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default Login;
