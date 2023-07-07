import { Router } from 'express';
import { contactsRouter } from './contacts';
const router = Router();

router.use('/contacts', contactsRouter);

export { router as appRouter };
