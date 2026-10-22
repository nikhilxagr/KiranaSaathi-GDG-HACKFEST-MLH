import { Router } from 'express';
import healthRoutes from './healthRoutes';

const apiRouter = Router();

// Mount health and readiness endpoints
apiRouter.use('/health', healthRoutes);

export default apiRouter;
