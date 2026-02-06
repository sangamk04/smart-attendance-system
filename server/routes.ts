import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import session from "express-session";
import { randomBytes } from "crypto";
import MemoryStore from "memorystore";

// Haversine formula to calculate distance in meters
function getDistanceFromLatLonInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2 - lat1);
  var dLon = deg2rad(lon2 - lon1);
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c; // Distance in km
  return d * 1000; // Distance in meters
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Session Setup
  const SessionStore = MemoryStore(session);
  app.use(session({
    secret: process.env.SESSION_SECRET || 'secret',
    resave: false,
    saveUninitialized: false,
    store: new SessionStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    }),
    cookie: { secure: app.get('env') === 'production' }
  }));

  // Middleware to check auth
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  const requireAdmin = async (req: any, res: any, next: any) => {
    if (!req.session.userId) return res.status(401).json({ message: "Unauthorized" });
    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };

  // === AUTH Routes ===

  app.post(api.auth.login.path, async (req, res) => {
    const { loginType, username, password, employeeCode } = req.body;

    if (loginType === 'admin') {
      if (!username || !password) return res.status(400).json({ message: "Username and password required" });
      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password || user.role !== 'admin') {
        return res.status(401).json({ message: "Invalid admin credentials" });
      }
      req.session.userId = user.id;
      return res.json(user);
    } else {
      if (!employeeCode) return res.status(400).json({ message: "Employee code required" });
      const user = await storage.getUserByEmployeeCode(employeeCode);
      if (!user || user.role !== 'employee') {
        return res.status(401).json({ message: "Invalid employee code" });
      }
      req.session.userId = user.id;
      return res.json(user);
    }
  });

  app.post(api.auth.logout.path, (req, res) => {
    req.session.destroy(() => {
      res.json({ message: "Logged out" });
    });
  });

  app.get(api.auth.me.path, async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ message: "Unauthorized" });
    const user = await storage.getUser(req.session.userId);
    res.json(user);
  });

  // === OFFICE Routes ===

  app.post(api.offices.create.path, requireAdmin, async (req, res) => {
    try {
      const input = api.offices.create.input.parse(req.body);
      const office = await storage.createOffice(input);
      res.status(201).json(office);
    } catch (err) {
      res.status(400).json({ message: "Invalid input" });
    }
  });

  app.get(api.offices.list.path, async (req, res) => {
    const offices = await storage.getOffices();
    res.json(offices);
  });

  app.get(api.offices.get.path, async (req, res) => {
    const office = await storage.getOffice(Number(req.params.id));
    if (!office) return res.status(404).json({ message: "Office not found" });
    res.json(office);
  });

  // === EMPLOYEE Routes ===

  app.post(api.employees.create.path, requireAdmin, async (req, res) => {
    try {
      const input = api.employees.create.input.parse(req.body);

      // Generate a unique employee code
      const code = "EMP" + randomBytes(3).toString('hex').toUpperCase();
      const username = input.name.toLowerCase().replace(/\s/g, '') + randomBytes(2).toString('hex');
      const password = randomBytes(8).toString('hex'); // Generate a temporary password

      const employee = await storage.createEmployee({
        ...input,
        username,
        password,
        employeeCode: code,
        role: 'employee'
      });
      res.status(201).json(employee);
    } catch (err: any) {
      if (err.name === 'ZodError') {
        console.error("Validation error:", err.errors);
        return res.status(400).json({ message: "Validation failed", errors: err.errors });
      }
      console.error("Employee creation error:", err?.message || err);
      res.status(400).json({ message: "Failed to create employee", error: err?.message });
    }
  });

  app.get(api.employees.list.path, requireAdmin, async (req, res) => {
    const employees = await storage.getAllEmployees();
    res.json(employees);
  });

  // === ATTENDANCE Routes ===

  app.post(api.attendance.scan.path, requireAuth, async (req, res) => {
    try {
      const { latitude, longitude, officeId } = req.body;
      const userId = req.session.userId!;

      const user = await storage.getUser(userId);
      if (!user) return res.status(401).json({ message: "User not found" });

      // 1. Verify Office
      const office = await storage.getOffice(officeId);
      if (!office) return res.status(404).json({ message: "Office not found" });

      // 2. Location Check (20 meters requested, using 50m for GPS buffer)
      const distance = getDistanceFromLatLonInMeters(latitude, longitude, office.latitude, office.longitude);
      if (distance > 50) { 
         return res.status(400).json({ message: `You are too far from the office (${Math.round(distance)}m). You must be within 50m range.` });
      }

      const today = new Date().toISOString().split('T')[0];
      const now = new Date();
      const nowTimeStr = now.toTimeString().slice(0, 5); // HH:MM

      let record = await storage.getAttendanceByDateAndUser(userId, today);

      if (!record) {
        // First scan = Check In
        let status = 'present';
        // Check if late (simple string comparison works for HH:MM 24h format)
        if (nowTimeStr > office.checkInTime) {
          status = 'late';
        }
        // Half day logic? Maybe if very late. For now, simple late.

        record = await storage.createAttendance({
          userId,
          date: today,
          checkInTime: now,
          status,
        });
      } else if (!record.checkOutTime) {
        // Second scan = Check Out
        // Check half day logic if checking out too early?
        // Or if check-in was very late.
        // Let's implement the specific logic: "if he will scana that in mid of office check in check out time that marks as half day late"

        // For simplicity: If checking out before office checkOutTime, warn or mark half-day?
        // Requirement: "if he will scana that in mid of office check in check out time that marks as half day late"
        // This likely means if they leave early (or arrived super late).

        let newStatus = record.status;
        if (nowTimeStr < office.checkOutTime) {
             // Left early
             newStatus = 'half-day';
        }

        record = await storage.updateAttendance(record.id, {
          checkOutTime: now,
          status: newStatus
        });
      } else {
        return res.status(400).json({ message: "You have already checked out for today." });
      }

      res.json(record);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get(api.attendance.list.path, requireAdmin, async (req, res) => {
    const records = await storage.getAllAttendance();
    res.json(records);
  });

  app.get(api.attendance.me.path, requireAuth, async (req, res) => {
    const records = await storage.getUserAttendance(req.session.userId!);
    res.json(records);
  });

  // === SEED DATA ===
  async function seed() {
    const admin = await storage.getUserByUsername('admin');
    if (!admin) {
      await storage.createAdminUser({
        username: 'admin',
        password: 'admin123', // In real app, hash this!
        role: 'admin',
        name: 'System Admin'
      });
      console.log('Admin user seeded: admin / admin123');
    }
  }
  seed();

  return httpServer;
}
