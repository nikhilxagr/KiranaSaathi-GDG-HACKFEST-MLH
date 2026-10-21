import { Router } from 'express';
import healthRoutes from './healthRoutes';

const apiRouter = Router();

// Mount individual domain route modules
apiRouter.use('/health', healthRoutes);

export default apiRouter;
