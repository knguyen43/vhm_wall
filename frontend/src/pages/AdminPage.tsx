import React, { useEffect, useState } from 'react';
import { Box, Button, Container, Typography } from '@mui/material';
import { approveContribution, approveRemembrance, getSubmissions, rejectContribution } from '../services/adminService';

const AdminPage: React.FC = () => {
  const [contributions, setContributions] = useState<any[]>([]);
  const [remembrances, setRemembrances] = useState<any[]>([]);
  const [status, setStatus] = useState<string | null>(null);

  const load = async () => {
    try {
      const data = await getSubmissions();
      setContributions(data.contributions);
      setRemembrances(data.remembrances);
    } catch (err) {
      setStatus((err as Error).message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleApproveContribution = async (id: string) => {
    await approveContribution(id);
    await load();
  };

  const handleRejectContribution = async (id: string) => {
    await rejectContribution(id);
    await load();
  };

  const handleApproveRemembrance = async (id: string) => {
    await approveRemembrance(id);
    await load();
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 6 }}>
        <Typography variant="h4" gutterBottom>
          Admin
        </Typography>
        {status && (
          <Typography variant="body2" sx={{ mb: 2 }}>
            {status}
          </Typography>
        )}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Pending Contributions
          </Typography>
          {contributions.length === 0 ? (
            <Typography variant="body2">No pending contributions.</Typography>
          ) : (
            contributions.map((item) => (
              <Box key={item.id} sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" sx={{ flexGrow: 1 }}>
                  {item.type}
                </Typography>
                <Button size="small" variant="outlined" onClick={() => handleApproveContribution(item.id)}>
                  Approve
                </Button>
                <Button size="small" variant="outlined" color="error" onClick={() => handleRejectContribution(item.id)}>
                  Reject
                </Button>
              </Box>
            ))
          )}
        </Box>
        <Box>
          <Typography variant="h6" gutterBottom>
            Pending Remembrances
          </Typography>
          {remembrances.length === 0 ? (
            <Typography variant="body2">No pending remembrances.</Typography>
          ) : (
            remembrances.map((item) => (
              <Box key={item.id} sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" sx={{ flexGrow: 1 }}>
                  {item.message}
                </Typography>
                <Button size="small" variant="outlined" onClick={() => handleApproveRemembrance(item.id)}>
                  Approve
                </Button>
              </Box>
            ))
          )}
        </Box>
      </Box>
    </Container>
  );
};

export default AdminPage;
