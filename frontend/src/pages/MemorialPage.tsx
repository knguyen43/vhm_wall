import React, { useEffect, useState } from 'react';
import { Box, Button, Container, IconButton, MenuItem, Snackbar, TextField, Typography } from '@mui/material';
import { Delete } from '@mui/icons-material';
import { useParams } from 'react-router-dom';
import {
  addOffering,
  addReminder,
  addRemembrance,
  deleteReminder,
  getOfferings,
  getRemembrances,
  getReminders,
  OfferingsSummary,
  Remembrance,
  Reminder
} from '../services/memorialService';
import { listPhotos, resolvePhotoUrl, setPrimaryPhoto, uploadPhoto, Photo } from '../services/photoService';

const MemorialPage: React.FC = () => {
  const { personId } = useParams<{ personId: string }>();
  const [remembrances, setRemembrances] = useState<Remembrance[]>([]);
  const [offerings, setOfferings] = useState<OfferingsSummary | null>(null);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [remembranceMessage, setRemembranceMessage] = useState('');
  const [offeringType, setOfferingType] = useState<'CANDLE' | 'FLOWER' | 'INCENSE' | 'PRAYER'>('CANDLE');
  const [offeringMessage, setOfferingMessage] = useState('');
  const [reminderTitle, setReminderTitle] = useState('');
  const [reminderDate, setReminderDate] = useState('');
  const [reminderFrequency, setReminderFrequency] = useState<'ONCE' | 'YEARLY' | 'MONTHLY'>('ONCE');
  const [status, setStatus] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoCaption, setPhotoCaption] = useState('');
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);

  const load = async () => {
    if (!personId) return;
    try {
      const [remData, offData, reminderData, photoData] = await Promise.all([
        getRemembrances(personId),
        getOfferings(personId),
        getReminders(personId),
        listPhotos(personId)
      ]);
      setRemembrances(remData);
      setOfferings(offData);
      setReminders(reminderData);
      setPhotos(photoData);
    } catch (err) {
      setStatus((err as Error).message);
    }
  };

  useEffect(() => {
    load();
  }, [personId]);

  useEffect(() => {
    if (!photoFile) {
      setPhotoPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(photoFile);
    setPhotoPreviewUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [photoFile]);

  const handleAddRemembrance = async () => {
    if (!personId) return;
    try {
      await addRemembrance(personId, { message: remembranceMessage });
      setRemembranceMessage('');
      await load();
      setToast('Remembrance submitted for review');
    } catch (err) {
      setStatus((err as Error).message);
    }
  };

  const handleAddOffering = async () => {
    if (!personId) return;
    try {
      await addOffering(personId, { offeringType, message: offeringMessage });
      setOfferingMessage('');
      await load();
      setToast('Offering added');
    } catch (err) {
      setStatus((err as Error).message);
    }
  };

  const handleAddReminder = async () => {
    if (!personId) return;
    try {
      await addReminder(personId, {
        title: reminderTitle,
        date: reminderDate,
        frequency: reminderFrequency
      });
      setReminderTitle('');
      setReminderDate('');
      await load();
      setToast('Reminder set');
    } catch (err) {
      setStatus((err as Error).message);
    }
  };

  const handleDeleteReminder = async (id: string) => {
    try {
      await deleteReminder(id);
      await load();
      setToast('Reminder deleted');
    } catch (err) {
      setStatus((err as Error).message);
    }
  };

  const handleUploadPhoto = async () => {
    if (!personId || !photoFile) return;
    setPhotoError(null);
    try {
      await uploadPhoto(personId, photoFile, photoCaption || undefined);
      setPhotoFile(null);
      setPhotoCaption('');
      await load();
      setToast('Photo uploaded');
    } catch (err) {
      setStatus((err as Error).message);
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 6 }}>
        <Typography variant="h4" gutterBottom>
          Memorial
        </Typography>
        {status && (
          <Typography variant="body2" sx={{ mb: 2 }}>
            {status}
          </Typography>
        )}

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Remembrances
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              fullWidth
              label="Write a remembrance"
              value={remembranceMessage}
              onChange={(e) => setRemembranceMessage(e.target.value)}
            />
            <Button variant="contained" onClick={handleAddRemembrance}>
              Add
            </Button>
          </Box>
          {remembrances.length === 0 ? (
            <Typography variant="body2">No remembrances yet.</Typography>
          ) : (
            remembrances.map((item) => (
              <Typography key={item.id} variant="body2">
                {item.message}
              </Typography>
            ))
          )}
        </Box>

        <Box>
          <Typography variant="h6" gutterBottom>
            Offerings
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              select
              label="Offering"
              value={offeringType}
              onChange={(e) => setOfferingType(e.target.value as typeof offeringType)}
              sx={{ minWidth: 160 }}
            >
              <MenuItem value="CANDLE">Candle</MenuItem>
              <MenuItem value="FLOWER">Flower</MenuItem>
              <MenuItem value="INCENSE">Incense</MenuItem>
              <MenuItem value="PRAYER">Prayer</MenuItem>
            </TextField>
            <TextField
              fullWidth
              label="Message (optional)"
              value={offeringMessage}
              onChange={(e) => setOfferingMessage(e.target.value)}
            />
            <Button variant="contained" onClick={handleAddOffering}>
              Offer
            </Button>
          </Box>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Total offerings: {offerings?.totalCount ?? 0}
          </Typography>
          {offerings?.recent?.length ? (
            offerings.recent.map((item) => (
              <Typography key={item.id} variant="body2">
                {item.offeringType} {item.message ? `- ${item.message}` : ''}
              </Typography>
            ))
          ) : (
            <Typography variant="body2">No offerings yet.</Typography>
          )}
        </Box>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Reminders
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              label="Title"
              value={reminderTitle}
              onChange={(e) => setReminderTitle(e.target.value)}
            />
            <TextField
              type="date"
              label="Date"
              InputLabelProps={{ shrink: true }}
              value={reminderDate}
              onChange={(e) => setReminderDate(e.target.value)}
            />
            <TextField
              select
              label="Frequency"
              value={reminderFrequency}
              onChange={(e) => setReminderFrequency(e.target.value as typeof reminderFrequency)}
              sx={{ minWidth: 140 }}
            >
              <MenuItem value="ONCE">Once</MenuItem>
              <MenuItem value="YEARLY">Yearly</MenuItem>
              <MenuItem value="MONTHLY">Monthly</MenuItem>
            </TextField>
            <Button variant="contained" onClick={handleAddReminder}>
              Set
            </Button>
          </Box>
          {reminders.length === 0 ? (
            <Typography variant="body2">No reminders yet.</Typography>
          ) : (
            reminders.map((item) => (
              <Box key={item.id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" sx={{ flexGrow: 1 }}>
                  {item.title} - {new Date(item.date).toLocaleDateString()} ({item.frequency})
                </Typography>
                <IconButton aria-label="delete" onClick={() => handleDeleteReminder(item.id)}>
                  <Delete />
                </IconButton>
              </Box>
            ))
          )}
          <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
            Reminders require authentication.
          </Typography>
        </Box>
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Photos
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Button variant="outlined" component="label">
              Choose Photo
              <input
                hidden
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  if (!file) {
                    setPhotoFile(null);
                    setPhotoError(null);
                    return;
                  }
                  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
                  if (!allowed.includes(file.type)) {
                    setPhotoError('Only JPG, PNG, or WebP images are allowed');
                    setPhotoFile(null);
                    return;
                  }
                  if (file.size > 5 * 1024 * 1024) {
                    setPhotoError('Max file size is 5MB');
                    setPhotoFile(null);
                    return;
                  }
                  setPhotoError(null);
                  setPhotoFile(file);
                }}
              />
            </Button>
            <TextField
              label="Caption"
              value={photoCaption}
              onChange={(e) => setPhotoCaption(e.target.value)}
            />
            <Button variant="contained" onClick={handleUploadPhoto} disabled={!photoFile}>
              Upload
            </Button>
          </Box>
          {photoError && (
            <Typography variant="body2" color="error" sx={{ mb: 2 }}>
              {photoError}
            </Typography>
          )}
          {photoPreviewUrl && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" display="block">
                Preview
              </Typography>
              <img
                src={photoPreviewUrl}
                alt="Selected preview"
                style={{ width: 200, height: 140, objectFit: 'cover' }}
              />
            </Box>
          )}
          {photos.length === 0 ? (
            <Typography variant="body2">No photos yet.</Typography>
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 2 }}>
              {photos.map((photo) => (
                <Box key={photo.id} sx={{ border: '1px solid #e0e0e0', p: 1 }}>
                  <img
                    src={resolvePhotoUrl(photo.thumbnailUrl || photo.url)}
                    alt={photo.caption || 'Memorial photo'}
                    style={{ width: '100%', height: 120, objectFit: 'cover' }}
                  />
                  <Typography variant="caption" display="block">
                    {photo.caption || 'Untitled'}
                  </Typography>
                  <Button
                    size="small"
                    variant={photo.isPrimary ? 'contained' : 'outlined'}
                    onClick={async () => {
                      try {
                        await setPrimaryPhoto(photo.id);
                        await load();
                        setToast('Primary photo updated');
                      } catch (err) {
                        setStatus((err as Error).message);
                      }
                    }}
                  >
                    {photo.isPrimary ? 'Primary' : 'Set Primary'}
                  </Button>
                </Box>
              ))}
            </Box>
          )}
          <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
            Photo uploads require authentication.
          </Typography>
        </Box>
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

export default MemorialPage;
