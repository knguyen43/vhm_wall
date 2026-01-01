import { Router } from 'express';
import authRoutes from './auth';
import personRoutes from './persons';
import memorialRoutes from './memorials';
import searchRoutes from './search';
import adminRoutes from './admin';
import locationRoutes from './locations';
import familyRoutes from './family';
import photoRoutes from './photos';

const router = Router();

router.get('/', (req, res) => {
  res.json({ status: 'VHM API', version: 'v1' });
});

router.use('/auth', authRoutes);
router.use('/persons', personRoutes);
router.use('/memorials', memorialRoutes);
router.use('/search', searchRoutes);
router.use('/admin', adminRoutes);
router.use('/locations', locationRoutes);
router.use('/family', familyRoutes);
router.use('/photos', photoRoutes);

export default router;
