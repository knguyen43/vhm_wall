import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Dialog,
  DialogContent,
  Divider,
  IconButton,
  MenuItem,
  TextField,
  Typography
} from '@mui/material';
import { Close, LocalFireDepartment, PeopleAlt } from '@mui/icons-material';
import { useSearchParams } from 'react-router-dom';
import {
  addOffering,
  getOfferings,
  getRemembrances,
  Offering,
  OfferingsSummary,
  Remembrance
} from '../services/memorialService';
import { searchPersons } from '../services/searchService';
import { Person } from '../services/personService';

const formatDate = (value?: string): string | null => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString();
};

type FilterValues = {
  firstName: string;
  lastName: string;
  deathMonth: string;
  deathYear: string;
};

const SearchPage: React.FC = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [deathMonth, setDeathMonth] = useState('');
  const [deathYear, setDeathYear] = useState('');
  const [persons, setPersons] = useState<Person[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [remembrances, setRemembrances] = useState<Remembrance[]>([]);
  const [offeringsSummary, setOfferingsSummary] = useState<OfferingsSummary | null>(null);
  const [remembrancesStatus, setRemembrancesStatus] = useState<string | null>(null);
  const [offeringsStatus, setOfferingsStatus] = useState<string | null>(null);
  const [remembrancesLoading, setRemembrancesLoading] = useState(false);
  const [offeringsLoading, setOfferingsLoading] = useState(false);
  const [offeringMessage, setOfferingMessage] = useState('');
  const [offeringName, setOfferingName] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const debounceRef = useRef<number | undefined>(undefined);
  const syncingFromUrlRef = useRef(false);
  const lastParamsRef = useRef<string>('');

  const parseSearchParams = useCallback((): FilterValues & { page: number } => {
    const parsedPage = parseInt(searchParams.get('page') || '1', 10);
    return {
      firstName: searchParams.get('firstName') || '',
      lastName: searchParams.get('lastName') || '',
      deathMonth: searchParams.get('deathMonth') || '',
      deathYear: searchParams.get('deathYear') || '',
      page: Number.isNaN(parsedPage) ? 1 : Math.max(parsedPage, 1)
    };
  }, [searchParams]);

  const updateSearchParams = useCallback(
    (targetPage: number, overrides?: Partial<FilterValues>) => {
      const effective: FilterValues = {
        firstName,
        lastName,
        deathMonth,
        deathYear,
        ...overrides
      };
      const params = new URLSearchParams();
      if (effective.firstName) params.set('firstName', effective.firstName);
      if (effective.lastName) params.set('lastName', effective.lastName);
      if (effective.deathMonth) params.set('deathMonth', effective.deathMonth);
      if (effective.deathYear) params.set('deathYear', effective.deathYear);
      params.set('page', String(targetPage));
      setSearchParams(params, { replace: true });
    },
    [deathMonth, deathYear, firstName, lastName, setSearchParams]
  );

  const executeSearch = useCallback(
    async (targetPage: number, overrides?: Partial<FilterValues>) => {
      const effective: FilterValues = {
        firstName,
        lastName,
        deathMonth,
        deathYear,
        ...overrides
      };
      setIsLoading(true);
      setStatus(null);
      try {
        const name = `${effective.firstName} ${effective.lastName}`.trim();
        const result = await searchPersons({
          name: name || undefined,
          deathMonth: effective.deathMonth ? Number(effective.deathMonth) : undefined,
          deathYear: effective.deathYear ? Number(effective.deathYear) : undefined,
          page: targetPage,
          limit: 12
        });
        setPersons(result.persons);
        setTotalPages(result.pagination?.totalPages || 1);
        setPage(targetPage);
      } catch (err) {
        setStatus((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    },
    [deathMonth, deathYear, firstName, lastName]
  );

  useEffect(() => {
    const paramsString = searchParams.toString();
    if (paramsString === lastParamsRef.current) {
      return;
    }
    const params = parseSearchParams();
    syncingFromUrlRef.current = true;
    setFirstName(params.firstName);
    setLastName(params.lastName);
    setDeathMonth(params.deathMonth);
    setDeathYear(params.deathYear);
    setPage(params.page);
    lastParamsRef.current = paramsString;
    executeSearch(params.page, params).finally(() => {
      syncingFromUrlRef.current = false;
    });
  }, [executeSearch, parseSearchParams, searchParams]);

  useEffect(() => {
    if (syncingFromUrlRef.current) {
      return;
    }
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }
    debounceRef.current = window.setTimeout(() => {
      const params = new URLSearchParams();
      if (firstName) params.set('firstName', firstName);
      if (lastName) params.set('lastName', lastName);
      if (deathMonth) params.set('deathMonth', deathMonth);
      if (deathYear) params.set('deathYear', deathYear);
      params.set('page', '1');
      if (params.toString() !== searchParams.toString()) {
        updateSearchParams(1);
      }
    }, 400);
    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }
    };
  }, [deathMonth, deathYear, firstName, lastName, searchParams, updateSearchParams]);

  const selectedPerson = persons.find((person) => person.id === selectedId) || null;
  const selectedPhotoUrl = selectedPerson?.photos?.[0]?.url || null;
  const pageButtons = useMemo(() => {
    const count = Math.min(totalPages, 5);
    return Array.from({ length: count }, (_, idx) => idx + 1);
  }, [totalPages]);

  useEffect(() => {
    if (!selectedPerson) {
      setRemembrances([]);
      setOfferingsSummary(null);
      setRemembrancesStatus(null);
      setOfferingsStatus(null);
      return;
    }

    let active = true;
    const loadMemorialData = async () => {
      setRemembrancesLoading(true);
      setOfferingsLoading(true);
      setRemembrancesStatus(null);
      setOfferingsStatus(null);
      try {
        const [remembrancesData, offeringsData] = await Promise.all([
          getRemembrances(selectedPerson.id),
          getOfferings(selectedPerson.id)
        ]);
        if (!active) return;
        setRemembrances(remembrancesData);
        setOfferingsSummary(offeringsData);
      } catch (err) {
        if (!active) return;
        const message = (err as Error).message;
        setRemembrancesStatus(message);
        setOfferingsStatus(message);
      } finally {
        if (active) {
          setRemembrancesLoading(false);
          setOfferingsLoading(false);
        }
      }
    };

    loadMemorialData();
    return () => {
      active = false;
    };
  }, [selectedPerson]);

  const handleOffering = useCallback(
    async (offeringType: Offering['offeringType']) => {
      if (!selectedPerson) return;
      setOfferingsLoading(true);
      setOfferingsStatus(null);
      try {
        const offering = await addOffering(selectedPerson.id, {
          offeringType,
          message: offeringMessage.trim() || undefined,
          authorName: offeringName.trim() || undefined
        });
        setOfferingsSummary((prev) => {
          if (!prev) {
            return {
              totalCount: 1,
              counts: { [offering.offeringType]: 1 },
              recent: [offering]
            };
          }
          const currentCount = prev.counts[offering.offeringType] || 0;
          return {
            ...prev,
            totalCount: prev.totalCount + 1,
            counts: {
              ...prev.counts,
              [offering.offeringType]: currentCount + 1
            },
            recent: [offering, ...prev.recent].slice(0, 20)
          };
        });
        setOfferingsStatus('Thank you for your tribute.');
        setOfferingMessage('');
      } catch (err) {
        setOfferingsStatus((err as Error).message);
      } finally {
        setOfferingsLoading(false);
      }
    },
    [offeringMessage, offeringName, selectedPerson]
  );

  const handleClearFilters = useCallback(() => {
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }
    setFirstName('');
    setLastName('');
    setDeathMonth('');
    setDeathYear('');
    setStatus(null);
    updateSearchParams(1, {
      firstName: '',
      lastName: '',
      deathMonth: '',
      deathYear: ''
    });
  }, [updateSearchParams]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#0c0f12',
        backgroundImage:
          'radial-gradient(circle at 20% 20%, rgba(255, 204, 74, 0.08), transparent 40%), radial-gradient(circle at 80% 10%, rgba(76, 124, 255, 0.08), transparent 35%), linear-gradient(180deg, #0c0f12 0%, #151b20 60%, #0c0f12 100%)',
        color: '#f2f2f2',
        py: { xs: 4, md: 6 }
      }}
    >
      <Container maxWidth="xl">
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography
            variant="h4"
            sx={{
              fontFamily: 'Cinzel, "Times New Roman", serif',
              letterSpacing: 2,
              color: '#d6a64a',
              textTransform: 'uppercase'
            }}
          >
            Boat People Memorial Wall
          </Typography>
          <Typography
            variant="subtitle1"
            sx={{ color: '#d6a64a', mt: 1, fontWeight: 600 }}
          >
            In remembering and honoring those who sacrificed their lives in search of freedom
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, color: '#b7c0c7' }}>
            De tuong nho va ton vinh nhung dong bao da hy sinh mang song cua ho tren duong di tim Tu Do
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(4, minmax(0, 1fr))' },
            gap: 2,
            mb: 2,
            alignItems: 'center'
          }}
        >
          <TextField
            label="Death Month"
            select
            size="small"
            sx={{ backgroundColor: '#f5f5f5', borderRadius: 1 }}
            value={deathMonth}
            onChange={(e) => setDeathMonth(e.target.value)}
          >
            {Array.from({ length: 12 }, (_, i) => (
              <MenuItem key={i + 1} value={i + 1}>
                {i + 1}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Death Year"
            type="number"
            size="small"
            sx={{ backgroundColor: '#f5f5f5', borderRadius: 1 }}
            value={deathYear}
            onChange={(e) => setDeathYear(e.target.value)}
          />
          <TextField
            label="Last Name"
            size="small"
            sx={{ backgroundColor: '#f5f5f5', borderRadius: 1 }}
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
          <TextField
            label="First Name"
            size="small"
            sx={{ backgroundColor: '#f5f5f5', borderRadius: 1 }}
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
          <Button
            variant="outlined"
            size="small"
            sx={{ minWidth: 36, color: '#cfd5da', borderColor: '#2a2f36', backgroundColor: '#14191e' }}
            onClick={() => updateSearchParams(1)}
            disabled={page === 1 || isLoading}
          >
            {'<<'}
          </Button>
          <Button
            variant="outlined"
            size="small"
            sx={{ minWidth: 36, color: '#cfd5da', borderColor: '#2a2f36', backgroundColor: '#14191e' }}
            onClick={() => updateSearchParams(Math.max(page - 1, 1))}
            disabled={page === 1 || isLoading}
          >
            {'<'}
          </Button>
          {pageButtons.map((label) => (
            <Button
              key={label}
              variant="outlined"
              size="small"
              sx={{
                minWidth: 36,
                color: '#cfd5da',
                borderColor: '#2a2f36',
                backgroundColor: label === page ? '#20262b' : '#14191e',
                '&:hover': { borderColor: '#d6a64a', color: '#d6a64a' }
              }}
              onClick={() => updateSearchParams(label)}
              disabled={isLoading}
            >
              {label}
            </Button>
          ))}
          <Button
            variant="outlined"
            size="small"
            sx={{ minWidth: 36, color: '#cfd5da', borderColor: '#2a2f36', backgroundColor: '#14191e' }}
            onClick={() => updateSearchParams(Math.min(page + 1, totalPages))}
            disabled={page >= totalPages || isLoading}
          >
            {'>'}
          </Button>
          <Button
            variant="outlined"
            size="small"
            sx={{ minWidth: 36, color: '#cfd5da', borderColor: '#2a2f36', backgroundColor: '#14191e' }}
            onClick={() => updateSearchParams(totalPages)}
            disabled={page >= totalPages || isLoading}
          >
            {'>>'}
          </Button>
          <Button
            variant="contained"
            size="small"
            onClick={() => updateSearchParams(1)}
            sx={{ ml: 2, backgroundColor: '#d6a64a', color: '#1b1f24', '&:hover': { backgroundColor: '#c4963f' } }}
          >
            {isLoading ? 'Loading...' : 'Search'}
          </Button>
          <Button
            variant="text"
            size="small"
            onClick={handleClearFilters}
            sx={{ color: '#cfd5da' }}
          >
            Clear
          </Button>
        </Box>
        {status && (
          <Typography variant="body2" sx={{ mb: 2, color: '#d7b874' }}>
            {status}
          </Typography>
        )}

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(6, 1fr)' },
            gap: 2
          }}
        >
          {persons.map((person) => {
            const birth = formatDate(person.dateOfBirth);
            const death = formatDate(person.dateOfDeath);
            const dateRange = birth && death ? `${birth} - ${death}` : death ? `? - ${death}` : '?';

            return (
              <Box
                key={person.id}
                onClick={() => setSelectedId(person.id)}
                sx={{
                  position: 'relative',
                  height: 180,
                  cursor: 'pointer',
                  borderRadius: 2,
                  border: '1px solid #2d333a',
                  backgroundColor: '#0f1317',
                  backgroundImage:
                    'radial-gradient(circle at 20% 10%, rgba(255,255,255,0.05), transparent 40%), linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(0,0,0,0.6) 60%), url(\"data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27180%27 height=%27180%27 viewBox=%270 0 180 180%27%3E%3Crect width=%27180%27 height=%27180%27 fill=%27%23101215%27/%3E%3Cpath d=%27M0 140 L180 40%27 stroke=%27%23252b31%27 stroke-width=%274%27/%3E%3Cpath d=%27M-10 60 L180 10%27 stroke=%27%2321262c%27 stroke-width=%272%27/%3E%3Cpath d=%27M0 180 L180 120%27 stroke=%27%2321262c%27 stroke-width=%272%27/%3E%3C/svg%3E\")',
                  backgroundSize: 'cover',
                  boxShadow: 'inset 0 0 20px rgba(0,0,0,0.6)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 30px rgba(0,0,0,0.35)'
                  },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 6,
                    left: 6,
                    right: 6,
                    bottom: 6,
                    borderRadius: 10,
                    border: '1px solid rgba(255, 212, 99, 0.35)'
                  }
                }}
              >
                <Box sx={{ position: 'relative', zIndex: 1, p: 2 }}>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontFamily: 'Cinzel, "Times New Roman", serif',
                      color: '#c9cdd1',
                      textTransform: 'uppercase'
                    }}
                  >
                    {[person.firstName, person.lastName].filter(Boolean).join(' ').toUpperCase()}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#aab2b9', mt: 1 }}>
                    {dateRange}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, mt: 3, color: '#9aa3aa' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <LocalFireDepartment fontSize="small" />
                      <Typography variant="caption">
                        {person.memorialActivity?.offerings ?? 0}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <PeopleAlt fontSize="small" />
                      <Typography variant="caption">
                        {person.familyCount ?? 0}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            );
          })}
        </Box>
      </Container>

      <Dialog
        open={Boolean(selectedPerson)}
        onClose={() => setSelectedId(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#f7f7f7',
            borderRadius: 2,
            boxShadow: '0 24px 60px rgba(0,0,0,0.6)'
          }
        }}
      >
        <DialogContent sx={{ p: 3, position: 'relative' }}>
          <IconButton
            onClick={() => setSelectedId(null)}
            sx={{ position: 'absolute', top: 8, right: 8 }}
          >
            <Close />
          </IconButton>
          {selectedPerson && (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '280px 1fr' }, gap: 3 }}>
              <Box
                sx={{
                  backgroundColor: '#0b0b0b',
                  borderRadius: 2,
                  height: 320,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#d6a64a',
                  fontFamily: 'Cinzel, "Times New Roman", serif',
                  textAlign: 'center',
                  px: 2,
                  backgroundImage: selectedPhotoUrl
                    ? 'none'
                    : 'radial-gradient(circle at 50% 20%, rgba(255,177,66,0.35), transparent 55%), linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.6) 100%)'
                }}
              >
                {selectedPhotoUrl ? (
                  <Box
                    component="img"
                    src={selectedPhotoUrl}
                    alt="Memorial portrait"
                    sx={{
                      width: '100%',
                      height: '100%',
                      borderRadius: 2,
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  'Candle Tribute'
                )}
              </Box>
              <Box>
                <Box>
                  <Typography variant="h5" sx={{ fontFamily: 'Cinzel, "Times New Roman", serif' }}>
                    {[selectedPerson.firstName, selectedPerson.lastName].filter(Boolean).join(' ')}
                  </Typography>
                  <Typography variant="subtitle1" sx={{ mt: 1, fontWeight: 700 }}>
                    {(() => {
                      const birth = formatDate(selectedPerson.dateOfBirth);
                      const death = formatDate(selectedPerson.dateOfDeath);
                      if (birth && death) return `${birth} - ${death}`;
                      if (death) return `? - ${death}`;
                      return '?';
                    })()}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Birth Place: {selectedPerson.placeOfBirth?.name || 'Unknown'}
                  </Typography>
                  <Typography variant="body2">
                    Death Place: {selectedPerson.placeOfDeath?.name || 'Unknown'}
                  </Typography>
                  <Typography variant="body2">
                    Cause Of Death: {selectedPerson.causeOfDeath || 'Unknown'}
                  </Typography>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    Remembrances
                  </Typography>
                  {remembrancesLoading ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                      <CircularProgress size={18} />
                      <Typography variant="body2">Loading remembrances...</Typography>
                    </Box>
                  ) : remembrancesStatus ? (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {remembrancesStatus}
                    </Typography>
                  ) : remembrances.length === 0 ? (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      No public remembrances yet.
                    </Typography>
                  ) : (
                    <Box sx={{ mt: 1, display: 'grid', gap: 1 }}>
                      {remembrances.slice(0, 3).map((item) => (
                        <Box
                          key={item.id}
                          sx={{
                            p: 1.5,
                            borderRadius: 1,
                            backgroundColor: '#fff',
                            border: '1px solid #e0e0e0'
                          }}
                        >
                          <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                            {item.message}
                          </Typography>
                          <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: '#616161' }}>
                            {item.authorName ? `— ${item.authorName}` : '— Anonymous'}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  )}
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    Offer a Tribute
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {offeringsSummary
                      ? `${offeringsSummary.totalCount} offerings shared`
                      : 'Share a candle, flower, incense, or prayer.'}
                  </Typography>
                  <Box sx={{ display: 'grid', gap: 1, mt: 1 }}>
                    <TextField
                      label="Your name (optional)"
                      size="small"
                      value={offeringName}
                      onChange={(e) => setOfferingName(e.target.value)}
                    />
                    <TextField
                      label="Message (optional)"
                      size="small"
                      multiline
                      minRows={2}
                      value={offeringMessage}
                      onChange={(e) => setOfferingMessage(e.target.value)}
                    />
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {(['CANDLE', 'FLOWER', 'INCENSE', 'PRAYER'] as Offering['offeringType'][]).map(
                        (type) => (
                          <Button
                            key={type}
                            variant="outlined"
                            size="small"
                            onClick={() => handleOffering(type)}
                            disabled={offeringsLoading}
                          >
                            {type.toLowerCase()}
                          </Button>
                        )
                      )}
                    </Box>
                    {offeringsStatus && (
                      <Typography variant="body2" sx={{ color: '#6d4c41' }}>
                        {offeringsStatus}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default SearchPage;
