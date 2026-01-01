import React, { useEffect, useState } from 'react';
import { Box, Button, Container, MenuItem, Snackbar, TextField, Typography } from '@mui/material';
import { useParams } from 'react-router-dom';
import { addFamily, FamilyRelationship, listFamily } from '../services/familyService';

const FamilyPage: React.FC = () => {
  const { personId } = useParams<{ personId: string }>();
  const [relationships, setRelationships] = useState<FamilyRelationship[]>([]);
  const [relatedPersonId, setRelatedPersonId] = useState('');
  const [relationshipType, setRelationshipType] = useState('PARENT');
  const [status, setStatus] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const load = async () => {
    if (!personId) return;
    try {
      const data = await listFamily(personId);
      setRelationships(data);
    } catch (err) {
      setStatus((err as Error).message);
    }
  };

  useEffect(() => {
    load();
  }, [personId]);

  const handleAdd = async () => {
    if (!personId) return;
    setStatus(null);
    try {
      await addFamily(personId, { relatedPersonId, relationshipType });
      setRelatedPersonId('');
      await load();
      setToast('Relationship added');
    } catch (err) {
      setStatus((err as Error).message);
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 6 }}>
        <Typography variant="h4" gutterBottom>
          Family Relationships
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <TextField
            label="Related Person ID"
            value={relatedPersonId}
            onChange={(e) => setRelatedPersonId(e.target.value)}
          />
          <TextField
            select
            label="Type"
            value={relationshipType}
            onChange={(e) => setRelationshipType(e.target.value)}
            sx={{ minWidth: 160 }}
          >
            {[
              'PARENT',
              'CHILD',
              'SPOUSE',
              'SIBLING',
              'GRANDPARENT',
              'GRANDCHILD',
              'AUNT_UNCLE',
              'NIECE_NEPHEW',
              'COUSIN',
              'OTHER'
            ].map((type) => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </TextField>
          <Button variant="contained" onClick={handleAdd}>
            Add
          </Button>
        </Box>
        {status && (
          <Typography variant="body2" sx={{ mb: 2 }}>
            {status}
          </Typography>
        )}
        {relationships.length === 0 ? (
          <Typography variant="body2">No relationships yet.</Typography>
        ) : (
          relationships.map((rel) => (
            <Typography key={rel.id} variant="body1">
              {rel.relationshipType}: {rel.person.firstName} {rel.person.lastName} ↔ {rel.relatedPerson.firstName}{' '}
              {rel.relatedPerson.lastName}
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

export default FamilyPage;
