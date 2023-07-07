import { PrecedenceTypes } from '@prisma/client';
import { NotAllowedErrors } from '../configs/errorCodes';
import { BadRequestError } from '../middlewares/errors/bad-request-error';
import { prismaWrapper } from '../services/prisma-wrapper';

const { prisma } = prismaWrapper;

class Create {
  static async newIfNotExists({
    email,
    phoneNumber,
  }: {
    email?: string;
    phoneNumber?: string;
  }) {
    const existingContacts = await Read.byEmailOrPhone({
      email,
      phoneNumber,
    });

    if (existingContacts.length > 0) {
      return existingContacts;
    }

    return await prisma.contact.create({
      data: {
        email,
        phoneNumber,
        linkPrecedence: PrecedenceTypes.primary,
      },
    });
  }
}

class Read {
  static async byEmail(email: string) {
    return await prisma.contact.findMany({
      where: {
        email,
      },
    });
  }
  static async byPhoneNumber(phoneNumber: string) {
    return await prisma.contact.findMany({
      where: {
        phoneNumber,
      },
    });
  }

  static async byEmailOrPhone({
    email,
    phoneNumber,
  }: {
    email?: string;
    phoneNumber?: string;
  }) {
    if (!email && !phoneNumber) {
      throw new BadRequestError(NotAllowedErrors.illegalImplementation);
    }

    if (email && !phoneNumber) {
      return await this.byEmail(email);
    } else if (!email && phoneNumber) {
      return await this.byPhoneNumber(phoneNumber);
    } else {
      return await prisma.contact.findMany({
        where: {
          OR: [
            {
              email,
            },
            {
              phoneNumber,
            },
          ],
        },
      });
    }
  }
}

class Update {}

class Delete {}

export default {
  Create,
  Read,
  Update,
  Delete,
};
