import { Router } from 'express';
import { userSettingsController } from './userSettings.controller.js';
import { requireAuth } from '../../middlewares/authGuard.js';

export const userSettingsRouter = Router();

userSettingsRouter.get('/', requireAuth, userSettingsController.getAll);
userSettingsRouter.put('/profile', requireAuth, userSettingsController.saveProfile);

userSettingsRouter.post('/addresses', requireAuth, userSettingsController.createAddress);
userSettingsRouter.put('/addresses/:id', requireAuth, userSettingsController.updateAddress);
userSettingsRouter.post('/addresses/:id/default', requireAuth, userSettingsController.setDefaultAddress);
userSettingsRouter.delete('/addresses/:id', requireAuth, userSettingsController.deleteAddress);

userSettingsRouter.put('/refund-bank', requireAuth, userSettingsController.saveRefundBank);
userSettingsRouter.delete('/refund-bank', requireAuth, userSettingsController.deleteRefundBank);

userSettingsRouter.put('/preferences', requireAuth, userSettingsController.savePreferences);
