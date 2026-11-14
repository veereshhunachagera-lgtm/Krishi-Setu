import 'dotenv/config';
import express, { type NextFunction, type Request, type Response } from 'express';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { createServer as createViteServer } from 'vite';

interface SoilReportRecord {
  nitrogenKgPerHa: number | null;
  phosphorusKgPerHa: number | null;
  potassiumKgPerHa: number | null;
  phLevel: number | null;
  nitrogenUnknown: boolean;
  phosphorusUnknown: boolean;
  potassiumUnknown: boolean;
  phUnknown: boolean;
  labName: string | null;
  sampleDate: string | null;
}

interface UserRecord {
  id: string;
  fullName: string;
  email: string;
  passwordHash: string;
  role: 'FARMER' | 'ADMIN';
  preferredLanguage: 'en' | 'kn';
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

interface FarmerProfileRecord {
  id: string;
  userId: string;
  hasSoilReport: boolean;
  farmerName: string;
  state: string | null;
  district: string | null;
  village: string | null;
  landSize: number | null;
  landUnit: string | null;
  soilType: string | null;
  irrigationSource: string | null;
  currentOrPreviousCrop: string | null;
  growingSeason: string | null;
  soilReport: SoilReportRecord | null;
  createdAt: string;
  updatedAt: string;
}

interface NotificationRecord {
  id: string;
  userId: string;
  titleKey: string;
  messageKey: string;
  category: string;
  read: boolean;
  createdAt: string;
}

interface DatabaseSchema {
  users: UserRecord[];
  profiles: FarmerProfileRecord[];
  notifications: NotificationRecord[];
}

interface AuthenticatedRequest extends Request {
  authUser?: {
    id: string;
    role: 'FARMER' | 'ADMIN';
  };
}

const PORT = 3000;
const DATA_DIR = path.resolve(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'krishisetu.db.json');
const JWT_SECRET = process.env.JWT_SECRET || 'krishisetu_dev_phase1_secret_key_change_in_prod';

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, key] = storedHash.split(':');
  if (!salt || !key) return false;
  const derived = crypto.scryptSync(password, salt, 64);
  const keyBuf = Buffer.from(key, 'hex');
  if (derived.length !== keyBuf.length) return false;
  return crypto.timingSafeEqual(derived, keyBuf);
}

function base64UrlEncode(input: string | Buffer): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(input: string): string {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((input.length + 3) % 4);
  return Buffer.from(padded, 'base64').toString('utf8');
}

function signJwt(user: UserRecord): string {
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const payload = base64UrlEncode(
    JSON.stringify({
      sub: user.id,
      email: user.email,
      role: user.role,
      iat: now,
      exp: now + 86400,
    }),
  );
  const signature = base64UrlEncode(
    crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${payload}`).digest(),
  );
  return `${header}.${payload}.${signature}`;
}

function verifyJwt(token: string): { sub: string; role: 'FARMER' | 'ADMIN' } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, payload, signature] = parts;
    const expectedSig = base64UrlEncode(
      crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${payload}`).digest(),
    );
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }
    const decoded = JSON.parse(base64UrlDecode(payload)) as {
      sub: string;
      role: 'FARMER' | 'ADMIN';
      exp: number;
    };
    if (!decoded.sub || !decoded.exp || decoded.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return { sub: decoded.sub, role: decoded.role };
  } catch {
    return null;
  }
}

