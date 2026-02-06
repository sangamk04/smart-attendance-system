import { z } from 'zod';
import { insertOfficeSchema, insertUserSchema, offices, users, attendance } from './schema';

// ============================================
// SHARED ERROR SCHEMAS
// ============================================
export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
  forbidden: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

// ============================================
// API CONTRACT
// ============================================
export const api = {
  auth: {
    login: {
      method: 'POST' as const,
      path: '/api/login',
      input: z.object({
        username: z.string().optional(),
        password: z.string().optional(),
        employeeCode: z.string().optional(),
        loginType: z.enum(['admin', 'employee']),
      }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
    logout: {
      method: 'POST' as const,
      path: '/api/logout',
      responses: {
        200: z.void(),
      },
    },
    me: {
      method: 'GET' as const,
      path: '/api/me',
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
  },
  offices: {
    create: {
      method: 'POST' as const,
      path: '/api/offices',
      input: insertOfficeSchema,
      responses: {
        201: z.custom<typeof offices.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    list: {
      method: 'GET' as const,
      path: '/api/offices',
      responses: {
        200: z.array(z.custom<typeof offices.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/offices/:id',
      responses: {
        200: z.custom<typeof offices.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
  employees: {
    create: {
      method: 'POST' as const,
      path: '/api/employees',
      input: z.object({
        name: z.string(),
        officeId: z.number(),
      }),
      responses: {
        201: z.custom<typeof users.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    list: {
      method: 'GET' as const,
      path: '/api/employees',
      responses: {
        200: z.array(z.custom<typeof users.$inferSelect & { office?: typeof offices.$inferSelect }>()),
      },
    },
  },
  attendance: {
    scan: {
      method: 'POST' as const,
      path: '/api/attendance/scan',
      input: z.object({
        latitude: z.number(),
        longitude: z.number(),
        officeId: z.number(),
      }),
      responses: {
        200: z.custom<typeof attendance.$inferSelect>(),
        400: errorSchemas.validation, // Too far, wrong office, etc.
      },
    },
    list: {
      method: 'GET' as const,
      path: '/api/attendance',
      input: z.object({
        status: z.enum(['present', 'late', 'half-day', 'absent']).optional(),
        date: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof attendance.$inferSelect & { user?: typeof users.$inferSelect }>()),
      },
    },
    me: {
      method: 'GET' as const,
      path: '/api/attendance/me',
      responses: {
        200: z.array(z.custom<typeof attendance.$inferSelect>()),
      },
    },
  },
};

// ============================================
// REQUIRED: buildUrl helper
// ============================================
export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
