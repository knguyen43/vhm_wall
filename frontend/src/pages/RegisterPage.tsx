import React, { useState } from 'react';
import { Box, Button, Container, Snackbar, TextField, Typography } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { register } from '../services/authService';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const handleRegister = async () => {
    setStatus(null);
    const nextErrors: { email?: string; password?: string } = {};
    const emailValue = email.trim();
    if (!emailValue) {
      nextErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
      nextErrors.email = 'Enter a valid email address';
    }
    if (!password) {
      nextErrors.password = 'Password is required';
    } else if (password.length < 8) {
      nextErrors.password = 'Password must be at least 8 characters';
    }
    setErrors(nextErrors);
    if (nextErrors.email || nextErrors.password) return;

    try {
      const result = await register(email, password);
      localStorage.setItem('token', result.token);
      const redirectTo = (location.state as { from?: Location })?.from?.pathname || '/persons';
      navigate(redirectTo, { replace: true });
    } catch (err) {
      const message = (err as Error).message;
      setStatus(message);
      setToast(message);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ py: 6 }}>
        <Typography variant="h4" gutterBottom>
          Register
        </Typography>
        <TextField
          fullWidth
          label="Email"
          margin="normal"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={Boolean(errors.email)}
          helperText={errors.email}
        />
        <TextField
          fullWidth
          label="Password"
          type="password"
          margin="normal"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={Boolean(errors.password)}
          helperText={errors.password}
        />
        <Button variant="contained" onClick={handleRegister}>
          Register
        </Button>
        {status && (
          <Typography variant="body2" sx={{ mt: 2 }}>
            {status}
          </Typography>
        )}
        <Snackbar
          open={Boolean(toast)}
          autoHideDuration={2500}
          onClose={() => setToast(null)}
          message={toast || ''}
        />
      </Box>
    </Container>
  );
};

export default RegisterPage;