function seedInitialDatabase(): DatabaseSchema {
  const now = new Date().toISOString();
  const adminId = crypto.randomUUID();
  const demoFarmerId = crypto.randomUUID();
  const demoProfileId = crypto.randomUUID();

  return {
    users: [
      {
        id: adminId,
        fullName: 'KrishiSetu State Admin',
        email: 'admin@krishisetu.in',
        passwordHash: hashPassword('Admin@123'),
        role: 'ADMIN',
        preferredLanguage: 'en',
        onboardingCompleted: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: demoFarmerId,
        fullName: 'Ramesh Gowda',
        email: 'ramesh.farmer@krishisetu.in',
        passwordHash: hashPassword('Farmer@123'),
        role: 'FARMER',
        preferredLanguage: 'en',
        onboardingCompleted: true,
        createdAt: now,
        updatedAt: now,
      },
    ],
    profiles: [
      {
        id: demoProfileId,
        userId: demoFarmerId,
        hasSoilReport: true,
        farmerName: 'Ramesh Gowda',
        state: 'Karnataka',
        district: 'Mandya',
        village: 'Maddur',
        landSize: 3.5,
        landUnit: 'ACRES',
        soilType: 'RED',
        irrigationSource: 'CANAL',
        currentOrPreviousCrop: 'Ragi (Finger Millet)',
        growingSeason: 'KHARIF',
        soilReport: {
          nitrogenKgPerHa: 245,
          phosphorusKgPerHa: 28.5,
          potassiumKgPerHa: 190,
          phLevel: 6.4,
          nitrogenUnknown: false,
          phosphorusUnknown: false,
          potassiumUnknown: false,
          phUnknown: false,
          labName: 'Mandya Krishi Vigyan Kendra',
          sampleDate: '2026-09-18',
        },
        createdAt: now,
        updatedAt: now,
      },
    ],
    notifications: [
      {
        id: crypto.randomUUID(),
        userId: demoFarmerId,
        titleKey: 'notifications.items.welcomeTitle',
        messageKey: 'notifications.items.welcomeMessage',
        category: 'ONBOARDING',
        read: false,
        createdAt: now,
      },
    ],
  };
}

function readDb(): DatabaseSchema {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    const initial = seedInitialDatabase();
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf8');
    return initial;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(raw) as DatabaseSchema;
  } catch {
    const fallback = seedInitialDatabase();
    fs.writeFileSync(DB_FILE, JSON.stringify(fallback, null, 2), 'utf8');
    return fallback;
  }
}

function writeDb(db: DatabaseSchema): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
}

function toUserSummary(user: UserRecord) {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    preferredLanguage: user.preferredLanguage,
    onboardingCompleted: user.onboardingCompleted,
  };
}

function toProfileResponse(profile: FarmerProfileRecord, email: string) {
  return {
    id: profile.id,
    userId: profile.userId,
    hasSoilReport: profile.hasSoilReport,
    farmerName: profile.farmerName,
    email,
    state: profile.state,
    district: profile.district,
    village: profile.village,
    landSize: profile.landSize,
    landUnit: profile.landUnit,
    soilType: profile.soilType,
    irrigationSource: profile.irrigationSource,
    currentOrPreviousCrop: profile.currentOrPreviousCrop,
    growingSeason: profile.growingSeason,
    soilReport: profile.soilReport,
    updatedAt: profile.updatedAt,
  };
}

function sendError(
  res: Response,
  status: number,
  error: string,
  message: string,
  fieldErrors: Record<string, string> | null = null,
) {
  res.status(status).json({
    status,
    error,
    message,
    fieldErrors,
    timestamp: new Date().toISOString(),
  });
}

function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    sendError(res, 401, 'UNAUTHORIZED', 'Authentication token is missing.');
    return;
  }
  const token = authHeader.slice(7);
  const claims = verifyJwt(token);
  if (!claims) {
    sendError(res, 401, 'UNAUTHORIZED', 'Invalid or expired authentication token.');
    return;
  }
  req.authUser = { id: claims.sub, role: claims.role };
  next();
}

