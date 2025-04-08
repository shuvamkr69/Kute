import { Router } from 'express';
import { verifyJWT } from '../middlewares/auth.middleware.js';
const filterRouter = Router();
import { saveFilters, getFilters } from '../controllers/filter.controller.js';

// Save or Update Filters
filterRouter.post('/advanced-filters', verifyJWT, saveFilters);

// Get User Filters
filterRouter.get('/advanced-filters/:userId', verifyJWT, getFilters);

export default filterRouter;
