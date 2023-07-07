import { Router, Request, Response } from 'express';
import { body } from 'express-validator';
import { validateRequest } from '../middlewares/validate-request';
const router = Router();

router.post(
  '/identify',
  body('email')
    .optional()
    .if(body('phoneNumber').not().exists())
    .exists({ checkFalsy: true })
    .isEmail()
    .withMessage('Invalid email ID'),
  body('phoneNumber')
    .optional()
    .if(body('email').not().exists())
    .exists({ checkFalsy: true })
    .isString()
    .isNumeric()
    .isLength({ min: 10, max: 10 })
    .withMessage('Invalid phone number'),
  validateRequest,
  async (req: Request, res: Response) => {
    // * Extracting fields from body
    const {
      email,
      phoneNumber,
    }: {
      email?: string;
      phoneNumber?: string;
    } = req.body;
  }
);

export { router as contactsRouter };
