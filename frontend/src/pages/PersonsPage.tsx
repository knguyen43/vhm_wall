import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Snackbar,
  TextField,
  Typography
} from '@mui/material';
import { Delete } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { createPerson, deletePerson, listPersons, Person } from '../services/personService';
import { uploadPhoto } from '../services/photoService';

const PersonsPage: React.FC = () => {
  const [persons, setPersons] = useState<Person[]>([]);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [uploadPersonId, setUploadPersonId] = useState<string | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadCaption, setUploadCaption] = useState('');
  const [uploadPrimary, setUploadPrimary] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const loadPersons = async (targetPage = page) => {
    try {
      const data = await listPersons(targetPage, 10);
      setPersons(data.persons);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (err) {
      setStatus((err as Error).message);
    }
  };

  useEffect(() => {
    loadPersons();
  }, []);

  const handleCreate = async () => {
    setStatus(null);
    try {
      await createPerson(firstName, lastName);
      setFirstName('');
      setLastName('');
      await loadPersons(1);
      setPage(1);
      setToast('Person created');
    } catch (err) {
      setStatus((err as Error).message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePerson(id);
      await loadPersons();
      setToast('Person deleted');
    } catch (err) {
      setStatus((err as Error).message);
    }
  };

  const handleUploadClick = (personId: string) => {
    setUploadPersonId(personId);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (!file) return;
    setUploadFile(file);
  };

  const handleUploadClose = () => {
    if (uploading) return;
    setUploadFile(null);
    setUploadPersonId(null);
    setUploadCaption('');
    setUploadPrimary(true);
  };

  const handleUploadSubmit = async () => {
    if (!uploadPersonId || !uploadFile) return;
    setUploading(true);
    setStatus(null);
    try {
      await uploadPhoto(uploadPersonId, uploadFile, {
        caption: uploadCaption.trim() || undefined,
        isPrimary: uploadPrimary
      });
      setToast('Photo uploaded');
      handleUploadClose();
    } catch (err) {
      setStatus((err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const handlePrev = async () => {
    const nextPage = Math.max(page - 1, 1);
    setPage(nextPage);
    await loadPersons(nextPage);
  };

  const handleNext = async () => {
    const nextPage = Math.min(page + 1, totalPages);
    setPage(nextPage);
    await loadPersons(nextPage);
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 6 }}>
        <Typography variant="h4" gutterBottom>
          Persons
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <TextField
            label="First name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
          <TextField
            label="Last name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
          <Button variant="contained" onClick={handleCreate}>
            Add
          </Button>
        </Box>
        {status && (
          <Typography variant="body2" sx={{ mb: 2 }}>
            {status}
          </Typography>
        )}
        {persons.length === 0 ? (
          <Typography variant="body2">No persons yet.</Typography>
        ) : (
          persons.map((person) => (
            <Box key={person.id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body1" sx={{ flexGrow: 1 }}>
                {person.firstName} {person.lastName}
              </Typography>
              <Button component={RouterLink} to={`/memorial/${person.id}`} size="small">
                Memorial
              </Button>
              <Button component={RouterLink} to={`/family/${person.id}`} size="small">
                Family
              </Button>
              <Button size="small" onClick={() => handleUploadClick(person.id)}>
                Upload Photo
              </Button>
              <IconButton aria-label="delete" onClick={() => handleDelete(person.id)}>
                <Delete />
              </IconButton>
            </Box>
          ))
        )}
        <Box sx={{ display: 'flex', gap: 1, mt: 3 }}>
          <Button variant="outlined" onClick={handlePrev} disabled={page <= 1}>
            Prev
          </Button>
          <Button variant="outlined" onClick={handleNext} disabled={page >= totalPages}>
            Next
          </Button>
          <Typography variant="body2" sx={{ alignSelf: 'center' }}>
            Page {page} of {totalPages}
          </Typography>
        </Box>
        <Snackbar
          open={Boolean(toast)}
          autoHideDuration={2500}
          onClose={() => setToast(null)}
          message={toast || ''}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelected}
          style={{ display: 'none' }}
        />
        <Dialog open={Boolean(uploadFile)} onClose={handleUploadClose} maxWidth="xs" fullWidth>
          <DialogTitle>Upload Photo</DialogTitle>
          <DialogContent sx={{ display: 'grid', gap: 2, mt: 1 }}>
            <Typography variant="body2">
              {uploadFile ? `Selected: ${uploadFile.name}` : 'Choose a file to upload.'}
            </Typography>
            <TextField
              label="Caption (optional)"
              value={uploadCaption}
              onChange={(e) => setUploadCaption(e.target.value)}
              fullWidth
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={uploadPrimary}
                  onChange={(e) => setUploadPrimary(e.target.checked)}
                />
              }
              label="Set as primary photo"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleUploadClose} disabled={uploading}>
              Cancel
            </Button>
            <Button onClick={handleUploadSubmit} variant="contained" disabled={uploading || !uploadFile}>
              {uploading ? 'Uploading...' : 'Upload'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default PersonsPage;
