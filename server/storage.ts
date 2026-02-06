import { db } from "./db";
import {
  users,
  offices,
  attendance,
  type User,
  type Office,
  type Attendance,
  type CreateOfficeRequest,
} from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
type UserPublic = Omit<User, "password">;
/* =======================
   HELPER: INSERT + FETCH (FIXED)
======================= */
async function insertAndFetch<T>(
  table: any,
  values: any,
  idColumn: any
): Promise<T> {
  const result: any = await db.insert(table).values(values);

  // ✅ FIX: MySQL insert result shape
  const insertId =
    Array.isArray(result) && result[0]?.insertId
      ? Number(result[0].insertId)
      : Number((result as any)?.insertId);

  if (!insertId || Number.isNaN(insertId)) {
    throw new Error("MySQL insert failed: insertId not found");
  }

  const [row] = await db
    .select()
    .from(table)
    .where(eq(idColumn, insertId));

  return row;
}

/* =======================
   STORAGE INTERFACE
======================= */
export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmployeeCode(code: string): Promise<User | undefined>;

  createAdminUser(user: Partial<User>): Promise<User>;
  createEmployee(
    employee: Partial<User> & { username: string; employeeCode: string }
  ): Promise<User>;

  getAllEmployees(): Promise<(User & { office: Office | null })[]>;

  createOffice(office: CreateOfficeRequest): Promise<Office>;
  getOffices(): Promise<Office[]>;
  getOffice(id: number): Promise<Office | undefined>;

  createAttendance(attendance: Partial<Attendance>): Promise<Attendance>;
  updateAttendance(id: number, updates: Partial<Attendance>): Promise<Attendance>;
  getAttendanceByDateAndUser(
    userId: number,
    date: string
  ): Promise<Attendance | undefined>;
  // getAllAttendance(): Promise<(Attendance & { user: User | null })[]>;
  getUserAttendance(userId: number): Promise<Attendance[]>;
}

/* =======================
   DATABASE STORAGE
======================= */
export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return user;
  }

  async getUserByEmployeeCode(code: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.employeeCode, code));
    return user;
  }

  async createAdminUser(user: Partial<User>): Promise<User> {
    return insertAndFetch<User>(users, user, users.id);
  }

  async createEmployee(
    employee: Partial<User> & { username: string; employeeCode: string }
  ): Promise<User> {
    return insertAndFetch<User>(
      users,
      {
        username: employee.username,
        password: employee.password || "",
        role: employee.role || "employee",
        name: employee.name || "",
        employeeCode: employee.employeeCode,
        officeId: employee.officeId,
      },
      users.id
    );
  }

  // async getAllEmployees(): Promise<(User & { office: Office | null })[]> {
  //   return db.query.users.findMany({
  //     where: eq(users.role, "employee"),
  //     with: { office: true },
  //     orderBy: desc(users.createdAt),
  //   });
  // }
  async getAllEmployees() {
    const rows = await db
      .select({
        id: users.id,
        username: users.username,
        password: users.password,
        role: users.role,
        name: users.name,
        employeeCode: users.employeeCode,
        officeId: users.officeId,
        createdAt: users.createdAt,

        office: {
          id: offices.id,
          name: offices.name,
          latitude: offices.latitude,
          longitude: offices.longitude,
          checkInTime: offices.checkInTime,
          checkOutTime: offices.checkOutTime,
          createdAt: offices.createdAt,
        },
      })
      .from(users)
      .leftJoin(offices, eq(users.officeId, offices.id))
      .where(eq(users.role, "employee"))
      .orderBy(desc(users.createdAt));

    return rows.map((row) => ({
      ...row,
      office: row.office?.id ? row.office : null,
    }));
  }
  async createOffice(office: CreateOfficeRequest): Promise<Office> {
    return insertAndFetch<Office>(offices, office, offices.id);
  }

  async getOffices(): Promise<Office[]> {
    return db.select().from(offices).orderBy(desc(offices.createdAt));
  }

  async getOffice(id: number): Promise<Office | undefined> {
    const [office] = await db
      .select()
      .from(offices)
      .where(eq(offices.id, id));
    return office;
  }

  async createAttendance(record: Partial<Attendance>): Promise<Attendance> {
    return insertAndFetch<Attendance>(
      attendance,
      record,
      attendance.id
    );
  }

  async updateAttendance(
    id: number,
    updates: Partial<Attendance>
  ): Promise<Attendance> {
    await db
      .update(attendance)
      .set(updates)
      .where(eq(attendance.id, id));

    const [updated] = await db
      .select()
      .from(attendance)
      .where(eq(attendance.id, id));

    return updated;
  }

  async getAttendanceByDateAndUser(
    userId: number,
    date: string
  ): Promise<Attendance | undefined> {
    const [record] = await db
      .select()
      .from(attendance)
      .where(and(eq(attendance.userId, userId), eq(attendance.date, date)));

    return record;
  }

  // async getAllAttendance(): Promise<(Attendance & { user: User | null })[]> {
  //   return db.query.attendance.findMany({
  //     with: { user: true },
  //     orderBy: desc(attendance.date),
  //   });
  // }


  async getAllAttendance(): Promise<(Attendance & { user: UserPublic | null })[]> {
    const rows = await db
      .select({
        id: attendance.id,
        userId: attendance.userId,
        date: attendance.date,
        checkInTime: attendance.checkInTime,
        checkOutTime: attendance.checkOutTime,
        status: attendance.status,
        createdAt: attendance.createdAt,
        user: {
          id: users.id,
          username: users.username,
          role: users.role,
          name: users.name,
          employeeCode: users.employeeCode,
          officeId: users.officeId,
          createdAt: users.createdAt,
        },
      })
      .from(attendance)
      .leftJoin(users, eq(attendance.userId, users.id))
      .orderBy(desc(attendance.date));

    return rows.map((row) => ({
      ...row,
      user: row.user?.id ? row.user : null,
    }));
  }
  async getUserAttendance(userId: number): Promise<Attendance[]> {
    return db
      .select()
      .from(attendance)
      .where(eq(attendance.userId, userId))
      .orderBy(desc(attendance.date));
  }
}

/* =======================
   EXPORT INSTANCE
======================= */
export const storage = new DatabaseStorage();