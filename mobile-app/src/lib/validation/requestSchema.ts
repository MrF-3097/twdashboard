/**
 * Zod Validation Schemas for Request Forms
 * Provides runtime validation for request data
 * 
 * @module requestSchema
 */

import { z } from 'zod';

/**
 * Request form schema
 */
export const requestFormSchema = z.object({
  nume: z.string().min(1, 'Numele este obligatoriu'),
  prenume: z.string().min(1, 'Prenumele este obligatoriu'),
  telefon: z.string()
    .min(10, 'Numărul de telefon trebuie să aibă cel puțin 10 cifre')
    .regex(/^[0-9+\-\s()]+$/, 'Numărul de telefon conține caractere invalide')
    .optional()
    .or(z.literal('')),
  tip_contact: z.string().optional(),
  email: z.string()
    .email('Adresa de email nu este validă')
    .optional()
    .or(z.literal('')),
  tip_proprietate: z.string().optional(),
  camere_min: z.string()
    .optional()
    .refine((val) => !val || (!isNaN(Number(val)) && Number(val) >= 0), {
      message: 'Numărul minim de camere trebuie să fie un număr pozitiv',
    }),
  camere_max: z.string()
    .optional()
    .refine((val) => !val || (!isNaN(Number(val)) && Number(val) >= 0), {
      message: 'Numărul maxim de camere trebuie să fie un număr pozitiv',
    })
    .refine((val, ctx) => {
      const min = ctx.parent.camere_min;
      if (val && min && Number(val) < Number(min)) {
        return false;
      }
      return true;
    }, {
      message: 'Numărul maxim de camere trebuie să fie mai mare sau egal cu minimul',
    }),
  buget_min: z.string()
    .optional()
    .refine((val) => !val || (!isNaN(Number(val)) && Number(val) > 0), {
      message: 'Bugetul minim trebuie să fie un număr pozitiv',
    }),
  buget_max: z.string()
    .optional()
    .refine((val) => !val || (!isNaN(Number(val)) && Number(val) > 0), {
      message: 'Bugetul maxim trebuie să fie un număr pozitiv',
    })
    .refine((val, ctx) => {
      const min = ctx.parent.buget_min;
      if (val && min && Number(val) < Number(min)) {
        return false;
      }
      return true;
    }, {
      message: 'Bugetul maxim trebuie să fie mai mare sau egal cu minimul',
    }),
  comentarii_generale: z.string().optional(),
});

/**
 * Validate request form
 */
export const validateRequestForm = (data: any) => {
  try {
    requestFormSchema.parse(data);
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








