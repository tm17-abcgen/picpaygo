/**
 * Central configuration file for all legal information used across
 * Privacy Policy, Terms & Conditions, and Imprint pages.
 * 
 * Update this file to maintain consistent legal information across all pages.
 */

export interface LegalInfo {
  company: {
    name: string;
    legalForm: string;
    registeredOffice: {
      street: string;
      postalCode: string;
      city: string;
      country: string;
    };
  };
  contact: {
    email: string;
    phone: string;
  };
  responsiblePerson: {
    name: string;
    address: string;
    contact: string;
  };
  tax: {
    vatId?: string;
  };
  regulatory: {
    supervisoryAuthority?: string;
  };
  jurisdiction: {
    country: string;
    region?: string;
  };
  disputeResolution: {
    odrUrl: string;
    participateInODR: boolean;
  };
}

export const legalInfo: LegalInfo = {
  company: {
    name: "PicPayGo",
    legalForm: "",
    registeredOffice: {
      street: "Artilleriestr. 8",
      postalCode: "64285",
      city: "Darmstadt",
      country: "Germany",
    },
  },
  contact: {
    email: "support@picpaygo.com",
    phone: "+49 (0) 176 95827310",
  },
  responsiblePerson: {
    name: "Adrian Estevez",
    address: "Artilleriestr. 8, 64285 Darmstadt, Germany",
    contact: "support@picpaygo.com",
  },
  tax: {
    vatId: "DE360067851",
  },
  regulatory: {
    supervisoryAuthority: undefined,
  },
  jurisdiction: {
    country: "Germany",
    region: undefined,
  },
  disputeResolution: {
    odrUrl: "https://ec.europa.eu/consumers/odr/",
    participateInODR: false,
  },
};

