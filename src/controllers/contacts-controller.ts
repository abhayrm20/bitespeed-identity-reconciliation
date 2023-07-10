import { Contact, PrecedenceTypes } from '@prisma/client';
import { InternalErrors } from '../configs/errorCodes';
import { BadRequestError } from '../middlewares/errors/bad-request-error';
import { prismaWrapper } from '../services/prisma-wrapper';

class Create {
  static async newPrimary({
    email,
    phoneNumber,
  }: {
    email: string | null;
    phoneNumber: string | null;
  }) {
    const { prisma } = prismaWrapper;
    return await prisma.contact.create({
      data: {
        email,
        phoneNumber,
        linkPrecedence: PrecedenceTypes.primary,
      },
    });
  }

  static async newSecondary({
    email,
    phoneNumber,
    linkedId,
  }: {
    email: string | null;
    phoneNumber: string | null;
    linkedId: number;
  }) {
    const { prisma } = prismaWrapper;
    return await prisma.contact.create({
      data: {
        email,
        phoneNumber,
        linkPrecedence: PrecedenceTypes.secondary,
        linkedId,
      },
    });
  }
}

class Read {
  static async byEmail(email: string) {
    const { prisma } = prismaWrapper;
    return await prisma.contact.findMany({
      where: {
        email,
      },
    });
  }
  static async byPhoneNumber(phoneNumber: string) {
    const { prisma } = prismaWrapper;
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
    email: string | null;
    phoneNumber: string | null;
  }) {
    if (!email && !phoneNumber) {
      throw new BadRequestError(InternalErrors.illegalImplementation);
    }

    if (email && !phoneNumber) {
      return await this.byEmail(email);
    } else if (!email && phoneNumber) {
      return await this.byPhoneNumber(phoneNumber);
    } else {
      const { prisma } = prismaWrapper;
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
        orderBy: {
          createdAt: 'asc',
        },
      });
    }
  }

  static async contactDetailsByPrimaryId(id: number) {
    const { prisma } = prismaWrapper;

    return await prisma.contact.findMany({
      where: {
        OR: [{ id }, { linkedId: id }],
      },
    });
  }
}

class Update {
  static async markAsPrimary(contactId: number) {
    const { prisma } = prismaWrapper;
    return await prisma.contact.update({
      where: {
        id: contactId,
      },
      data: {
        linkPrecedence: PrecedenceTypes.primary,
        linkedId: null,
      },
    });
  }
  static async markAsSecondary(contactId: number, primaryContactId: number) {
    const { prisma } = prismaWrapper;
    return await prisma.contact.update({
      where: {
        id: contactId,
      },
      data: {
        linkPrecedence: PrecedenceTypes.secondary,
        linkedId: primaryContactId,
      },
    });
  }

  static async markMultipleAsSecondary(
    contactIds: number[],
    primaryContactId: number
  ) {
    const { prisma } = prismaWrapper;
    const updatedContacts = [];

    for (let contactId of contactIds) {
      const updatedContact = await this.markAsSecondary(
        contactId,
        primaryContactId
      );

      updatedContacts.push(updatedContact);

      // * Checking if any secondary contacts were previously linked to this contact
      const secondaryContacts = await prisma.contact.findMany({
        where: {
          linkedId: contactId,
        },
      });

      if (!secondaryContacts.length) continue;

      for (let secondaryContact of secondaryContacts) {
        const updatedSecondaryContact = await this.markAsSecondary(
          secondaryContact.id,
          primaryContactId
        );

        updatedContacts.push(updatedSecondaryContact);
      }
    }

    return updatedContacts;
  }
}

class Utils {
  static async identify({
    email,
    phoneNumber,
  }: {
    email: string | null;
    phoneNumber: string | null;
  }) {
    // * Read existing contacts
    const existingContacts: Contact[] = await Read.byEmailOrPhone({
      email,
      phoneNumber,
    });

    // * If there are no contacts with same, create a new primary contact
    if (!existingContacts.length) {
      const contact = await Create.newPrimary({ email, phoneNumber });
      return {
        primaryContact: contact,
        contacts: [contact],
      };
    }

    /*
     * If there are contacts with same details,
     * 1. Same email and phone number: process existing data
     * 2. Same email, different phone: create new secondary, process data
     * 3. Same phone, different email: create new secondary, process data
     *
     * Finally check if there are multiple primaries and merge
     */

    // * finding primary contact ID
    let primaryContactId: number;
    const _primaryContact = existingContacts.find(
      (contact) => contact.linkPrecedence === PrecedenceTypes.primary
    );

    if (_primaryContact) {
      primaryContactId = _primaryContact.id;
    } else {
      const linkedId = existingContacts.find(
        (contact) => !!contact.linkedId
      )?.linkedId;

      if (linkedId) {
        primaryContactId = linkedId;
      } else {
        throw new BadRequestError(InternalErrors.somethingWentWrong);
      }
    }

    // * Reading all contacts linked to primary contact
    const contactsLinkedToPrimary = await Read.contactDetailsByPrimaryId(
      primaryContactId
    );

    // * Consolidating all the contacts
    for (let contact of contactsLinkedToPrimary) {
      const doesExist = existingContacts.find(
        (_contact) => _contact.id === contact.id
      );

      if (!doesExist) {
        existingContacts.push(contact);
      }
    }

    // * Sorting contacts
    // ? Existing contacts was a sorted array, but sorting again in case the entries were added from previous block
    const sortedContacts = existingContacts.sort((a, b) => {
      return a.createdAt.getTime() - b.createdAt.getTime();
    });

    const primaryContacts = sortedContacts.filter(
      (contact) => contact.linkPrecedence === PrecedenceTypes.primary
    );

    const primaryContact = primaryContacts[0];

    // * handling multiple primary contacts
    if (primaryContacts.length > 1) {
      // ? Everything but the oldest one
      const contactsToBeMarkedAsSecondary = primaryContacts.slice(
        1,
        primaryContacts.length
      );

      const updatedContacts = await Update.markMultipleAsSecondary(
        contactsToBeMarkedAsSecondary.map((contact) => contact.id),
        primaryContact.id
      );

      for (let contact of updatedContacts) {
        const index = sortedContacts.findIndex(
          (_contact) => _contact.id === contact.id
        );

        // * Replacing updated contacts in the sorted contacts list
        sortedContacts.splice(index, 1, contact);
      }
    }

    // * Check if there's a contact with same details
    const contactWithSamePhoneNumber = sortedContacts.find(
      (contact) => phoneNumber === contact.phoneNumber
    );
    const contactWithSameEmail = sortedContacts.find(
      (contact) => email === contact.email
    );

    // * If there's no contact with same details, creating a new secondary contact
    if (
      (email && !contactWithSameEmail) ||
      (phoneNumber && !contactWithSamePhoneNumber)
    ) {
      const newContact = await Create.newSecondary({
        email,
        phoneNumber,
        linkedId: primaryContact.id,
      });

      sortedContacts.push(newContact);
    }

    return {
      primaryContact,
      contacts: sortedContacts,
    };
  }
}

export default {
  Create,
  Read,
  Update,
  Utils,
};
