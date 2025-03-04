import React, { useState, useEffect } from "react";
import axios from "axios";
import { Box, TextField, IconButton, Typography, Avatar, InputAdornment, CircularProgress } from "@mui/material";
import { Send, Search, Close, FiberManualRecord } from "@mui/icons-material";
import { Snackbar, Alert } from "@mui/material";
import { Done, DoneAll } from "@mui/icons-material";
import { motion } from "framer-motion";
import { ExitToApp } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import logoe1 from "../../assets/logoe1.png";
import io from "socket.io-client";

const socket = io("http://localhost:3001");

const ChatApp = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });
  const navigate = useNavigate(); // Initialize navigation

  const userDetails = JSON.parse(localStorage.getItem("userDetails"));
  const token = userDetails.access_token;

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get("http://localhost:3000/v1/getUsers", {
          headers: { Authorization: token },
        });

        const activeUsers = response.data.activeData || [];
        const filteredUsers = activeUsers.filter(user => user.id !== userDetails.user.id);

        const messagesResponse = await axios.get("http://localhost:3000/v1/getMessages", {
          headers: { Authorization: token },
        });

        const chatHistory = messagesResponse.data.chatHistory || [];

        const usersWithLatestMessages = filteredUsers.map(user => {
          const receivedMessages = chatHistory.filter(
            msg => msg.senderId === user.id && msg.receiverId === userDetails.user.id
          );

          receivedMessages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

          const latestMessage = receivedMessages.length > 0 ? receivedMessages[0] : null;

          // Count unread messages
          const unreadMessages = receivedMessages.filter(msg => !msg.isSeen).length;

          return {
            ...user,
            latestMessage: latestMessage ? latestMessage.content : "No messages yet",
            unreadCount: unreadMessages,
          };
        });

        setUsers(usersWithLatestMessages);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };


    fetchUsers();
  }, [token]);


  useEffect(() => {
    if (selectedUser) {
      fetchMessages();
    }
  }, [selectedUser]);

  const fetchMessages = async () => {
    try {
      const response = await axios.get("http://localhost:3000/v1/getMessages", {
        headers: { Authorization: token },
      });

      const chatHistory = response.data.chatHistory || [];
      const filteredMessages = chatHistory.filter(
        msg =>
          (msg.senderId === userDetails.user.id && msg.receiverId === selectedUser.id) ||
          (msg.senderId === selectedUser.id && msg.receiverId === userDetails.user.id)
      );

      setMessages(filteredMessages);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedUser || !message.trim()) {
      setSnackbar({ open: true, message: "Receiver and message are required.", severity: "warning" });
      return;
    }

    if (selectedUser.id === userDetails.user.id) {
      setSnackbar({ open: true, message: "You cannot send a message to yourself.", severity: "error" });
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:3000/v1/sendMessage",
        {
          senderId: userDetails.user.id,
          receiverId: selectedUser.id,
          content: message,
        },
        { headers: { Authorization: token } }
      );

      setMessages([...messages, response.data.data]);
      setMessage("");
      setSnackbar({ open: true, message: "Message sent!", severity: "success" });
      fetchMessages();
    } catch (error) {
      setSnackbar({ open: true, message: "Failed to send message.", severity: "error" });
    }
  };

  useEffect(() => {
    messages.forEach(async (msg) => {
      if (!msg.isSeen && msg.receiverId === userDetails.user.id) {
        await axios.put("http://localhost:3000/v1/markMessageSeen", {
          messageId: msg.id,
          receiverId: userDetails.user.id,
        });

        socket.emit("markMessageSeen", { messageId: msg.id, receiverId: userDetails.user.id });
      }
    });
  }, [messages]);


  useEffect(() => {
    socket.on("messageSeen", ({ messageId, senderId }) => {
      console.log(`Message ${messageId} seen by receiver`);
    });

    return () => socket.off("messageSeen");
  }, []);

  const handleLogout = () => {
    setSnackbar({
      open: true,
      message: `${userDetails.user.firstName} logged out successfully!`,
      severity: "success",
    });

    setTimeout(() => {
      localStorage.removeItem("userDetails");
      navigate("/login");
    }, 1500); // Delay to allow the Snackbar to show
  };

  useEffect(() => {
    socket.on("newMessage", ({ senderId }) => {
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === senderId ? { ...user, unreadCount: (user.unreadCount || 0) + 1 } : user
        )
      );
    });

    return () => socket.off("newMessage");
  }, []);


  const handleUserClick = async (user) => {
    setSelectedUser(user);

    // Mark messages as seen in the backend
    await axios.put("http://localhost:3000/v1/markMessagesSeen", {
      senderId: user.id,
      receiverId: userDetails.user.id,
    });

    // Update local state
    setUsers(users.map(u => u.id === user.id ? { ...u, unreadCount: 0 } : u));
  };



  return (
    <Box sx={{ width: "100vw", height: "100vh", backgroundColor: "#A9C6E8", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Box sx={{ width: "90%", height: "90vh", display: "flex", backgroundColor: "#fff", borderRadius: 1, overflow: "hidden" }}>

        {/* Sidebar */}
        <Box sx={{ width: "25%", borderRight: "2px solid #D9DCE0", padding: 2 }}>
          <img src={logoe1} alt="Chat Logo" width={100} />
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search"
            sx={{
              mt: 2,
              mb: 2,
              backgroundColor: "#f5f5f5",
              borderRadius: "25px",
              "& .MuiOutlinedInput-root": {
                borderRadius: "25px",
                padding: "7px",
                fontSize: "14px",
                minHeight: "30px",
                "& fieldset": { border: "none" },
              },
              "& .MuiInputBase-input": {
                padding: "6px 12px",
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search color="disabled" />
                </InputAdornment>
              ),
            }}
          />

          {/* Chat List */}
          <Box>
            {loading ? (
              <CircularProgress size={24} />
            ) : users.length > 0 ? (
              users.map((user) => (
                <Box key={user.id}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    padding: 1,
                    borderRadius: 1,
                    cursor: "pointer",
                    ":hover": { backgroundColor: "#f5f5f5" },
                    position: "relative"
                  }}
                  onClick={() => {
                    setSelectedUser(user);
                    axios.put("http://localhost:3000/v1/markMessagesSeen", {
                      senderId: user.id,
                      receiverId: userDetails.user.id,
                    }).then(() => {
                      setUsers(users.map(u => u.id === user.id ? { ...u, unreadCount: 0 } : u));
                    }).catch(err => console.error("Error marking messages as seen:", err));
                  }}
                >
                  <Avatar sx={{ marginRight: 2, backgroundColor: "#6E80A4" }}>
                    {user.firstName.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography fontWeight="bold">{user.firstName} {user.lastName}</Typography>
                    <Typography variant="body2" color="gray">
                      {user.latestMessage}
                    </Typography>
                  </Box>

                  {user.unreadCount > 0 && (
                    <Box
                      sx={{
                        position: "absolute",
                        right: 10,
                        top: "70%",
                        transform: "translateY(-50%)",
                        backgroundColor: "#3758F9",
                        color: "white",
                        borderRadius: "50%",
                        width: 20,
                        height: 20,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "12px",
                      }}
                    >
                      {user.unreadCount}
                    </Box>
                  )}
                </Box>
              ))
            ) : (
              <Typography>No users found</Typography>
            )}
          </Box>


        </Box>

        {/* Chat Window */}
        <Box sx={{ width: "75%", display: "flex", flexDirection: "column", backgroundColor: "#F2F2F2", position: "relative" }}>
          {/* Chat Header */}
          {selectedUser ? (
            <Box
              sx={{
                padding: 2,
                borderBottom: "2px solid #D9DCE0",
                display: "flex",
                alignItems: "center",
                backgroundColor: "#fff",
                justifyContent: "space-between",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Avatar onClick={() => setDrawerOpen(true)} sx={{ marginRight: 2, backgroundColor: "#6E80A4", cursor: "pointer" }}>
                  {selectedUser.firstName.charAt(0)}
                </Avatar>
                <Box>
                  <Typography fontWeight="bold">
                    {selectedUser.firstName} {selectedUser.lastName}
                  </Typography>
                  {/* <Typography variant="body2" color="gray">{selectedUser.email}</Typography> */}
                </Box>
              </Box>

              <Box>
                <IconButton
                  onClick={() => {
                    setSelectedUser(null);
                    setMessages([]); // Clear messages when closing the chat
                  }}
                  title="Close Chat"
                >
                  <Close sx={{ color: "gray" }} />
                </IconButton>

                <IconButton onClick={handleLogout} title="Logout">
                  <ExitToApp sx={{ color: "red" }} />
                </IconButton>
              </Box>
            </Box>
          ) : (
            <Box
              sx={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                color: "gray",
                position: "relative",
              }}
            >
              <IconButton
                onClick={handleLogout}
                title="Logout"
                sx={{
                  position: "absolute",
                  top: 10,
                  right: 10,
                }}
              >
                <ExitToApp sx={{ color: "red" }} />
              </IconButton>

              <Typography variant="h5" fontWeight="bold">Welcome to ChatApp</Typography>
              <Typography variant="body1">Select a user from the list to start chatting.</Typography>
            </Box>
          )}


          {/* Profile Drawer */}
          {drawerOpen && selectedUser && (
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                height: "100%",
                width: "40%",
                backgroundColor: "#fff",
                boxShadow: "-2px 0px 10px rgba(0,0,0,0.1)",
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <IconButton sx={{ alignSelf: "flex-start" }} onClick={() => setDrawerOpen(false)}>
                <Close />
              </IconButton>
              <Avatar sx={{ width: 80, height: 80, marginBottom: 2 }}>
                {selectedUser.firstName.charAt(0)}
              </Avatar>
              <Typography variant="h6" fontWeight="bold">
                {selectedUser.firstName} {selectedUser.lastName}
              </Typography>
              <Typography color="gray">{selectedUser.phoneNumber}</Typography>
              <Typography color="gray">{selectedUser.email}</Typography>
            </motion.div>
          )}

          {/* Chat Messages */}
          <Box sx={{ flex: 1, padding: 2, display: "flex", flexDirection: "column", gap: 1, overflowY: "auto" }}>
            {messages.map((msg, index) => (
              <Box
                key={index}
                sx={{
                  backgroundColor: msg.senderId === userDetails.user.id ? "#DEE9FF" : "#FFFFFF",
                  padding: 1,
                  borderRadius: 2,
                  maxWidth: "50%",
                  alignSelf: msg.senderId === userDetails.user.id ? "flex-end" : "flex-start",
                  display: "flex",
                  alignItems: "center"
                }}
              >
                <Typography>{msg.content}</Typography>
                {msg.senderId === userDetails.user.id && (
                  <Box sx={{ marginLeft: 1, display: "flex", alignItems: "center" }}>
                    {msg.isSeen ? <DoneAll sx={{ fontSize: 16, color: "blue" }} /> : <Done sx={{ fontSize: 16, color: "gray" }} />}
                  </Box>
                )}
              </Box>
            ))}
          </Box>

          {/* Message Input */}
          <Box sx={{ padding: 2, display: "flex", alignItems: "center", borderTop: "2px solid #f5f5f5" }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Message"
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault(); // Prevents a new line from being added in multiline inputs
                  handleSendMessage();
                }
              }}
              sx={{
                backgroundColor: "#FFFFFF",
                borderRadius: "10px",
                "& .MuiOutlinedInput-root": {
                  borderRadius: "25px",
                  "& fieldset": { border: "none" },
                },
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={handleSendMessage}>
                      <Send sx={{ color: "#4A90E2" }} />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

          </Box>
        </Box>
      </Box>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ChatApp;