function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.authUser || req.authUser.role !== 'ADMIN') {
    sendError(res, 403, 'FORBIDDEN', 'Administrator role required.');
    return;
  }
  next();
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  // Ensure DB is initialized on boot
  readDb();

  app.get('/api/v1/health', (_req, res) => {
    res.json({
      status: 'UP',
      service: 'krishisetu-node-runtime',
      springBootEquivalent: 'backend/',
    });
  });

  app.post('/api/v1/auth/register', (req, res) => {
    const { fullName, email, password, preferredLanguage } = req.body ?? {};
    const fieldErrors: Record<string, string> = {};

    if (typeof fullName !== 'string' || fullName.trim().length < 2) {
      fieldErrors.fullName = 'Full name must be at least 2 characters.';
    }
    if (typeof email !== 'string' || !isValidEmail(email.trim())) {
      fieldErrors.email = 'A valid email address is required.';
    }
    if (typeof password !== 'string' || password.length < 8) {
      fieldErrors.password = 'Password must be at least 8 characters.';
    }
    if (Object.keys(fieldErrors).length > 0) {
      sendError(res, 400, 'VALIDATION_ERROR', 'Input validation failed.', fieldErrors);
      return;
    }

    const db = readDb();
    const normalizedEmail = email.trim().toLowerCase();
    if (db.users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
      sendError(res, 400, 'BAD_REQUEST', 'An account with this email already exists.');
      return;
    }

    const now = new Date().toISOString();
    const newUser: UserRecord = {
      id: crypto.randomUUID(),
      fullName: fullName.trim(),
      email: normalizedEmail,
      passwordHash: hashPassword(password),
      role: 'FARMER',
      preferredLanguage: preferredLanguage === 'kn' ? 'kn' : 'en',
      onboardingCompleted: false,
      createdAt: now,
      updatedAt: now,
    };

    db.users.push(newUser);
    db.notifications.push({
      id: crypto.randomUUID(),
      userId: newUser.id,
      titleKey: 'notifications.items.accountCreatedTitle',
      messageKey: 'notifications.items.accountCreatedMessage',
      category: 'ACCOUNT',
      read: false,
      createdAt: now,
    });
    writeDb(db);

    res.status(201).json({
      token: signJwt(newUser),
      user: toUserSummary(newUser),
    });
  });

  app.post('/api/v1/auth/login', (req, res) => {
    const { email, password } = req.body ?? {};
    if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
      sendError(res, 400, 'VALIDATION_ERROR', 'Email and password are required.');
      return;
    }

    const db = readDb();
    const user = db.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!user || !verifyPassword(password, user.passwordHash)) {
      sendError(res, 401, 'UNAUTHORIZED', 'Invalid email or password.');
      return;
    }
    if (user.role !== 'FARMER') {
      sendError(res, 403, 'FORBIDDEN', 'Please use the administrator portal for admin accounts.');
      return;
    }

    res.json({
      token: signJwt(user),
      user: toUserSummary(user),
    });
  });

  app.post('/api/v1/auth/admin/login', (req, res) => {
    const { email, password } = req.body ?? {};
    if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
      sendError(res, 400, 'VALIDATION_ERROR', 'Email and password are required.');
      return;
    }

    const db = readDb();
    const user = db.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!user || !verifyPassword(password, user.passwordHash)) {
      sendError(res, 401, 'UNAUTHORIZED', 'Invalid email or password.');
      return;
    }
    if (user.role !== 'ADMIN') {
      sendError(res, 403, 'FORBIDDEN', 'Administrator privileges required.');
      return;
    }

    res.json({
      token: signJwt(user),
      user: toUserSummary(user),
    });
  });

  app.get('/api/v1/auth/me', requireAuth, (req: AuthenticatedRequest, res) => {
    const db = readDb();
    const user = db.users.find((u) => u.id === req.authUser?.id);
    if (!user) {
      sendError(res, 404, 'NOT_FOUND', 'User not found.');
      return;
    }
    res.json(toUserSummary(user));
  });

  app.patch('/api/v1/auth/language', requireAuth, (req: AuthenticatedRequest, res) => {
    const { preferredLanguage } = req.body ?? {};
    if (preferredLanguage !== 'en' && preferredLanguage !== 'kn') {
      sendError(res, 400, 'VALIDATION_ERROR', 'Supported languages in Phase 1 are en and kn.');
      return;
    }

    const db = readDb();
    const user = db.users.find((u) => u.id === req.authUser?.id);
    if (!user) {
      sendError(res, 404, 'NOT_FOUND', 'User not found.');
      return;
    }
    user.preferredLanguage = preferredLanguage;
    user.updatedAt = new Date().toISOString();
    writeDb(db);
    res.json(toUserSummary(user));
  });

  app.get('/api/v1/farmer/profile', requireAuth, (req: AuthenticatedRequest, res) => {
    const db = readDb();
    const user = db.users.find((u) => u.id === req.authUser?.id);
    if (!user) {
      sendError(res, 404, 'NOT_FOUND', 'User not found.');
      return;
    }
    const profile = db.profiles.find((p) => p.userId === user.id);
    if (!profile) {
      sendError(res, 404, 'NOT_FOUND', 'Farmer profile not completed yet.');
      return;
    }
    res.json(toProfileResponse(profile, user.email));
  });

  app.post('/api/v1/farmer/profile', requireAuth, (req: AuthenticatedRequest, res) => {
    if (req.authUser?.role !== 'FARMER') {
      sendError(res, 403, 'FORBIDDEN', 'Only farmer accounts can update farmer onboarding profiles.');
      return;
    }

    const body = req.body ?? {};
    if (typeof body.hasSoilReport !== 'boolean') {
      sendError(res, 400, 'VALIDATION_ERROR', 'Soil report selection is required.');
      return;
    }

    const fieldErrors: Record<string, string> = {};
    const db = readDb();
    const user = db.users.find((u) => u.id === req.authUser?.id);
    if (!user) {
      sendError(res, 404, 'NOT_FOUND', 'User not found.');
      return;
    }

    if (body.hasSoilReport) {
      const r = body.soilReport ?? {};
      const nUnknown = Boolean(r.nitrogenUnknown);
      const pUnknown = Boolean(r.phosphorusUnknown);
      const kUnknown = Boolean(r.potassiumUnknown);
      const phUnknown = Boolean(r.phUnknown);

      const n = nUnknown || r.nitrogenKgPerHa === null || r.nitrogenKgPerHa === undefined || r.nitrogenKgPerHa === '' ? null : Number(r.nitrogenKgPerHa);
      const p = pUnknown || r.phosphorusKgPerHa === null || r.phosphorusKgPerHa === undefined || r.phosphorusKgPerHa === '' ? null : Number(r.phosphorusKgPerHa);
      const k = kUnknown || r.potassiumKgPerHa === null || r.potassiumKgPerHa === undefined || r.potassiumKgPerHa === '' ? null : Number(r.potassiumKgPerHa);
      const ph = phUnknown || r.phLevel === null || r.phLevel === undefined || r.phLevel === '' ? null : Number(r.phLevel);

      if (n !== null && (Number.isNaN(n) || n < 0 || n > 1000)) {
        fieldErrors.nitrogenKgPerHa = 'Nitrogen must be between 0 and 1000 kg/ha.';
      }
      if (p !== null && (Number.isNaN(p) || p < 0 || p > 400)) {
        fieldErrors.phosphorusKgPerHa = 'Phosphorus must be between 0 and 400 kg/ha.';
      }
      if (k !== null && (Number.isNaN(k) || k < 0 || k > 1200)) {
        fieldErrors.potassiumKgPerHa = 'Potassium must be between 0 and 1200 kg/ha.';
      }
      if (ph !== null && (Number.isNaN(ph) || ph < 3.5 || ph > 10.0)) {
        fieldErrors.phLevel = 'Soil pH must be between 3.5 and 10.0.';
      }
      if (!nUnknown && !pUnknown && !kUnknown && !phUnknown && n === null && p === null && k === null && ph === null) {
        fieldErrors.soilReport = 'Enter at least one soil value or mark fields as unknown.';
      }
      if (body.landSize !== null && body.landSize !== undefined && body.landSize !== '') {
        const ls = Number(body.landSize);
        if (Number.isNaN(ls) || ls <= 0 || ls > 50000) {
          fieldErrors.landSize = 'Land size must be between 0.01 and 50000.';
        }
      }
    } else {
      if (!body.farmerName?.trim()) fieldErrors.farmerName = 'Farmer name is required.';
      if (!body.state?.trim()) fieldErrors.state = 'State is required.';
      if (!body.district?.trim()) fieldErrors.district = 'District is required.';
      if (!body.village?.trim()) fieldErrors.village = 'Village or location is required.';
      const ls = Number(body.landSize);
      if (body.landSize === null || body.landSize === undefined || body.landSize === '' || Number.isNaN(ls) || ls <= 0 || ls > 50000) {
        fieldErrors.landSize = 'Valid land size (> 0) is required.';
      }
      if (!body.landUnit?.trim()) fieldErrors.landUnit = 'Land unit is required.';
      if (!body.soilType?.trim()) fieldErrors.soilType = 'Soil type is required.';
      if (!body.irrigationSource?.trim()) fieldErrors.irrigationSource = 'Irrigation source is required.';
      if (!body.currentOrPreviousCrop?.trim()) fieldErrors.currentOrPreviousCrop = 'Current or previous crop is required.';
      if (!body.growingSeason?.trim()) fieldErrors.growingSeason = 'Current growing season is required.';
    }

    if (Object.keys(fieldErrors).length > 0) {
      sendError(res, 400, 'VALIDATION_ERROR', 'Input validation failed.', fieldErrors);
      return;
    }

    const now = new Date().toISOString();
    const firstOnboarding = !user.onboardingCompleted;
    const resolvedName = body.farmerName?.trim() || user.fullName;

    let profile = db.profiles.find((p) => p.userId === user.id);
    if (!profile) {
      profile = {
        id: crypto.randomUUID(),
        userId: user.id,
        hasSoilReport: body.hasSoilReport,
        farmerName: resolvedName,
        state: null,
        district: null,
        village: null,
        landSize: null,
        landUnit: null,
        soilType: null,
        irrigationSource: null,
        currentOrPreviousCrop: null,
        growingSeason: null,
        soilReport: null,
        createdAt: now,
        updatedAt: now,
      };
      db.profiles.push(profile);
    }

    profile.hasSoilReport = body.hasSoilReport;
    profile.farmerName = resolvedName;
    profile.state = body.state?.trim() || null;
    profile.district = body.district?.trim() || null;
    profile.village = body.village?.trim() || null;
    profile.landSize =
      body.landSize !== null && body.landSize !== undefined && body.landSize !== ''
        ? Number(body.landSize)
        : null;
    profile.landUnit = body.landUnit?.trim() || null;
    profile.soilType = body.soilType?.trim() || null;
    profile.irrigationSource = body.irrigationSource?.trim() || null;
    profile.currentOrPreviousCrop = body.currentOrPreviousCrop?.trim() || null;
    profile.growingSeason = body.growingSeason?.trim() || null;
    profile.updatedAt = now;

    if (body.hasSoilReport && body.soilReport) {
      const r = body.soilReport;
      profile.soilReport = {
        nitrogenUnknown: Boolean(r.nitrogenUnknown),
        phosphorusUnknown: Boolean(r.phosphorusUnknown),
        potassiumUnknown: Boolean(r.potassiumUnknown),
        phUnknown: Boolean(r.phUnknown),
        nitrogenKgPerHa: r.nitrogenUnknown || r.nitrogenKgPerHa === '' || r.nitrogenKgPerHa === null || r.nitrogenKgPerHa === undefined ? null : Number(r.nitrogenKgPerHa),
        phosphorusKgPerHa: r.phosphorusUnknown || r.phosphorusKgPerHa === '' || r.phosphorusKgPerHa === null || r.phosphorusKgPerHa === undefined ? null : Number(r.phosphorusKgPerHa),
        potassiumKgPerHa: r.potassiumUnknown || r.potassiumKgPerHa === '' || r.potassiumKgPerHa === null || r.potassiumKgPerHa === undefined ? null : Number(r.potassiumKgPerHa),
        phLevel: r.phUnknown || r.phLevel === '' || r.phLevel === null || r.phLevel === undefined ? null : Number(r.phLevel),
        labName: r.labName?.trim() || null,
        sampleDate: r.sampleDate?.trim() || null,
      };
    } else {
      profile.soilReport = null;
    }

    user.fullName = resolvedName;
    user.onboardingCompleted = true;
    user.updatedAt = now;

    if (firstOnboarding) {
      db.notifications.unshift({
        id: crypto.randomUUID(),
        userId: user.id,
        titleKey: profile.hasSoilReport
          ? 'notifications.items.soilSavedTitle'
          : 'notifications.items.fieldSavedTitle',
        messageKey: profile.hasSoilReport
          ? 'notifications.items.soilSavedMessage'
          : 'notifications.items.fieldSavedMessage',
        category: 'ONBOARDING',
        read: false,
        createdAt: now,
      });
    }

    writeDb(db);
    res.json(toProfileResponse(profile, user.email));
  });

  app.get('/api/v1/notifications', requireAuth, (req: AuthenticatedRequest, res) => {
    const db = readDb();
    const list = db.notifications
      .filter((n) => n.userId === req.authUser?.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(list);
  });

  app.patch('/api/v1/notifications/read-all', requireAuth, (req: AuthenticatedRequest, res) => {
    const db = readDb();
    for (const item of db.notifications) {
      if (item.userId === req.authUser?.id) {
        item.read = true;
      }
    }
    writeDb(db);
    res.status(204).send();
  });

  app.patch('/api/v1/notifications/:id/read', requireAuth, (req: AuthenticatedRequest, res) => {
    const db = readDb();
    const item = db.notifications.find((n) => n.id === req.params.id && n.userId === req.authUser?.id);
    if (!item) {
      sendError(res, 404, 'NOT_FOUND', 'Notification not found.');
      return;
    }
    item.read = true;
    writeDb(db);
    res.json(item);
  });

  app.get('/api/v1/admin/overview', requireAuth, requireAdmin, (_req, res) => {
    const db = readDb();
    const farmers = db.users.filter((u) => u.role === 'FARMER');
    const totalFarmers = farmers.length;
    const onboardedFarmers = farmers.filter((u) => u.onboardingCompleted).length;
    const withSoilReportCount = db.profiles.filter((p) => p.hasSoilReport).length;
    const withoutSoilReportCount = db.profiles.filter((p) => !p.hasSoilReport).length;
    const languageBreakdown: Record<string, number> = {};

    for (const f of farmers) {
      languageBreakdown[f.preferredLanguage] = (languageBreakdown[f.preferredLanguage] || 0) + 1;
    }

    const farmerSummaries = db.profiles.map((p) => {
      const user = db.users.find((u) => u.id === p.userId);
      return toProfileResponse(p, user?.email || '');
    });

    res.json({
      totalFarmers,
      onboardedFarmers,
      withSoilReportCount,
      withoutSoilReportCount,
      languageBreakdown,
      farmers: farmerSummaries,
    });
  });

  // Catch unmatched /api routes with JSON 404
  app.use('/api', (_req, res) => {
    sendError(res, 404, 'NOT_FOUND', 'API endpoint not found.');
  });

  if (process.env.NODE_ENV === 'production') {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`KrishiSetu server listening on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start KrishiSetu server:', err);
  process.exit(1);
});
