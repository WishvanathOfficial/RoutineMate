import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { validate } from '../middleware/validate.middleware';
import { googleLoginSchema, loginSchema, registerSchema } from '../validators/auth.validator';

const router = Router();

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/google', validate(googleLoginSchema), authController.googleLogin);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);

export default router;
