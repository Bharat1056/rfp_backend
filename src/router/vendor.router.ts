import { Router } from 'express';
import { createVendor, getAllVendors } from '../controller/vendor.controller';

const router = Router()

router.post('/vendors', createVendor);
router.get('/vendors', getAllVendors);

export default router
