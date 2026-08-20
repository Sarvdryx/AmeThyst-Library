import express from 'express';
import { verifyToken } from '../middlewares/auth.middleware.mjs';
import { authorizeRole } from '../middlewares/role.middleware.mjs';
import { validateSystemConfigurationUpdate } from '../middlewares/system-configuration.middlewares.mjs';
import { createSystemConfigurationControllers } from '../controllers/system-configuration.controllers.mjs';

export const createSystemConfigurationRouter = ({ service } = {}) => {
  const router = express.Router();
  const controllers = createSystemConfigurationControllers(service);
  const authorizeAdmin = authorizeRole('admin', { structured: true });
  router.get('/', verifyToken, authorizeAdmin, controllers.getSystemConfiguration);
  router.put('/', verifyToken, authorizeAdmin, validateSystemConfigurationUpdate, controllers.updateSystemConfiguration);
  return router;
};

export default createSystemConfigurationRouter();
