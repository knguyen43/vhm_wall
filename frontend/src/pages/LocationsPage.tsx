import React, { useEffect, useState } from 'react';
import { Box, Button, Container, Snackbar, TextField, Typography } from '@mui/material';
import { createLocation, listLocations, Location } from '../services/locationService';

const LocationsPage: React.FC = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const load = async () => {
    try {
      const data = await listLocations();
      setLocations(data);
    } catch (err) {
      setStatus((err as Error).message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async () => {
    setStatus(null);
    try {
      await createLocation({ name, city: city || undefined, country });
      setName('');
      setCity('');
      setCountry('');
      await load();
      setToast('Location created');
    } catch (err) {
      setStatus((err as Error).message);
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 6 }}>
        <Typography variant="h4" gutterBottom>
          Locations
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <TextField label="City" value={city} onChange={(e) => setCity(e.target.value)} />
          <TextField label="Country" value={country} onChange={(e) => setCountry(e.target.value)} />
          <Button variant="contained" onClick={handleCreate}>
            Add
          </Button>
        </Box>
        {status && (
          <Typography variant="body2" sx={{ mb: 2 }}>
            {status}
          </Typography>
        )}
        {locations.length === 0 ? (
          <Typography variant="body2">No locations yet.</Typography>
        ) : (
          locations.map((loc) => (
            <Typography key={loc.id} variant="body1">
              {loc.name}{loc.city ? `, ${loc.city}` : ''} ({loc.country})
            </Typography>
          ))
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

export default LocationsPage;
