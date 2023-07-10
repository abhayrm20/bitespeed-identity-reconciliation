import { Router, Request, Response } from 'express';
import { body } from 'express-validator';
import { validateRequest } from '../middlewares/validate-request';
import contactsController from '../controllers/contacts-controller';
import { Contact, PrecedenceTypes } from '@prisma/client';
const router = Router();

router.post(
  '/identify',
  body('email')
    .optional({ nullable: true })
    .isEmail()
    .if(body('phoneNumber').not().exists())
    .exists({ checkFalsy: true })
    .withMessage('Invalid email ID'),
  body('phoneNumber')
    .optional({ nullable: true })
    .isString()
    .isNumeric()
    .if(body('email').not().exists())
    .exists({ checkFalsy: true })
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

    const { primaryContact, contacts } =
      await contactsController.Utils.identify({
        email: email || null,
        phoneNumber: phoneNumber || null,
      });

    res.status(200).json(Formatters.identifyResponse(primaryContact, contacts));
  }
);

class Formatters {
  static identifyResponse(primaryContact: Contact, contacts: Contact[]) {
    const emails = new Set<string>(),
      phoneNumbers = new Set<string>(),
      secondaryContactIds = new Set<number>();

    const primaryContactId = primaryContact.id;

    for (let contact of contacts) {
      if (contact.email) emails.add(contact.email);
      if (contact.phoneNumber) phoneNumbers.add(contact.phoneNumber);
      if (contact.linkPrecedence === PrecedenceTypes.secondary) {
        secondaryContactIds.add(contact.id);
      }
    }

    return {
      contact: {
        primaryContactId,
        emails: Array.from(emails),
        phoneNumbers: Array.from(phoneNumbers),
        secondaryContactIds: Array.from(secondaryContactIds),
      },
    };
  }
}

export { router as appRouter };
