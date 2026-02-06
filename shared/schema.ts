import {
  mysqlTable,
  int,
  varchar,
  text,
  double,
  timestamp,
  mysqlEnum,
  index,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

/* =======================
   TABLE DEFINITIONS
======================= */

// Offices
export const offices = mysqlTable("offices", {
  id: int("id").autoincrement().primaryKey(),
  name: text("name").notNull(),
  latitude: double("latitude").notNull(),
  longitude: double("longitude").notNull(),
  checkInTime: varchar("check_in_time", { length: 5 }).notNull(),   // HH:mm
  checkOutTime: varchar("check_out_time", { length: 5 }).notNull(), // HH:mm
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
});

// Users (Admin and Employees)
export const users = mysqlTable(
  "users",
  {
    id: int("id").autoincrement().primaryKey(),
    username: varchar("username", { length: 100 }).notNull().unique(),
    password: text("password").notNull(),
    role: mysqlEnum("role", ["admin", "employee"])
      .notNull()
      .default("employee"),
    name: text("name").notNull(),
    employeeCode: varchar("employee_code", { length: 50 }).unique(),
    officeId: int("office_id").references(() => offices.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
  },
  (table) => ({
    officeIdx: index("idx_users_office_id").on(table.officeId),
  })
);

// Attendance Records
export const attendance = mysqlTable(
  "attendance",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
    checkInTime: timestamp("check_in_time", { mode: "date" }),
    checkOutTime: timestamp("check_out_time", { mode: "date" }),
    status: mysqlEnum("status", ["present", "late", "half-day", "absent"])
      .notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
  },
  (table) => ({
    userIdx: index("idx_attendance_user_id").on(table.userId),
    dateIdx: index("idx_attendance_date").on(table.date),
  })
);

export const usersRelations = relations(users, ({ one, many }) => ({
  office: one(offices, {
    fields: [users.officeId],
    references: [offices.id],
  }),
  attendance: many(attendance),
}));

export const officesRelations = relations(offices, ({ many }) => ({
  users: many(users),
}));

export const attendanceRelations = relations(attendance, ({ one }) => ({
  user: one(users, {
    fields: [attendance.userId],
    references: [users.id],
  }),
}));

export const insertOfficeSchema = createInsertSchema(offices).omit({
  id: true,
  createdAt: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertAttendanceSchema = createInsertSchema(attendance).omit({
  id: true,
  createdAt: true,
});

export type Office = typeof offices.$inferSelect;
export type User = typeof users.$inferSelect;
export type Attendance = typeof attendance.$inferSelect;

export type CreateOfficeRequest = z.infer<typeof insertOfficeSchema>;

export type CreateEmployeeRequest = {
  name: string;
  officeId: number;
};

export type LoginRequest = {
  username?: string;
  password?: string;
  employeeCode?: string;
  loginType: "admin" | "employee";
};

export type ScanAttendanceRequest = {
  latitude: number;
  longitude: number;
  officeId: number;
};

export type AuthResponse = User;
export type OfficeResponse = Office;
export type UserResponse = User & { office?: Office };
export type AttendanceResponse = Attendance & { user?: User };