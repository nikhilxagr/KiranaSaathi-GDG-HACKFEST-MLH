import { Router } from 'express';
import { getHealth, getReadiness, getDbHealth } from '../controllers/healthController';

const router = Router();

// GET /api/health - Service process liveness check
router.get('/', getHealth);

// GET /api/health/db - Actual MongoDB connectivity and ping check
router.get('/db', getDbHealth);

// GET /api/health/ready - Service readiness check
router.get('/ready', getReadiness);

export default router;

