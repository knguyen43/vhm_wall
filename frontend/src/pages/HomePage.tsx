import React from 'react';
import { Box, Button, Card, CardContent, Container, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const HomePage: React.FC = () => {
  return (
    <Container maxWidth="md">
      <Box sx={{ py: 6 }}>
        <Typography variant="h3" gutterBottom>
          VHM Memorial
        </Typography>
        <Typography variant="body1" sx={{ maxWidth: 720 }}>
          A digital memorial honoring Vietnamese boat people. Explore names, offer remembrances,
          and preserve stories for future generations.
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 3 }}>
          <Button variant="contained" component={RouterLink} to="/search">
            Search Memorials
          </Button>
          <Button variant="outlined" component={RouterLink} to="/persons">
            View Persons
          </Button>
          <Button variant="outlined" component={RouterLink} to="/locations">
            Browse Locations
          </Button>
        </Stack>
        <Stack spacing={2} sx={{ mt: 5 }}>
          <Card>
            <CardContent>
              <Typography variant="h6">Demo Walkthrough</Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                1) Search for “Minh Tran” in Search. 2) Open the Memorial page. 3) Add a remembrance
                or offering. 4) Upload a photo (auth required).
              </Typography>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography variant="h6">Demo Credentials</Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Email: demo@vhm.org, Password: DemoPass123
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Admin access is controlled by `ADMIN_EMAILS` in `backend/.env`.
              </Typography>
            </CardContent>
          </Card>
        </Stack>
      </Box>
    </Container>
  );
};

export default HomePage;
