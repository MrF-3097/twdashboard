/**
 * Zod Validation Schemas for Property Forms
 * Provides runtime validation for property data
 * 
 * @module propertySchema
 */

import { z } from 'zod';

/**
 * Contact information schema
 */
export const contactSchema = z.object({
  firstName: z.string().min(1, 'Prenumele este obligatoriu'),
  lastName: z.string().min(1, 'Numele este obligatoriu'),
  cnp: z.string()
    .regex(/^\d{13}$/, 'CNP-ul trebuie să aibă exact 13 cifre')
    .optional()
    .or(z.literal('')),
  phone: z.string()
    .min(10, 'Numărul de telefon trebuie să aibă cel puțin 10 cifre')
    .regex(/^[0-9+\-\s()]+$/, 'Numărul de telefon conține caractere invalide'),
  email: z.string()
    .email('Adresa de email nu este validă')
    .optional()
    .or(z.literal('')),
});

/**
 * Property location schema
 */
export const locationSchema = z.object({
  street: z.string().min(1, 'Strada este obligatorie'),
  streetNumber: z.string().optional(),
  city: z.string().min(1, 'Orașul este obligatoriu'),
  county: z.string().optional(),
  unit: z.string().optional(),
  lat: z.string().optional(),
  lng: z.string().optional(),
});

/**
 * Property pricing schema
 */
export const pricingSchema = z.object({
  salePrice: z.string()
    .optional()
    .refine((val) => !val || (!isNaN(Number(val)) && Number(val) > 0), {
      message: 'Prețul de vânzare trebuie să fie un număr pozitiv',
    }),
  rentPrice: z.string()
    .optional()
    .refine((val) => !val || (!isNaN(Number(val)) && Number(val) > 0), {
      message: 'Prețul de închiriere trebuie să fie un număr pozitiv',
    }),
  includesVAT: z.boolean().optional(),
  commission: z.string()
    .optional()
    .refine((val) => !val || (!isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 100), {
      message: 'Comisionul trebuie să fie între 0 și 100',
    }),
});

/**
 * Property form schema (partial - for step validation)
 */
export const propertyFormSchema = z.object({
  contact: contactSchema,
  property: z.object({
    propertyType: z.string().min(1, 'Tipul proprietății este obligatoriu'),
    cfNumber: z.string().optional(),
    transactionMode: z.enum(['sale', 'rent', 'both'], {
      errorMap: () => ({ message: 'Modul de tranzacție este obligatoriu' }),
    }),
    representationType: z.string().min(1, 'Tipul de reprezentare este obligatoriu'),
    location: locationSchema,
    pricing: pricingSchema,
  }),
});

/**
 * Validate contact step
 */
export const validateContactStep = (data: any) => {
  try {
    contactSchema.parse(data);
    return { valid: true, errors: {} };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach((err) => {
        if (err.path.length > 0) {
          errors[err.path[0] as string] = err.message;
        }
      });
      return { valid: false, errors };
    }
    return { valid: false, errors: { general: 'Eroare de validare' } };
  }
};

/**
 * Validate location step
 */
export const validateLocationStep = (data: any) => {
  try {
    locationSchema.parse(data);
    return { valid: true, errors: {} };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach((err) => {
        if (err.path.length > 0) {
          errors[err.path[0] as string] = err.message;
        }
      });
      return { valid: false, errors };
    }
    return { valid: false, errors: { general: 'Eroare de validare' } };
  }
};

/**
 * Validate pricing step
 */
export const validatePricingStep = (data: any) => {
  try {
    pricingSchema.parse(data);
    return { valid: true, errors: {} };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach((err) => {
        if (err.path.length > 0) {
          errors[err.path[0] as string] = err.message;
        }
      });
      return { valid: false, errors };
    }
    return { valid: false, errors: { general: 'Eroare de validare' } };
  }
};








