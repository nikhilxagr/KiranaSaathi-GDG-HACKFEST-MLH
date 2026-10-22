import { Router } from 'express';
import healthRoutes from './healthRoutes';
import productRoutes from './productRoutes';
import saleRoutes from './saleRoutes';
import syncRoutes from './syncRoutes';

const apiRouter = Router();

// Mount individual domain route modules
apiRouter.use('/health', healthRoutes);
apiRouter.use('/products', productRoutes);
apiRouter.use('/sales', saleRoutes);
apiRouter.use('/sync', syncRoutes);

export default apiRouter;
