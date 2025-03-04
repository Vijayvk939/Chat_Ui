import React, { useState } from "react";
import axios from "axios";
import { TextField, Button, Box, Typography, Paper, Snackbar, Alert, Link } from "@mui/material";
import { useNavigate } from "react-router-dom";
import logoe from "../../assets/logoe.png";

const Signup = () => {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

    const navigate = useNavigate();

    const handleSignup = async () => {
        try {
            const response = await axios.post("http://localhost:3000/v1/users/signup", {
                firstName,
                lastName,
                email,
                phoneNumber,
            });

            console.log("Signup Success:", response.data);

            setSnackbar({ open: true, message: "Signup Successful! Redirecting to login...", severity: "success" });

            setTimeout(() => {
                navigate("/login");
            }, 2000);
        } catch (err) {
            console.error("Signup Error:", err);
            const errorMessage = err.response?.data?.error || "Signup failed. Please try again.";
            setSnackbar({ open: true, message: errorMessage, severity: "error" });
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
                <Typography variant="h5" mb={2}>Create New Account</Typography>
                <TextField fullWidth label="First Name" variant="outlined" margin="normal" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                <TextField fullWidth label="Last Name" variant="outlined" margin="normal" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                <TextField fullWidth label="Email" variant="outlined" margin="normal" value={email} onChange={(e) => setEmail(e.target.value)} />
                <TextField fullWidth label="Phone Number" variant="outlined" margin="normal" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
                <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    sx={{ mt: 2, backgroundColor: "#6E80A4" }}
                    onClick={handleSignup}
                >
                    Sign Up
                </Button>
                <Typography variant="body2" sx={{ mt: 2 }}>
                    Already have an account?{" "}
                    <Link href="/login" sx={{ color: "#6E80A4", fontWeight: "bold", cursor: "pointer" }}>
                        Sign in
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

export default Signup;
