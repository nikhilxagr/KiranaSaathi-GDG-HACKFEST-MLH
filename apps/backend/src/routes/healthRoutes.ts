import { Router } from 'express';
import { getHealth, getReadiness } from '../controllers/healthController';

const router = Router();

// GET /api/health - Service health check
router.get('/', getHealth);

// GET /api/health/ready - Service readiness check
router.get('/ready', getReadiness);

export default router;
