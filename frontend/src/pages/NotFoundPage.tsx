import React from 'react';
import { Container, Typography } from '@mui/material';

const NotFoundPage: React.FC = () => {
  return (
    <Container maxWidth="md">
      <Typography variant="h4" sx={{ py: 6 }}>
        Page Not Found
      </Typography>
    </Container>
  );
};

export default NotFoundPage;
