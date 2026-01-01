import React, { useEffect, useState } from 'react';
import { AppBar, Box, Button, Chip, Container, Toolbar, Typography } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { getMe } from '../services/authService';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadMe = async () => {
      if (!token) {
        setEmail(null);
        return;
      }
      try {
        const me = await getMe();
        if (isMounted) setEmail(me.email);
      } catch {
        if (isMounted) setEmail(null);
      }
    };
    loadMe();
    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  return (
    <AppBar position="static" color="default" elevation={1}>
      <Container maxWidth="md">
        <Toolbar disableGutters sx={{ display: 'flex', gap: 2 }}>
          <Typography
            component={RouterLink}
            to="/"
            variant="h6"
            sx={{ textDecoration: 'none', color: 'primary.main', fontWeight: 700 }}
          >
            VHM Memorial
          </Typography>
          <Box sx={{ flexGrow: 1, display: 'flex', gap: 1 }}>
            <Button component={RouterLink} to="/" color="inherit">
              Home
            </Button>
            <Button component={RouterLink} to="/search" color="inherit">
              Search
            </Button>
            <Button component={RouterLink} to="/persons" color="inherit">
              Persons
            </Button>
            <Button component={RouterLink} to="/locations" color="inherit">
              Locations
            </Button>
            <Button component={RouterLink} to="/admin" color="inherit">
              Admin
            </Button>
          </Box>
          {token && (
            <Chip
              size="small"
              label={email ? `Signed in as ${email}` : 'Authenticated'}
              color="success"
              variant="outlined"
            />
          )}
          {token ? (
            <Button variant="outlined" onClick={handleLogout}>
              Logout
            </Button>
          ) : (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button component={RouterLink} to="/login" color="inherit">
                Login
              </Button>
              <Button component={RouterLink} to="/register" variant="outlined">
                Register
              </Button>
            </Box>
          )}
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Header;
