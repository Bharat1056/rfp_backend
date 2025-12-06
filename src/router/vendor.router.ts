import { Router } from 'express';
import { createVendor, getAllVendors, deleteVendor } from '../controller/vendor.controller';

const router = Router()

router.post('/vendors', createVendor);
router.get('/vendors', getAllVendors);
router.delete('/vendors/:id', deleteVendor);

export default router
