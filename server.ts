import 'dotenv/config';
import express, { type NextFunction, type Request, type Response } from 'express';
import multer from 'multer';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { createServer as createViteServer } from 'vite';
import {
  analyzeSoilHealth,
  compareAlternatives,
  filterKnowledgeBank,
  generateRecommendations,
  loadSeedCrops,
  type CropKnowledgeRecord,
  type SavedCropPlanRecord,
} from './server/cropEngine.ts';
import {
  filterActiveAlerts,
  filterProtectionGuides,
  getScannerStatus,
  hasValidImageSignature,
  invokeDiseaseInference,
  loadSeedAlerts,
  loadSeedGuides,
  translateScanReasonKn,
  type PestDiseaseAlertRecord,
  type PlantDiseaseScanRecord,
  type PlantProtectionGuideRecord,
} from './server/plantHealthEngine.ts';
import {
  UpstreamApiError,
  buildSmartAlerts,
  fetchMandiPrices,
  getPriceTrends,
  getWeatherForecast,
  mergeMandiRecords,
  normalizeAgmarknetDate,
  searchOpenMeteoLocations,
  type MandiPriceRecord,
} from './server/marketWeatherEngine.ts';
import {
  SOIL_TESTING_CHECKLIST,
  buildBookingRequestRecord,
  filterEquipmentListings,
  filterProviders,
  loadSeedEquipmentListings,
  loadSeedServiceProviders,
  type AgriServiceProviderRecord,
  type BookingRequestStatus,
  type EquipmentBookingRecord,
  type EquipmentListingRecord,
  type ServiceProviderType,
} from './server/agriServicesEngine.ts';
import {
  AiServiceError,
  generateGroundedAiReply,
  getAiAssistantStatus,
  type AiChatMessageRecord,
} from './server/aiAssistantEngine.ts';
import {
  computeAdminAnalytics,
  getIntegrationsOverview,
  maskEmail,
  probeIntegrationsLive,
  sanitizePlainText,
} from './server/adminPhase6Engine.ts';

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
  active: boolean;
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
  crops: CropKnowledgeRecord[];
  savedCropPlans: SavedCropPlanRecord[];
  pestAlerts: PestDiseaseAlertRecord[];
  protectionGuides: PlantProtectionGuideRecord[];
  diseaseScans: PlantDiseaseScanRecord[];
  mandiPriceRecords: MandiPriceRecord[];
  serviceProviders: AgriServiceProviderRecord[];
  equipmentListings: EquipmentListingRecord[];
  equipmentBookings: EquipmentBookingRecord[];
  aiChatMessages: AiChatMessageRecord[];
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
        active: true,
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
        active: true,
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
    crops: loadSeedCrops(),
    savedCropPlans: [],
    pestAlerts: loadSeedAlerts(),
    protectionGuides: loadSeedGuides(),
    diseaseScans: [],
    mandiPriceRecords: [],
    serviceProviders: loadSeedServiceProviders(),
    equipmentListings: loadSeedEquipmentListings(),
    equipmentBookings: [],
    aiChatMessages: [],
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
    const parsed = JSON.parse(raw) as Partial<DatabaseSchema>;
    let changed = false;
    if (!Array.isArray(parsed.crops) || parsed.crops.length === 0) {
      parsed.crops = loadSeedCrops();
      changed = true;
    }
    if (!Array.isArray(parsed.savedCropPlans)) {
      parsed.savedCropPlans = [];
      changed = true;
    }
    if (!Array.isArray(parsed.pestAlerts) || parsed.pestAlerts.length === 0) {
      parsed.pestAlerts = loadSeedAlerts();
      changed = true;
    }
    if (!Array.isArray(parsed.protectionGuides) || parsed.protectionGuides.length === 0) {
      parsed.protectionGuides = loadSeedGuides();
      changed = true;
    }
    if (!Array.isArray(parsed.diseaseScans)) {
      parsed.diseaseScans = [];
      changed = true;
    }
    if (!Array.isArray(parsed.mandiPriceRecords)) {
      parsed.mandiPriceRecords = [];
      changed = true;
    }
    if (!Array.isArray(parsed.serviceProviders) || parsed.serviceProviders.length === 0) {
      parsed.serviceProviders = loadSeedServiceProviders();
      changed = true;
    }
    if (!Array.isArray(parsed.equipmentListings) || parsed.equipmentListings.length === 0) {
      parsed.equipmentListings = loadSeedEquipmentListings();
      changed = true;
    }
    if (!Array.isArray(parsed.equipmentBookings)) {
      parsed.equipmentBookings = [];
      changed = true;
    }
    if (!Array.isArray(parsed.aiChatMessages)) {
      parsed.aiChatMessages = [];
      changed = true;
    }
    if (Array.isArray(parsed.users)) {
      for (const u of parsed.users) {
        if (typeof u.active !== 'boolean') {
          u.active = true;
          changed = true;
        }
      }
    }
    const db = parsed as DatabaseSchema;
    if (changed) {
      fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
    }
    return db;
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

const failedLoginAttempts = new Map<string, number[]>();
const LOGIN_WINDOW_MS = 5 * 60 * 1000;
const MAX_LOGIN_FAILURES = 20;

function checkLoginRateLimit(key: string): boolean {
  const now = Date.now();
  const timestamps = (failedLoginAttempts.get(key) || []).filter(
    (ts) => now - ts < LOGIN_WINDOW_MS,
  );
  failedLoginAttempts.set(key, timestamps);
  return timestamps.length < MAX_LOGIN_FAILURES;
}

function recordLoginFailure(key: string): void {
  const now = Date.now();
  const timestamps = (failedLoginAttempts.get(key) || []).filter(
    (ts) => now - ts < LOGIN_WINDOW_MS,
  );
  timestamps.push(now);
  failedLoginAttempts.set(key, timestamps);
}

function clearLoginFailures(key: string): void {
  failedLoginAttempts.delete(key);
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
  const db = readDb();
  const account = db.users.find((u) => u.id === claims.sub);
  if (!account) {
    sendError(res, 401, 'UNAUTHORIZED', 'Account no longer exists.');
    return;
  }
  if (account.active === false) {
    sendError(res, 403, 'ACCOUNT_DISABLED', 'This account has been deactivated by an administrator.');
    return;
  }
  req.authUser = { id: account.id, role: account.role };
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
      fullName: sanitizePlainText(fullName, 120),
      email: normalizedEmail,
      passwordHash: hashPassword(password),
      role: 'FARMER',
      preferredLanguage: preferredLanguage === 'kn' ? 'kn' : 'en',
      onboardingCompleted: false,
      active: true,
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

    const rateKey = `farmer:${req.ip || 'local'}:${email.trim().toLowerCase()}`;
    if (!checkLoginRateLimit(rateKey)) {
      sendError(res, 429, 'RATE_LIMITED', 'Too many failed login attempts. Please wait a few minutes and retry.');
      return;
    }

    const db = readDb();
    const user = db.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!user || !verifyPassword(password, user.passwordHash)) {
      recordLoginFailure(rateKey);
      sendError(res, 401, 'UNAUTHORIZED', 'Invalid email or password.');
      return;
    }
    if (user.active === false) {
      sendError(res, 403, 'ACCOUNT_DISABLED', 'This farmer account has been deactivated by an administrator.');
      return;
    }
    if (user.role !== 'FARMER') {
      sendError(res, 403, 'FORBIDDEN', 'Please use the administrator portal for admin accounts.');
      return;
    }
    clearLoginFailures(rateKey);

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

    const rateKey = `admin:${req.ip || 'local'}:${email.trim().toLowerCase()}`;
    if (!checkLoginRateLimit(rateKey)) {
      sendError(res, 429, 'RATE_LIMITED', 'Too many failed admin login attempts. Please wait a few minutes.');
      return;
    }

    const db = readDb();
    const user = db.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!user || !verifyPassword(password, user.passwordHash)) {
      recordLoginFailure(rateKey);
      sendError(res, 401, 'UNAUTHORIZED', 'Invalid email or password.');
      return;
    }
    if (user.active === false) {
      sendError(res, 403, 'ACCOUNT_DISABLED', 'This administrator account is disabled.');
      return;
    }
    if (user.role !== 'ADMIN') {
      recordLoginFailure(rateKey);
      sendError(res, 403, 'FORBIDDEN', 'Administrator privileges required.');
      return;
    }
    clearLoginFailures(rateKey);

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
      return toProfileResponse(p, maskEmail(user?.email || ''));
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

  app.get('/api/v1/admin/farmers', requireAuth, requireAdmin, (_req, res) => {
    const db = readDb();
    const profileMap = new Map(db.profiles.map((p) => [p.userId, p]));
    const accounts = db.users
      .filter((u) => u.role === 'FARMER')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((u) => {
        const p = profileMap.get(u.id);
        return {
          id: u.id,
          fullName: u.fullName,
          maskedEmail: maskEmail(u.email),
          preferredLanguage: u.preferredLanguage,
          onboardingCompleted: u.onboardingCompleted,
          active: u.active !== false,
          hasSoilReport: p ? p.hasSoilReport : null,
          state: p?.state || null,
          district: p?.district || null,
          landSize: p?.landSize ?? null,
          landUnit: p?.landUnit || null,
          growingSeason: p?.growingSeason || null,
          createdAt: u.createdAt,
          updatedAt: u.updatedAt,
        };
      });
    res.json(accounts);
  });

  app.patch('/api/v1/admin/farmers/:id/status', requireAuth, requireAdmin, (req, res) => {
    const body = req.body ?? {};
    if (typeof body.active !== 'boolean') {
      sendError(res, 400, 'VALIDATION_ERROR', 'Boolean active status is required.', {
        active: 'Provide active: true or false.',
      });
      return;
    }
    const db = readDb();
    const user = db.users.find((u) => u.id === req.params.id);
    if (!user) {
      sendError(res, 404, 'NOT_FOUND', 'Farmer account not found.');
      return;
    }
    if (user.role !== 'FARMER') {
      sendError(res, 400, 'BAD_REQUEST', 'Only farmer accounts can be modified here.');
      return;
    }
    user.active = body.active;
    user.updatedAt = new Date().toISOString();
    writeDb(db);

    const p = db.profiles.find((prof) => prof.userId === user.id);
    res.json({
      id: user.id,
      fullName: user.fullName,
      maskedEmail: maskEmail(user.email),
      preferredLanguage: user.preferredLanguage,
      onboardingCompleted: user.onboardingCompleted,
      active: user.active,
      hasSoilReport: p ? p.hasSoilReport : null,
      state: p?.state || null,
      district: p?.district || null,
      landSize: p?.landSize ?? null,
      landUnit: p?.landUnit || null,
      growingSeason: p?.growingSeason || null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  });

  app.get('/api/v1/admin/analytics', requireAuth, requireAdmin, (_req, res) => {
    const db = readDb();
    res.json(computeAdminAnalytics(db));
  });

  app.get('/api/v1/admin/integrations/status', requireAuth, requireAdmin, (_req, res) => {
    const db = readDb();
    res.json(getIntegrationsOverview(db));
  });

  app.post('/api/v1/admin/integrations/probe', requireAuth, requireAdmin, async (_req, res) => {
    const report = await probeIntegrationsLive();
    res.json(report);
  });

  // --- Phase 2: Crop & Soil Intelligence Routes ---
  app.get('/api/v1/crop-intelligence/crops', requireAuth, (req, res) => {
    const db = readDb();
    const list = filterKnowledgeBank(db.crops, {
      q: typeof req.query.q === 'string' ? req.query.q : undefined,
      season: typeof req.query.season === 'string' ? req.query.season : undefined,
      soilType: typeof req.query.soilType === 'string' ? req.query.soilType : undefined,
      waterRequirement:
        typeof req.query.waterRequirement === 'string' ? req.query.waterRequirement : undefined,
      category: typeof req.query.category === 'string' ? req.query.category : undefined,
    });
    res.json(list);
  });

  app.get('/api/v1/crop-intelligence/crops/:cropCode', requireAuth, (req, res) => {
    const db = readDb();
    const crop = db.crops.find(
      (c) => c.cropCode.toLowerCase() === String(req.params.cropCode).toLowerCase(),
    );
    if (!crop) {
      sendError(res, 404, 'NOT_FOUND', 'Crop not found in knowledge bank.');
      return;
    }
    res.json(crop);
  });

  app.get('/api/v1/crop-intelligence/recommendations', requireAuth, (req: AuthenticatedRequest, res) => {
    if (req.authUser?.role !== 'FARMER') {
      sendError(res, 403, 'FORBIDDEN', 'Farmer role required for personalized recommendations.');
      return;
    }
    const db = readDb();
    const profile = db.profiles.find((p) => p.userId === req.authUser?.id);
    if (!profile) {
      sendError(res, 404, 'NOT_FOUND', 'Complete farmer onboarding before requesting recommendations.');
      return;
    }
    const result = generateRecommendations(db.crops, profile, {
      season: typeof req.query.season === 'string' ? req.query.season : undefined,
      irrigation: typeof req.query.irrigation === 'string' ? req.query.irrigation : undefined,
      soilType: typeof req.query.soilType === 'string' ? req.query.soilType : undefined,
    });
    res.json(result);
  });

  app.get('/api/v1/crop-intelligence/compare', requireAuth, (req: AuthenticatedRequest, res) => {
    if (req.authUser?.role !== 'FARMER') {
      sendError(res, 403, 'FORBIDDEN', 'Farmer role required for crop comparison.');
      return;
    }
    const rawCrops = typeof req.query.crops === 'string' ? req.query.crops : '';
    const cropCodes = rawCrops
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (cropCodes.length < 2 || cropCodes.length > 4) {
      sendError(res, 400, 'VALIDATION_ERROR', 'Select between 2 and 4 crops to compare side-by-side.');
      return;
    }
    const db = readDb();
    const profile = db.profiles.find((p) => p.userId === req.authUser?.id);
    if (!profile) {
      sendError(res, 404, 'NOT_FOUND', 'Farmer profile not found.');
      return;
    }
    try {
      const comparison = compareAlternatives(db.crops, cropCodes, profile, {
        season: typeof req.query.season === 'string' ? req.query.season : undefined,
        irrigation: typeof req.query.irrigation === 'string' ? req.query.irrigation : undefined,
      });
      res.json(comparison);
    } catch (err) {
      if (err instanceof Error && err.message.startsWith('NOT_FOUND:')) {
        sendError(res, 404, 'NOT_FOUND', `Crop not found: ${err.message.slice(10)}`);
        return;
      }
      throw err;
    }
  });

  app.get('/api/v1/crop-intelligence/soil-analysis', requireAuth, (req: AuthenticatedRequest, res) => {
    if (req.authUser?.role !== 'FARMER') {
      sendError(res, 403, 'FORBIDDEN', 'Farmer role required for soil analysis.');
      return;
    }
    const db = readDb();
    const profile = db.profiles.find((p) => p.userId === req.authUser?.id);
    if (!profile) {
      sendError(res, 404, 'NOT_FOUND', 'Farmer profile not found.');
      return;
    }
    res.json(analyzeSoilHealth(profile));
  });

  app.get('/api/v1/crop-intelligence/plans', requireAuth, (req: AuthenticatedRequest, res) => {
    if (req.authUser?.role !== 'FARMER') {
      sendError(res, 403, 'FORBIDDEN', 'Farmer role required.');
      return;
    }
    const db = readDb();
    const plans = db.savedCropPlans
      .filter((p) => p.userId === req.authUser?.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((p) => {
        const primary = db.crops.find(
          (c) => c.cropCode.toLowerCase() === p.primaryCropCode.toLowerCase(),
        );
        return {
          ...p,
          primaryCropNameEn: primary?.nameEn || p.primaryCropCode,
          primaryCropNameKn: primary?.nameKn || p.primaryCropCode,
        };
      });
    res.json(plans);
  });

  app.post('/api/v1/crop-intelligence/plans', requireAuth, (req: AuthenticatedRequest, res) => {
    if (req.authUser?.role !== 'FARMER') {
      sendError(res, 403, 'FORBIDDEN', 'Farmer role required.');
      return;
    }
    const body = req.body ?? {};
    if (typeof body.primaryCropCode !== 'string' || !body.primaryCropCode.trim()) {
      sendError(res, 400, 'VALIDATION_ERROR', 'Primary crop selection is required.', {
        primaryCropCode: 'Primary crop selection is required.',
      });
      return;
    }
    const db = readDb();
    const primary = db.crops.find(
      (c) => c.cropCode.toLowerCase() === body.primaryCropCode.trim().toLowerCase(),
    );
    if (!primary) {
      sendError(res, 400, 'BAD_REQUEST', 'Selected primary crop does not exist in dataset.');
      return;
    }
    const altList: string[] = [];
    if (Array.isArray(body.alternativeCropCodes)) {
      for (const rawCode of body.alternativeCropCodes) {
        if (typeof rawCode === 'string' && rawCode.trim()) {
          const found = db.crops.find(
            (c) =>
              c.cropCode.toLowerCase() === rawCode.trim().toLowerCase() &&
              c.cropCode !== primary.cropCode,
          );
          if (found && !altList.includes(found.cropCode)) {
            altList.push(found.cropCode);
          }
        }
      }
    }

    const created: SavedCropPlanRecord = {
      id: crypto.randomUUID(),
      userId: req.authUser.id,
      primaryCropCode: primary.cropCode,
      alternativeCropCodes: altList,
      plannedSeason:
        typeof body.plannedSeason === 'string' && body.plannedSeason.trim()
          ? body.plannedSeason.trim().slice(0, 30)
          : null,
      farmerNotes:
        typeof body.farmerNotes === 'string' && body.farmerNotes.trim()
          ? body.farmerNotes.trim().slice(0, 500)
          : null,
      createdAt: new Date().toISOString(),
    };
    db.savedCropPlans.unshift(created);
    writeDb(db);

    res.status(201).json({
      ...created,
      primaryCropNameEn: primary.nameEn,
      primaryCropNameKn: primary.nameKn,
    });
  });

  app.delete('/api/v1/crop-intelligence/plans/:id', requireAuth, (req: AuthenticatedRequest, res) => {
    if (req.authUser?.role !== 'FARMER') {
      sendError(res, 403, 'FORBIDDEN', 'Farmer role required.');
      return;
    }
    const db = readDb();
    const idx = db.savedCropPlans.findIndex(
      (p) => p.id === req.params.id && p.userId === req.authUser?.id,
    );
    if (idx === -1) {
      sendError(res, 404, 'NOT_FOUND', 'Saved advisory plan not found.');
      return;
    }
    db.savedCropPlans.splice(idx, 1);
    writeDb(db);
    res.status(204).send();
  });

  // --- Admin Crop Dataset Management ---
  app.get('/api/v1/admin/crops', requireAuth, requireAdmin, (_req, res) => {
    const db = readDb();
    const sorted = [...db.crops].sort((a, b) => a.nameEn.localeCompare(b.nameEn));
    res.json(sorted);
  });

  app.post('/api/v1/admin/crops', requireAuth, requireAdmin, (req, res) => {
    const body = req.body ?? {};
    const fieldErrors: Record<string, string> = {};
    if (typeof body.cropCode !== 'string' || !body.cropCode.trim()) {
      fieldErrors.cropCode = 'Crop code is required.';
    }
    if (typeof body.nameEn !== 'string' || !body.nameEn.trim()) {
      fieldErrors.nameEn = 'English crop name is required.';
    }
    if (typeof body.nameKn !== 'string' || !body.nameKn.trim()) {
      fieldErrors.nameKn = 'Kannada crop name is required.';
    }
    if (!Array.isArray(body.suitableSoils) || body.suitableSoils.length === 0) {
      fieldErrors.suitableSoils = 'At least one suitable soil type is required.';
    }
    if (!Array.isArray(body.seasons) || body.seasons.length === 0) {
      fieldErrors.seasons = 'At least one season is required.';
    }
    const minDays = Number(body.durationMinDays);
    const maxDays = Number(body.durationMaxDays);
    if (Number.isNaN(minDays) || minDays < 30 || Number.isNaN(maxDays) || maxDays < minDays) {
      fieldErrors.durationMinDays = 'Valid duration day range (min <= max, >= 30) is required.';
    }
    if (Object.keys(fieldErrors).length > 0) {
      sendError(res, 400, 'VALIDATION_ERROR', 'Input validation failed.', fieldErrors);
      return;
    }

    const db = readDb();
    const normalizedCode = body.cropCode.trim().toLowerCase();
    if (db.crops.some((c) => c.cropCode.toLowerCase() === normalizedCode)) {
      sendError(res, 400, 'BAD_REQUEST', `A crop with code '${normalizedCode}' already exists.`);
      return;
    }

    const newCrop: CropKnowledgeRecord = {
      id: crypto.randomUUID(),
      cropCode: normalizedCode,
      nameEn: body.nameEn.trim(),
      nameKn: body.nameKn.trim(),
      scientificName: typeof body.scientificName === 'string' ? body.scientificName.trim() || null : null,
      cropCategory:
        typeof body.cropCategory === 'string' && body.cropCategory.trim()
          ? body.cropCategory.trim().toUpperCase()
          : 'PULSE',
      suitableSoils: body.suitableSoils,
      seasons: body.seasons,
      waterRequirement:
        body.waterRequirement === 'HIGH' || body.waterRequirement === 'LOW'
          ? body.waterRequirement
          : 'MEDIUM',
      waterNotesEn: typeof body.waterNotesEn === 'string' ? body.waterNotesEn : '',
      waterNotesKn: typeof body.waterNotesKn === 'string' ? body.waterNotesKn : '',
      minPh: body.minPh !== undefined && body.minPh !== null && body.minPh !== '' ? Number(body.minPh) : 5.5,
      maxPh: body.maxPh !== undefined && body.maxPh !== null && body.maxPh !== '' ? Number(body.maxPh) : 7.5,
      nitrogenDemand: typeof body.nitrogenDemand === 'string' ? body.nitrogenDemand : 'MEDIUM',
      phosphorusDemand: typeof body.phosphorusDemand === 'string' ? body.phosphorusDemand : 'MEDIUM',
      potassiumDemand: typeof body.potassiumDemand === 'string' ? body.potassiumDemand : 'MEDIUM',
      nitrogenFixing: Boolean(body.nitrogenFixing),
      durationMinDays: minDays,
      durationMaxDays: maxDays,
      tempMinC: body.tempMinC ? Number(body.tempMinC) : null,
      tempMaxC: body.tempMaxC ? Number(body.tempMaxC) : null,
      rainfallMinMm: body.rainfallMinMm ? Number(body.rainfallMinMm) : null,
      rainfallMaxMm: body.rainfallMaxMm ? Number(body.rainfallMaxMm) : null,
      climateNoteEn: typeof body.climateNoteEn === 'string' ? body.climateNoteEn : null,
      climateNoteKn: typeof body.climateNoteKn === 'string' ? body.climateNoteKn : null,
      supportedStates: Array.isArray(body.supportedStates) ? body.supportedStates : ['Karnataka'],
      supportedDistricts: Array.isArray(body.supportedDistricts) ? body.supportedDistricts : [],
      advantagesEn: Array.isArray(body.advantagesEn) ? body.advantagesEn : [],
      advantagesKn: Array.isArray(body.advantagesKn) ? body.advantagesKn : [],
      risksEn: Array.isArray(body.risksEn) ? body.risksEn : [],
      risksKn: Array.isArray(body.risksKn) ? body.risksKn : [],
      rotationalBenefitsEn: typeof body.rotationalBenefitsEn === 'string' ? body.rotationalBenefitsEn : null,
      rotationalBenefitsKn: typeof body.rotationalBenefitsKn === 'string' ? body.rotationalBenefitsKn : null,
      growingGuidanceEn: body.growingGuidanceEn || {
        landPreparation: '',
        sowingAndSpacing: '',
        irrigationSchedule: '',
        nutrientPractice: '',
      },
      growingGuidanceKn: body.growingGuidanceKn || {
        landPreparation: '',
        sowingAndSpacing: '',
        irrigationSchedule: '',
        nutrientPractice: '',
      },
      commonPests: Array.isArray(body.commonPests) ? body.commonPests : [],
      dataReliability:
        body.dataReliability === 'CURATED_REFERENCE'
          ? 'CURATED_REFERENCE'
          : 'SAMPLE_REGIONAL_REFERENCE',
      sourceReference:
        typeof body.sourceReference === 'string'
          ? body.sourceReference
          : 'Admin added crop record',
    };

    db.crops.push(newCrop);
    writeDb(db);
    res.status(201).json(newCrop);
  });

  app.delete('/api/v1/admin/crops/:id', requireAuth, requireAdmin, (req, res) => {
    const db = readDb();
    const idx = db.crops.findIndex((c) => c.id === req.params.id);
    if (idx === -1) {
      sendError(res, 404, 'NOT_FOUND', 'Crop entry not found.');
      return;
    }
    db.crops.splice(idx, 1);
    writeDb(db);
    res.status(204).send();
  });

  app.post('/api/v1/admin/crops/sync-seed', requireAuth, requireAdmin, (_req, res) => {
    const db = readDb();
    const seed = loadSeedCrops();
    let importedCount = 0;
    for (const item of seed) {
      const existingIdx = db.crops.findIndex(
        (c) => c.cropCode.toLowerCase() === item.cropCode.toLowerCase(),
      );
      if (existingIdx >= 0) {
        db.crops[existingIdx] = { ...item, id: db.crops[existingIdx].id };
      } else {
        db.crops.push(item);
      }
      importedCount++;
    }
    writeDb(db);
    res.json({ importedCount });
  });

  // --- Phase 3: Plant Health & Protection Routes ---
  const leafUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
  });

  app.get('/api/v1/plant-health/scanner/status', requireAuth, async (_req, res) => {
    const status = await getScannerStatus();
    res.json(status);
  });

  app.post('/api/v1/plant-health/scanner/analyze', requireAuth, (req: AuthenticatedRequest, res) => {
    leafUpload.single('image')(req, res, async (uploadErr) => {
      if (uploadErr) {
        if (uploadErr instanceof multer.MulterError && uploadErr.code === 'LIMIT_FILE_SIZE') {
          sendError(res, 400, 'VALIDATION_ERROR', 'Uploaded image exceeds the 5 MB size limit.');
          return;
        }
        sendError(res, 400, 'VALIDATION_ERROR', 'Invalid multipart image upload.');
        return;
      }

      const file = req.file;
      if (!file || !file.buffer || file.buffer.length === 0) {
        sendError(res, 400, 'VALIDATION_ERROR', 'A leaf image file (JPEG, PNG, or WebP) is required.', {
          image: 'A leaf image file is required.',
        });
        return;
      }

      const allowedMimes = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
      const mimeType = (file.mimetype || '').toLowerCase();
      if (!allowedMimes.has(mimeType)) {
        sendError(
          res,
          400,
          'VALIDATION_ERROR',
          'Unsupported image format. Please upload a JPEG, PNG, or WebP image.',
          { image: 'Unsupported file format. Allowed: JPEG, PNG, WebP.' },
        );
        return;
      }

      if (!hasValidImageSignature(file.buffer)) {
        sendError(
          res,
          400,
          'VALIDATION_ERROR',
          'Uploaded file does not match a valid JPEG, PNG, or WebP image header.',
          { image: 'File content is not a valid image.' },
        );
        return;
      }

      const rawCrop = typeof req.body?.cropCode === 'string' ? req.body.cropCode.trim().toLowerCase() : '';
      const cropCode = rawCrop || null;
      const farmerNotes =
        typeof req.body?.farmerNotes === 'string' && req.body.farmerNotes.trim()
          ? req.body.farmerNotes.trim().slice(0, 500)
          : null;

      const inference = await invokeDiseaseInference({
        fileBuffer: file.buffer,
        originalFileName: file.originalname || 'leaf-upload.jpg',
        mimeType,
        cropCode,
      });

      const db = readDb();
      let preventiveGuidanceEn: string[] | undefined;
      let preventiveGuidanceKn: string[] | undefined;
      if (inference.scanStatus === 'PREDICTION_READY' && cropCode) {
        const matchedGuide = db.protectionGuides.find(
          (g) => g.cropCode.toLowerCase() === cropCode,
        );
        if (matchedGuide) {
          preventiveGuidanceEn = matchedGuide.preventivePracticesEn;
          preventiveGuidanceKn = matchedGuide.preventivePracticesKn;
        }
      }

      const scanRecord: PlantDiseaseScanRecord = {
        id: crypto.randomUUID(),
        userId: req.authUser!.id,
        cropCode,
        originalFileName: file.originalname || 'leaf-upload.jpg',
        mimeType,
        fileSizeBytes: file.size,
        scanStatus: inference.scanStatus,
        modelId: inference.modelId,
        predictedLabel: inference.predictedLabel,
        confidence: inference.confidence,
        reasonEn: inference.reasonEn,
        reasonKn: translateScanReasonKn(inference.scanStatus, inference.reasonEn),
        topCandidates: inference.topCandidates,
        preventiveGuidanceEn,
        preventiveGuidanceKn,
        safetyReminderEn:
          'Verify visual screening results with a local Raitha Samparka Kendra (RSK) or KVK specialist before applying chemical treatments.',
        safetyReminderKn:
          'ಯಾವುದೇ ರಾಸಾಯನಿಕ ಚಿಕಿತ್ಸೆ ಬಳಸುವ ಮೊದಲು ಸ್ಥಳೀಯ ರೈತ ಸಂಪರ್ಕ ಕೇಂದ್ರ (RSK) ಅಥವಾ ಕೆವಿಕೆ ತಜ್ಞರಿಂದ ದೃಢೀಕರಿಸಿ.',
        farmerNotes,
        createdAt: new Date().toISOString(),
      };

      db.diseaseScans.unshift(scanRecord);
      writeDb(db);
      res.json(scanRecord);
    });
  });

  app.get('/api/v1/plant-health/scanner/history', requireAuth, (req: AuthenticatedRequest, res) => {
    const db = readDb();
    const list = db.diseaseScans
      .filter((s) => s.userId === req.authUser?.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(list);
  });

  app.get('/api/v1/plant-health/alerts', requireAuth, (req, res) => {
    const db = readDb();
    const list = filterActiveAlerts(db.pestAlerts, {
      state: typeof req.query.state === 'string' ? req.query.state : undefined,
      district: typeof req.query.district === 'string' ? req.query.district : undefined,
      cropCode: typeof req.query.cropCode === 'string' ? req.query.cropCode : undefined,
      verificationStatus:
        typeof req.query.verificationStatus === 'string' ? req.query.verificationStatus : undefined,
    });
    res.json(list);
  });

  app.get('/api/v1/plant-health/guidance', requireAuth, (req, res) => {
    const db = readDb();
    const list = filterProtectionGuides(db.protectionGuides, {
      q: typeof req.query.q === 'string' ? req.query.q : undefined,
      cropCode: typeof req.query.cropCode === 'string' ? req.query.cropCode : undefined,
      issueType: typeof req.query.issueType === 'string' ? req.query.issueType : undefined,
    });
    res.json(list);
  });

  // --- Admin Plant Health Alerts Management ---
  app.get('/api/v1/admin/plant-health/alerts', requireAuth, requireAdmin, (_req, res) => {
    const db = readDb();
    const sorted = [...db.pestAlerts].sort((a, b) => b.observedDate.localeCompare(a.observedDate));
    res.json(sorted);
  });

  app.post('/api/v1/admin/plant-health/alerts', requireAuth, requireAdmin, (req, res) => {
    const body = req.body ?? {};
    const fieldErrors: Record<string, string> = {};
    if (typeof body.alertCode !== 'string' || !body.alertCode.trim()) {
      fieldErrors.alertCode = 'Alert code is required.';
    }
    if (typeof body.titleEn !== 'string' || !body.titleEn.trim()) {
      fieldErrors.titleEn = 'English title is required.';
    }
    if (typeof body.titleKn !== 'string' || !body.titleKn.trim()) {
      fieldErrors.titleKn = 'Kannada title is required.';
    }
    if (typeof body.cropCode !== 'string' || !body.cropCode.trim()) {
      fieldErrors.cropCode = 'Crop code is required.';
    }
    if (typeof body.sourceName !== 'string' || !body.sourceName.trim()) {
      fieldErrors.sourceName = 'Verified source name is required.';
    }
    if (typeof body.observedDate !== 'string' || !body.observedDate.trim()) {
      fieldErrors.observedDate = 'Observed date is required.';
    }
    if (typeof body.summaryEn !== 'string' || !body.summaryEn.trim()) {
      fieldErrors.summaryEn = 'English summary is required.';
    }
    if (typeof body.summaryKn !== 'string' || !body.summaryKn.trim()) {
      fieldErrors.summaryKn = 'Kannada summary is required.';
    }
    const validStatus = new Set(['CONFIRMED_OUTBREAK', 'REPORTED_CASE', 'SEASONAL_RULE_ADVISORY']);
    const status = String(body.verificationStatus || '').trim().toUpperCase();
    if (!validStatus.has(status)) {
      fieldErrors.verificationStatus =
        'Verification status must be CONFIRMED_OUTBREAK, REPORTED_CASE, or SEASONAL_RULE_ADVISORY.';
    }
    if (Object.keys(fieldErrors).length > 0) {
      sendError(res, 400, 'VALIDATION_ERROR', 'Input validation failed.', fieldErrors);
      return;
    }

    const db = readDb();
    const normalizedCode = body.alertCode.trim().toLowerCase();
    const existingIdx = db.pestAlerts.findIndex(
      (a) => a.alertCode.toLowerCase() === normalizedCode,
    );

    const record: PestDiseaseAlertRecord = {
      id: existingIdx >= 0 ? db.pestAlerts[existingIdx].id : crypto.randomUUID(),
      alertCode: normalizedCode,
      titleEn: body.titleEn.trim(),
      titleKn: body.titleKn.trim(),
      cropCode: body.cropCode.trim().toLowerCase(),
      cropNameEn:
        typeof body.cropNameEn === 'string' && body.cropNameEn.trim()
          ? body.cropNameEn.trim()
          : body.cropCode.trim(),
      cropNameKn:
        typeof body.cropNameKn === 'string' && body.cropNameKn.trim()
          ? body.cropNameKn.trim()
          : body.cropCode.trim(),
      state:
        typeof body.state === 'string' && body.state.trim() ? body.state.trim() : 'Karnataka',
      district:
        typeof body.district === 'string' && body.district.trim() ? body.district.trim() : null,
      verificationStatus: status as PestDiseaseAlertRecord['verificationStatus'],
      severity:
        body.severity === 'HIGH' || body.severity === 'LOW' ? body.severity : 'MODERATE',
      observedDate: body.observedDate.trim(),
      validUntil:
        typeof body.validUntil === 'string' && body.validUntil.trim() ? body.validUntil.trim() : null,
      sourceName: body.sourceName.trim(),
      sourceUrl:
        typeof body.sourceUrl === 'string' && body.sourceUrl.trim() ? body.sourceUrl.trim() : null,
      summaryEn: body.summaryEn.trim(),
      summaryKn: body.summaryKn.trim(),
      precautionsEn: Array.isArray(body.precautionsEn) ? body.precautionsEn : [],
      precautionsKn: Array.isArray(body.precautionsKn) ? body.precautionsKn : [],
      active: body.active !== false,
    };

    if (existingIdx >= 0) {
      db.pestAlerts[existingIdx] = record;
    } else {
      db.pestAlerts.unshift(record);
    }
    writeDb(db);
    res.status(201).json(record);
  });

  app.delete('/api/v1/admin/plant-health/alerts/:id', requireAuth, requireAdmin, (req, res) => {
    const db = readDb();
    const idx = db.pestAlerts.findIndex((a) => a.id === req.params.id);
    if (idx === -1) {
      sendError(res, 404, 'NOT_FOUND', 'Alert record not found.');
      return;
    }
    db.pestAlerts.splice(idx, 1);
    writeDb(db);
    res.status(204).send();
  });

  app.post('/api/v1/admin/plant-health/sync-seed', requireAuth, requireAdmin, (_req, res) => {
    const db = readDb();
    const seedAlerts = loadSeedAlerts();
    const seedGuides = loadSeedGuides();
    for (const item of seedAlerts) {
      const idx = db.pestAlerts.findIndex(
        (a) => a.alertCode.toLowerCase() === item.alertCode.toLowerCase(),
      );
      if (idx >= 0) {
        db.pestAlerts[idx] = { ...item, id: db.pestAlerts[idx].id };
      } else {
        db.pestAlerts.push(item);
      }
    }
    for (const item of seedGuides) {
      const idx = db.protectionGuides.findIndex(
        (g) => g.guideCode.toLowerCase() === item.guideCode.toLowerCase(),
      );
      if (idx >= 0) {
        db.protectionGuides[idx] = { ...item, id: db.protectionGuides[idx].id };
      } else {
        db.protectionGuides.push(item);
      }
    }
    writeDb(db);
    res.json({
      alertsImported: seedAlerts.length,
      guidesImported: seedGuides.length,
    });
  });

  app.get('/api/v1/admin/plant-health/guides', requireAuth, requireAdmin, (_req, res) => {
    const db = readDb();
    const sorted = [...db.protectionGuides].sort((a, b) =>
      a.cropNameEn.localeCompare(b.cropNameEn),
    );
    res.json(sorted);
  });

  app.post('/api/v1/admin/plant-health/guides', requireAuth, requireAdmin, (req, res) => {
    const body = req.body ?? {};
    const fieldErrors: Record<string, string> = {};
    const guideCode = sanitizePlainText(body.guideCode, 80).toLowerCase();
    const cropCode = sanitizePlainText(body.cropCode, 60).toLowerCase();
    const issueNameEn = sanitizePlainText(body.issueNameEn, 160);
    const issueNameKn = sanitizePlainText(body.issueNameKn, 160);
    const issueType = sanitizePlainText(body.issueType, 40).toUpperCase();

    if (!guideCode) fieldErrors.guideCode = 'Guide code is required.';
    if (!cropCode) fieldErrors.cropCode = 'Crop code is required.';
    if (!issueNameEn) fieldErrors.issueNameEn = 'English issue name is required.';
    if (!issueNameKn) fieldErrors.issueNameKn = 'Kannada issue name is required.';
    if (!['FUNGAL_DISEASE', 'BACTERIAL_DISEASE', 'INSECT_PEST'].includes(issueType)) {
      fieldErrors.issueType =
        'Issue type must be FUNGAL_DISEASE, BACTERIAL_DISEASE, or INSECT_PEST.';
    }
    if (Object.keys(fieldErrors).length > 0) {
      sendError(res, 400, 'VALIDATION_ERROR', 'Input validation failed.', fieldErrors);
      return;
    }

    const toCleanList = (val: unknown): string[] =>
      Array.isArray(val)
        ? val
            .map((item) => sanitizePlainText(item, 240))
            .filter(Boolean)
            .slice(0, 12)
        : [];

    const db = readDb();
    const existingIdx = db.protectionGuides.findIndex(
      (g) => g.guideCode.toLowerCase() === guideCode,
    );
    const cropNameEn = sanitizePlainText(body.cropNameEn, 120) || cropCode;
    const cropNameKn = sanitizePlainText(body.cropNameKn, 120) || cropNameEn;
    const favorableConditionsEn = sanitizePlainText(body.favorableConditionsEn, 400);
    const favorableConditionsKn =
      sanitizePlainText(body.favorableConditionsKn, 400) || favorableConditionsEn;
    const symptomsEn = toCleanList(body.symptomsEn);
    const symptomsKn = toCleanList(body.symptomsKn);
    const preventivePracticesEn = toCleanList(body.preventivePracticesEn);
    const preventivePracticesKn = toCleanList(body.preventivePracticesKn);
    const responsibleManagementEn = toCleanList(body.responsibleManagementEn);
    const responsibleManagementKn = toCleanList(body.responsibleManagementKn);

    const record: PlantProtectionGuideRecord = {
      id: existingIdx >= 0 ? db.protectionGuides[existingIdx].id : crypto.randomUUID(),
      guideCode,
      cropCode,
      cropNameEn,
      cropNameKn,
      issueNameEn,
      issueNameKn,
      issueType,
      scientificName: sanitizePlainText(body.scientificName, 160) || null,
      favorableConditionsEn,
      favorableConditionsKn,
      symptomsEn,
      symptomsKn: symptomsKn.length > 0 ? symptomsKn : symptomsEn,
      preventivePracticesEn,
      preventivePracticesKn:
        preventivePracticesKn.length > 0 ? preventivePracticesKn : preventivePracticesEn,
      responsibleManagementEn,
      responsibleManagementKn:
        responsibleManagementKn.length > 0 ? responsibleManagementKn : responsibleManagementEn,
      safetyNotesEn:
        sanitizePlainText(body.safetyNotesEn, 500) ||
        'Confirm exact CIBRC label recommendations with your local RSK or KVK before any chemical use.',
      safetyNotesKn:
        sanitizePlainText(body.safetyNotesKn, 500) ||
        'ಯಾವುದೇ ರಾಸಾಯನಿಕ ಬಳಸುವ ಮೊದಲು ಸ್ಥಳೀಯ ಆರ್‌ಎಸ್‌ಕೆ ಅಥವಾ ಕೆವಿಕೆಯಿಂದ ಶಿಫಾರಸು ದೃಢೀಕರಿಸಿ.',
      dataReliability:
        body.dataReliability === 'SAMPLE_REGIONAL_REFERENCE'
          ? 'SAMPLE_REGIONAL_REFERENCE'
          : 'CURATED_REFERENCE',
      sourceReference: sanitizePlainText(body.sourceReference, 300) || 'Admin Protection Directory',
    };

    if (existingIdx >= 0) {
      db.protectionGuides[existingIdx] = record;
    } else {
      db.protectionGuides.unshift(record);
    }
    writeDb(db);
    res.status(201).json(record);
  });

  app.delete('/api/v1/admin/plant-health/guides/:id', requireAuth, requireAdmin, (req, res) => {
    const db = readDb();
    const idx = db.protectionGuides.findIndex((g) => g.id === req.params.id);
    if (idx === -1) {
      sendError(res, 404, 'NOT_FOUND', 'Protection guide record not found.');
      return;
    }
    db.protectionGuides.splice(idx, 1);
    writeDb(db);
    res.status(204).send();
  });

  // --- Phase 4: Market & Weather + Smart Alerts Routes ---
  app.get('/api/v1/market-weather/mandi-prices', requireAuth, async (req, res) => {
    const db = readDb();
    const limitRaw = typeof req.query.limit === 'string' ? Number(req.query.limit) : 50;
    const offsetRaw = typeof req.query.offset === 'string' ? Number(req.query.offset) : 0;
    const { response, newlyFetched } = await fetchMandiPrices(
      {
        commodity: typeof req.query.commodity === 'string' ? req.query.commodity : undefined,
        state: typeof req.query.state === 'string' ? req.query.state : undefined,
        district: typeof req.query.district === 'string' ? req.query.district : undefined,
        market: typeof req.query.market === 'string' ? req.query.market : undefined,
        q: typeof req.query.q === 'string' ? req.query.q : undefined,
        limit: Number.isFinite(limitRaw) ? limitRaw : 50,
        offset: Number.isFinite(offsetRaw) ? offsetRaw : 0,
      },
      db.mandiPriceRecords,
    );

    if (newlyFetched.length > 0) {
      const { merged } = mergeMandiRecords(db.mandiPriceRecords, newlyFetched);
      db.mandiPriceRecords = merged;
      writeDb(db);
    }

    res.json(response);
  });

  app.get('/api/v1/market-weather/trends', requireAuth, async (req, res) => {
    const db = readDb();
    const daysRaw = typeof req.query.days === 'string' ? Number(req.query.days) : undefined;
    const { response, newlyFetched } = await getPriceTrends(
      {
        commodity: typeof req.query.commodity === 'string' ? req.query.commodity : undefined,
        market: typeof req.query.market === 'string' ? req.query.market : undefined,
        district: typeof req.query.district === 'string' ? req.query.district : undefined,
        state: typeof req.query.state === 'string' ? req.query.state : undefined,
        days: daysRaw && Number.isFinite(daysRaw) ? daysRaw : undefined,
      },
      db.mandiPriceRecords,
    );

    if (newlyFetched.length > 0) {
      const { merged } = mergeMandiRecords(db.mandiPriceRecords, newlyFetched);
      db.mandiPriceRecords = merged;
      writeDb(db);
    }

    res.json(response);
  });

  app.get('/api/v1/market-weather/locations/search', requireAuth, async (req, res) => {
    const q = typeof req.query.q === 'string' ? req.query.q : '';
    try {
      const results = await searchOpenMeteoLocations(q);
      res.json(results);
    } catch (err) {
      if (err instanceof UpstreamApiError) {
        sendError(res, err.statusCode, err.errorCode, err.message);
        return;
      }
      sendError(res, 503, 'UPSTREAM_ERROR', 'Unable to search locations right now.');
    }
  });

  app.get('/api/v1/market-weather/weather', requireAuth, async (req: AuthenticatedRequest, res) => {
    const db = readDb();
    const profile = db.profiles.find((p) => p.userId === req.authUser?.id);

    const hasLat = typeof req.query.lat === 'string' && req.query.lat.trim() !== '';
    const hasLon = typeof req.query.lon === 'string' && req.query.lon.trim() !== '';
    const lat = hasLat ? Number(req.query.lat) : null;
    const lon = hasLon ? Number(req.query.lon) : null;

    if ((hasLat && Number.isNaN(lat)) || (hasLon && Number.isNaN(lon))) {
      sendError(res, 400, 'VALIDATION_ERROR', 'Latitude and longitude must be valid numbers.', {
        latitude: 'Enter valid numeric coordinates.',
      });
      return;
    }

    const q = typeof req.query.q === 'string' && req.query.q.trim() ? req.query.q.trim() : null;
    const locationName =
      typeof req.query.locationName === 'string' && req.query.locationName.trim()
        ? req.query.locationName.trim()
        : null;

    try {
      const forecast = await getWeatherForecast({
        latitude: lat,
        longitude: lon,
        locationName,
        q,
        state: profile?.state || null,
        district: !q && lat === null ? profile?.district || null : null,
      });
      res.json(forecast);
    } catch (err) {
      if (err instanceof UpstreamApiError) {
        sendError(res, err.statusCode, err.errorCode, err.message);
        return;
      }
      sendError(res, 503, 'UPSTREAM_ERROR', 'Unable to fetch weather forecast right now.');
    }
  });

  app.get('/api/v1/market-weather/smart-alerts', requireAuth, async (req: AuthenticatedRequest, res) => {
    const db = readDb();
    const profile = db.profiles.find((p) => p.userId === req.authUser?.id);

    const latRaw = typeof req.query.lat === 'string' && req.query.lat.trim() !== '' ? Number(req.query.lat) : null;
    const lonRaw = typeof req.query.lon === 'string' && req.query.lon.trim() !== '' ? Number(req.query.lon) : null;
    const validLat = latRaw !== null && Number.isFinite(latRaw) && latRaw >= -90 && latRaw <= 90 ? latRaw : null;
    const validLon = lonRaw !== null && Number.isFinite(lonRaw) && lonRaw >= -180 && lonRaw <= 180 ? lonRaw : null;

    const result = await buildSmartAlerts({
      state: profile?.state || null,
      district: profile?.district || null,
      latitude: validLat,
      longitude: validLon,
      pestAlerts: db.pestAlerts,
    });
    res.json(result);
  });

  // --- Admin Market Records Oversight ---
  app.get('/api/v1/admin/market/prices', requireAuth, requireAdmin, (_req, res) => {
    const db = readDb();
    const sorted = [...db.mandiPriceRecords].sort((a, b) =>
      b.arrivalDate.localeCompare(a.arrivalDate),
    );
    res.json(sorted);
  });

  app.post('/api/v1/admin/market/prices', requireAuth, requireAdmin, (req, res) => {
    const body = req.body ?? {};
    const fieldErrors: Record<string, string> = {};
    if (typeof body.commodity !== 'string' || !body.commodity.trim()) {
      fieldErrors.commodity = 'Commodity name is required.';
    }
    if (typeof body.market !== 'string' || !body.market.trim()) {
      fieldErrors.market = 'Market / APMC mandi name is required.';
    }
    if (typeof body.state !== 'string' || !body.state.trim()) {
      fieldErrors.state = 'State is required.';
    }
    if (typeof body.district !== 'string' || !body.district.trim()) {
      fieldErrors.district = 'District is required.';
    }
    if (typeof body.arrivalDate !== 'string' || !body.arrivalDate.trim()) {
      fieldErrors.arrivalDate = 'Arrival date is required.';
    }

    const modalPrice = Number(body.modalPrice);
    const minPrice =
      body.minPrice !== undefined && body.minPrice !== null && body.minPrice !== ''
        ? Number(body.minPrice)
        : modalPrice;
    const maxPrice =
      body.maxPrice !== undefined && body.maxPrice !== null && body.maxPrice !== ''
        ? Number(body.maxPrice)
        : modalPrice;

    if (Number.isNaN(modalPrice) || modalPrice <= 0) {
      fieldErrors.modalPrice = 'Valid modal price (> 0 INR/Quintal) is required.';
    }
    if (Number.isNaN(minPrice) || minPrice <= 0 || Number.isNaN(maxPrice) || maxPrice < minPrice) {
      fieldErrors.minPrice = 'Min price must be > 0 and <= Max price.';
    }
    if (Object.keys(fieldErrors).length > 0) {
      sendError(res, 400, 'VALIDATION_ERROR', 'Input validation failed.', fieldErrors);
      return;
    }

    const { iso, rawText } = normalizeAgmarknetDate(body.arrivalDate);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
      sendError(res, 400, 'VALIDATION_ERROR', 'Arrival date must be YYYY-MM-DD or DD/MM/YYYY.', {
        arrivalDate: 'Use YYYY-MM-DD or DD/MM/YYYY format.',
      });
      return;
    }

    const db = readDb();
    const record: MandiPriceRecord = {
      id: crypto.randomUUID(),
      commodity: body.commodity.trim(),
      variety: typeof body.variety === 'string' && body.variety.trim() ? body.variety.trim() : 'FAQ',
      grade: typeof body.grade === 'string' && body.grade.trim() ? body.grade.trim() : 'FAQ',
      state: body.state.trim(),
      district: body.district.trim(),
      market: body.market.trim(),
      minPrice,
      maxPrice,
      modalPrice,
      unit: 'INR / Quintal',
      arrivalDate: iso,
      reportedDateRaw: rawText || iso,
      sourceName:
        typeof body.sourceName === 'string' && body.sourceName.trim()
          ? body.sourceName.trim()
          : 'Admin Verified Agmarknet Bulletin',
      resourceId: null,
      fetchedAt: new Date().toISOString(),
    };

    const { merged } = mergeMandiRecords(db.mandiPriceRecords, [record]);
    db.mandiPriceRecords = merged;
    writeDb(db);
    res.status(201).json(record);
  });

  app.delete('/api/v1/admin/market/prices/:id', requireAuth, requireAdmin, (req, res) => {
    const db = readDb();
    const idx = db.mandiPriceRecords.findIndex((r) => r.id === req.params.id);
    if (idx === -1) {
      sendError(res, 404, 'NOT_FOUND', 'Mandi price record not found.');
      return;
    }
    db.mandiPriceRecords.splice(idx, 1);
    writeDb(db);
    res.status(204).send();
  });

  app.post('/api/v1/admin/market/sync-live', requireAuth, requireAdmin, async (req, res) => {
    const db = readDb();
    const body = req.body ?? {};
    const { response, newlyFetched } = await fetchMandiPrices(
      {
        state: typeof body.state === 'string' ? body.state : 'Karnataka',
        commodity: typeof body.commodity === 'string' ? body.commodity : undefined,
        limit: 100,
      },
      db.mandiPriceRecords,
    );
    if (newlyFetched.length > 0) {
      const { merged, addedOrUpdated } = mergeMandiRecords(db.mandiPriceRecords, newlyFetched);
      db.mandiPriceRecords = merged;
      writeDb(db);
      res.json({
        status: response.status,
        syncedCount: addedOrUpdated,
        totalStored: merged.length,
        messageEn: response.messageEn,
      });
      return;
    }
    res.json({
      status: response.status,
      syncedCount: 0,
      totalStored: db.mandiPriceRecords.length,
      messageEn: response.messageEn,
    });
  });

  // --- Phase 5A: Agricultural Services Directory & Equipment Booking Requests ---
  app.get('/api/v1/agri-services/soil-labs', requireAuth, (req, res) => {
    const db = readDb();
    const labs = filterProviders(db.serviceProviders, {
      serviceTypes: ['SOIL_LAB_KVK'],
      state: typeof req.query.state === 'string' ? req.query.state : undefined,
      district: typeof req.query.district === 'string' ? req.query.district : undefined,
      q: typeof req.query.q === 'string' ? req.query.q : undefined,
    });
    const allStates = Array.from(
      new Set(
        db.serviceProviders
          .filter((p) => p.active && p.serviceType === 'SOIL_LAB_KVK')
          .map((p) => p.state),
      ),
    ).sort((a, b) => a.localeCompare(b));
    const allDistricts = Array.from(
      new Set(
        db.serviceProviders
          .filter((p) => p.active && p.serviceType === 'SOIL_LAB_KVK')
          .map((p) => p.district),
      ),
    ).sort((a, b) => a.localeCompare(b));

    res.json({
      providers: labs,
      checklist: SOIL_TESTING_CHECKLIST,
      availableStates: allStates,
      availableDistricts: allDistricts,
    });
  });

  app.get('/api/v1/agri-services/equipment', requireAuth, (req, res) => {
    const db = readDb();
    const listings = filterEquipmentListings(db.equipmentListings, {
      category: typeof req.query.category === 'string' ? req.query.category : undefined,
      state: typeof req.query.state === 'string' ? req.query.state : undefined,
      district: typeof req.query.district === 'string' ? req.query.district : undefined,
      q: typeof req.query.q === 'string' ? req.query.q : undefined,
    });
    const availableStates = Array.from(
      new Set(db.equipmentListings.filter((e) => e.active).map((e) => e.state)),
    ).sort((a, b) => a.localeCompare(b));
    const availableDistricts = Array.from(
      new Set(db.equipmentListings.filter((e) => e.active).map((e) => e.district)),
    ).sort((a, b) => a.localeCompare(b));

    res.json({
      listings,
      availableStates,
      availableDistricts,
    });
  });

  app.get('/api/v1/agri-services/equipment/bookings', requireAuth, (req: AuthenticatedRequest, res) => {
    const db = readDb();
    const mine = db.equipmentBookings
      .filter((b) => b.userId === req.authUser?.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(mine);
  });

  app.post('/api/v1/agri-services/equipment/bookings', requireAuth, (req: AuthenticatedRequest, res) => {
    if (req.authUser?.role !== 'FARMER') {
      sendError(res, 403, 'FORBIDDEN', 'Farmer role required to submit equipment booking requests.');
      return;
    }
    const body = req.body ?? {};
    const fieldErrors: Record<string, string> = {};

    const equipmentId = typeof body.equipmentId === 'string' ? body.equipmentId.trim() : '';
    const requestedDate = typeof body.requestedDate === 'string' ? body.requestedDate.trim() : '';
    const durationValue = Number(body.durationValue);
    const durationUnitRaw =
      typeof body.durationUnit === 'string' ? body.durationUnit.trim().toUpperCase() : 'HOURS';
    const contactPhone = typeof body.contactPhone === 'string' ? body.contactPhone.trim() : '';

    if (!equipmentId) fieldErrors.equipmentId = 'Select an equipment listing.';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(requestedDate)) {
      fieldErrors.requestedDate = 'Provide a valid preferred date (YYYY-MM-DD).';
    }
    if (!Number.isFinite(durationValue) || durationValue <= 0 || durationValue > 500) {
      fieldErrors.durationValue = 'Enter a valid duration or area (> 0).';
    }
    if (!['HOURS', 'ACRES', 'DAYS'].includes(durationUnitRaw)) {
      fieldErrors.durationUnit = 'Duration unit must be HOURS, ACRES, or DAYS.';
    }
    if (contactPhone.replace(/\D/g, '').length < 10) {
      fieldErrors.contactPhone = 'Enter a valid 10-digit callback mobile number.';
    }

    if (Object.keys(fieldErrors).length > 0) {
      sendError(res, 400, 'VALIDATION_ERROR', 'Input validation failed.', fieldErrors);
      return;
    }

    const db = readDb();
    const listing = db.equipmentListings.find((e) => e.id === equipmentId && e.active);
    if (!listing) {
      sendError(res, 404, 'NOT_FOUND', 'Selected equipment listing not found.');
      return;
    }

    const user = db.users.find((u) => u.id === req.authUser?.id);
    const profile = db.profiles.find((p) => p.userId === req.authUser?.id);
    const farmerName = profile?.farmerName || user?.fullName || 'Farmer';

    const booking = buildBookingRequestRecord({
      userId: req.authUser.id,
      farmerName,
      listing,
      requestedDate,
      durationValue,
      durationUnit: durationUnitRaw as 'HOURS' | 'ACRES' | 'DAYS',
      contactPhone: contactPhone.slice(0, 20),
      notes:
        typeof body.notes === 'string' && body.notes.trim()
          ? body.notes.trim().slice(0, 400)
          : null,
    });

    db.equipmentBookings.unshift(booking);
    writeDb(db);
    res.status(201).json(booking);
  });

  app.patch(
    '/api/v1/agri-services/equipment/bookings/:id/cancel',
    requireAuth,
    (req: AuthenticatedRequest, res) => {
      const db = readDb();
      const idx = db.equipmentBookings.findIndex(
        (b) => b.id === req.params.id && b.userId === req.authUser?.id,
      );
      if (idx === -1) {
        sendError(res, 404, 'NOT_FOUND', 'Equipment booking request not found.');
        return;
      }
      const existing = db.equipmentBookings[idx];
      if (existing.status === 'COMPLETED' || existing.status === 'CANCELLED') {
        sendError(res, 400, 'BAD_REQUEST', 'Completed or cancelled booking requests cannot be cancelled.');
        return;
      }
      existing.status = 'CANCELLED';
      existing.updatedAt = new Date().toISOString();
      writeDb(db);
      res.json(existing);
    },
  );

  app.get('/api/v1/agri-services/directory', requireAuth, (req, res) => {
    const db = readDb();
    const rawType =
      typeof req.query.serviceType === 'string' ? req.query.serviceType.trim().toUpperCase() : '';
    const allowedNonLab: ServiceProviderType[] = [
      'COLD_STORAGE',
      'MANDI_APMC',
      'CUSTOM_HIRING_CENTRE',
      'INPUT_SEED_CENTRE',
      'EXTENSION_BANK',
    ];
    const filterTypes: ServiceProviderType[] =
      rawType && rawType !== 'ALL' && allowedNonLab.includes(rawType as ServiceProviderType)
        ? [rawType as ServiceProviderType]
        : allowedNonLab;

    const providers = filterProviders(db.serviceProviders, {
      serviceTypes: filterTypes,
      state: typeof req.query.state === 'string' ? req.query.state : undefined,
      district: typeof req.query.district === 'string' ? req.query.district : undefined,
      q: typeof req.query.q === 'string' ? req.query.q : undefined,
    });
    const availableStates = Array.from(
      new Set(
        db.serviceProviders
          .filter((p) => p.active && allowedNonLab.includes(p.serviceType))
          .map((p) => p.state),
      ),
    ).sort((a, b) => a.localeCompare(b));
    const availableDistricts = Array.from(
      new Set(
        db.serviceProviders
          .filter((p) => p.active && allowedNonLab.includes(p.serviceType))
          .map((p) => p.district),
      ),
    ).sort((a, b) => a.localeCompare(b));

    res.json({
      providers,
      availableStates,
      availableDistricts,
    });
  });

  // --- Admin Agricultural Services & Equipment Bookings Management ---
  app.get('/api/v1/admin/services/providers', requireAuth, requireAdmin, (_req, res) => {
    const db = readDb();
    res.json(db.serviceProviders);
  });

  app.post('/api/v1/admin/services/providers', requireAuth, requireAdmin, (req, res) => {
    const body = req.body ?? {};
    const fieldErrors: Record<string, string> = {};
    const validTypes = new Set([
      'SOIL_LAB_KVK',
      'COLD_STORAGE',
      'MANDI_APMC',
      'CUSTOM_HIRING_CENTRE',
      'INPUT_SEED_CENTRE',
      'EXTENSION_BANK',
    ]);
    const serviceType = String(body.serviceType || '').trim().toUpperCase();
    if (!validTypes.has(serviceType)) fieldErrors.serviceType = 'Valid service type is required.';
    if (typeof body.nameEn !== 'string' || !body.nameEn.trim()) {
      fieldErrors.nameEn = 'English provider name is required.';
    }
    if (typeof body.state !== 'string' || !body.state.trim()) {
      fieldErrors.state = 'State is required.';
    }
    if (typeof body.district !== 'string' || !body.district.trim()) {
      fieldErrors.district = 'District is required.';
    }
    if (typeof body.addressEn !== 'string' || !body.addressEn.trim()) {
      fieldErrors.addressEn = 'Address is required.';
    }
    if (Object.keys(fieldErrors).length > 0) {
      sendError(res, 400, 'VALIDATION_ERROR', 'Input validation failed.', fieldErrors);
      return;
    }

    const latRaw =
      body.latitude !== undefined && body.latitude !== null && body.latitude !== ''
        ? Number(body.latitude)
        : null;
    const lonRaw =
      body.longitude !== undefined && body.longitude !== null && body.longitude !== ''
        ? Number(body.longitude)
        : null;
    const hasCoords =
      latRaw !== null &&
      lonRaw !== null &&
      Number.isFinite(latRaw) &&
      Number.isFinite(lonRaw) &&
      latRaw >= -90 &&
      latRaw <= 90 &&
      lonRaw >= -180 &&
      lonRaw <= 180;

    const db = readDb();
    const record: AgriServiceProviderRecord = {
      id: crypto.randomUUID(),
      providerCode:
        typeof body.providerCode === 'string' && body.providerCode.trim()
          ? body.providerCode.trim().toLowerCase()
          : `admin-${crypto.randomUUID().slice(0, 8)}`,
      serviceType: serviceType as ServiceProviderType,
      nameEn: body.nameEn.trim(),
      nameKn:
        typeof body.nameKn === 'string' && body.nameKn.trim()
          ? body.nameKn.trim()
          : body.nameEn.trim(),
      state: body.state.trim(),
      district: body.district.trim(),
      addressEn: body.addressEn.trim(),
      addressKn:
        typeof body.addressKn === 'string' && body.addressKn.trim()
          ? body.addressKn.trim()
          : body.addressEn.trim(),
      contactPhone:
        typeof body.contactPhone === 'string' && body.contactPhone.trim()
          ? body.contactPhone.trim()
          : null,
      contactEmail:
        typeof body.contactEmail === 'string' && body.contactEmail.trim()
          ? body.contactEmail.trim()
          : null,
      websiteUrl:
        typeof body.websiteUrl === 'string' && body.websiteUrl.trim()
          ? body.websiteUrl.trim()
          : null,
      servicesOfferedEn: Array.isArray(body.servicesOfferedEn) ? body.servicesOfferedEn : [],
      servicesOfferedKn: Array.isArray(body.servicesOfferedKn) ? body.servicesOfferedKn : [],
      capacityNoteEn:
        typeof body.capacityNoteEn === 'string' && body.capacityNoteEn.trim()
          ? body.capacityNoteEn.trim()
          : null,
      capacityNoteKn:
        typeof body.capacityNoteKn === 'string' && body.capacityNoteKn.trim()
          ? body.capacityNoteKn.trim()
          : null,
      latitude: hasCoords ? latRaw : null,
      longitude: hasCoords ? lonRaw : null,
      coordinatesVerified: hasCoords && Boolean(body.coordinatesVerified),
      verificationStatus:
        body.verificationStatus === 'VERIFIED_DIRECTORY'
          ? 'VERIFIED_DIRECTORY'
          : 'DEMONSTRATION_SAMPLE',
      sourceReference:
        typeof body.sourceReference === 'string' && body.sourceReference.trim()
          ? body.sourceReference.trim()
          : 'Admin Directory Entry',
      active: true,
    };
    db.serviceProviders.unshift(record);
    writeDb(db);
    res.status(201).json(record);
  });

  app.delete('/api/v1/admin/services/providers/:id', requireAuth, requireAdmin, (req, res) => {
    const db = readDb();
    const idx = db.serviceProviders.findIndex((p) => p.id === req.params.id);
    if (idx === -1) {
      sendError(res, 404, 'NOT_FOUND', 'Service provider entry not found.');
      return;
    }
    db.serviceProviders.splice(idx, 1);
    writeDb(db);
    res.status(204).send();
  });

  app.get('/api/v1/admin/services/equipment', requireAuth, requireAdmin, (_req, res) => {
    const db = readDb();
    res.json(db.equipmentListings);
  });

  app.post('/api/v1/admin/services/equipment', requireAuth, requireAdmin, (req, res) => {
    const body = req.body ?? {};
    const fieldErrors: Record<string, string> = {};
    const category = String(body.category || '').trim().toUpperCase();
    if (!['TRACTOR', 'HARVESTER', 'OTHER'].includes(category)) {
      fieldErrors.category = 'Category must be TRACTOR, HARVESTER, or OTHER.';
    }
    if (typeof body.equipmentNameEn !== 'string' || !body.equipmentNameEn.trim()) {
      fieldErrors.equipmentNameEn = 'Equipment name is required.';
    }
    if (typeof body.providerNameEn !== 'string' || !body.providerNameEn.trim()) {
      fieldErrors.providerNameEn = 'Provider name is required.';
    }
    if (typeof body.state !== 'string' || !body.state.trim()) fieldErrors.state = 'State is required.';
    if (typeof body.district !== 'string' || !body.district.trim()) {
      fieldErrors.district = 'District is required.';
    }
    if (Object.keys(fieldErrors).length > 0) {
      sendError(res, 400, 'VALIDATION_ERROR', 'Input validation failed.', fieldErrors);
      return;
    }

    const rateVal =
      body.rateInr !== undefined && body.rateInr !== null && body.rateInr !== ''
        ? Number(body.rateInr)
        : null;
    const rateValid = rateVal !== null && Number.isFinite(rateVal) && rateVal > 0;

    const db = readDb();
    const record: EquipmentListingRecord = {
      id: crypto.randomUUID(),
      listingCode: `eq-${crypto.randomUUID().slice(0, 8)}`,
      category: category as EquipmentListingRecord['category'],
      equipmentNameEn: body.equipmentNameEn.trim(),
      equipmentNameKn:
        typeof body.equipmentNameKn === 'string' && body.equipmentNameKn.trim()
          ? body.equipmentNameKn.trim()
          : body.equipmentNameEn.trim(),
      modelOrSpecEn:
        typeof body.modelOrSpecEn === 'string' && body.modelOrSpecEn.trim()
          ? body.modelOrSpecEn.trim()
          : 'Standard farm implement',
      modelOrSpecKn:
        typeof body.modelOrSpecKn === 'string' && body.modelOrSpecKn.trim()
          ? body.modelOrSpecKn.trim()
          : 'ಕೃಷಿ ಯಂತ್ರೋಪಕರಣ',
      providerNameEn: body.providerNameEn.trim(),
      providerNameKn:
        typeof body.providerNameKn === 'string' && body.providerNameKn.trim()
          ? body.providerNameKn.trim()
          : body.providerNameEn.trim(),
      state: body.state.trim(),
      district: body.district.trim(),
      contactPhone:
        typeof body.contactPhone === 'string' && body.contactPhone.trim()
          ? body.contactPhone.trim()
          : null,
      rateInr: rateValid ? rateVal : null,
      rateUnit:
        body.rateUnit === 'ACRE' || body.rateUnit === 'DAY' ? body.rateUnit : 'HOUR',
      rateVerified: rateValid && Boolean(body.rateVerified),
      availabilityStatus:
        body.availabilityStatus === 'AVAILABLE' || body.availabilityStatus === 'SEASONAL_DEMAND'
          ? body.availabilityStatus
          : 'UNVERIFIED',
      verificationStatus:
        body.verificationStatus === 'VERIFIED_DIRECTORY'
          ? 'VERIFIED_DIRECTORY'
          : 'DEMONSTRATION_SAMPLE',
      sourceReference:
        typeof body.sourceReference === 'string' && body.sourceReference.trim()
          ? body.sourceReference.trim()
          : 'Admin Verified CHC Listing',
      active: true,
    };

    db.equipmentListings.unshift(record);
    writeDb(db);
    res.status(201).json(record);
  });

  app.delete('/api/v1/admin/services/equipment/:id', requireAuth, requireAdmin, (req, res) => {
    const db = readDb();
    const idx = db.equipmentListings.findIndex((e) => e.id === req.params.id);
    if (idx === -1) {
      sendError(res, 404, 'NOT_FOUND', 'Equipment listing not found.');
      return;
    }
    db.equipmentListings.splice(idx, 1);
    writeDb(db);
    res.status(204).send();
  });

  app.get('/api/v1/admin/services/bookings', requireAuth, requireAdmin, (_req, res) => {
    const db = readDb();
    const sorted = [...db.equipmentBookings].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    res.json(sorted);
  });

  app.patch('/api/v1/admin/services/bookings/:id', requireAuth, requireAdmin, (req, res) => {
    const body = req.body ?? {};
    const status = String(body.status || '').trim().toUpperCase();
    const validStatuses: BookingRequestStatus[] = [
      'REQUESTED',
      'REVIEWING',
      'FORWARDED_TO_PROVIDER',
      'COMPLETED',
      'CANCELLED',
    ];
    if (!validStatuses.includes(status as BookingRequestStatus)) {
      sendError(res, 400, 'VALIDATION_ERROR', 'Invalid booking request status.');
      return;
    }
    const db = readDb();
    const item = db.equipmentBookings.find((b) => b.id === req.params.id);
    if (!item) {
      sendError(res, 404, 'NOT_FOUND', 'Booking request not found.');
      return;
    }
    item.status = status as BookingRequestStatus;
    item.adminNote =
      typeof body.adminNote === 'string' && body.adminNote.trim()
        ? body.adminNote.trim().slice(0, 300)
        : item.adminNote;
    item.updatedAt = new Date().toISOString();
    writeDb(db);
    res.json(item);
  });

  // --- Phase 5B: Gemini AI Farmer Assistant Routes ---
  app.get('/api/v1/ai-assistant/status', requireAuth, (_req, res) => {
    res.json(getAiAssistantStatus());
  });

  app.get('/api/v1/ai-assistant/messages', requireAuth, (req: AuthenticatedRequest, res) => {
    const db = readDb();
    const history = db.aiChatMessages
      .filter((m) => m.userId === req.authUser?.id)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    res.json(history);
  });

  app.post('/api/v1/ai-assistant/chat', requireAuth, async (req: AuthenticatedRequest, res) => {
    const body = req.body ?? {};
    const message = typeof body.message === 'string' ? body.message : '';
    const language = body.language === 'kn' ? 'kn' : 'en';

    const db = readDb();
    const profile = db.profiles.find((p) => p.userId === req.authUser?.id) || null;
    const recentHistory = db.aiChatMessages
      .filter((m) => m.userId === req.authUser?.id)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    try {
      const { userEntry, assistantEntry } = await generateGroundedAiReply({
        userId: req.authUser!.id,
        userMessage: message,
        language,
        profile,
        crops: db.crops,
        guides: db.protectionGuides,
        recentHistory,
      });

      db.aiChatMessages.push(userEntry, assistantEntry);
      writeDb(db);
      res.status(201).json({
        userMessage: userEntry,
        assistantMessage: assistantEntry,
      });
    } catch (err) {
      if (err instanceof AiServiceError) {
        sendError(res, err.statusCode, err.errorCode, err.message);
        return;
      }
      sendError(res, 502, 'UPSTREAM_ERROR', 'Unable to reach AI Farmer Assistant service right now.');
    }
  });

  app.delete('/api/v1/ai-assistant/messages', requireAuth, (req: AuthenticatedRequest, res) => {
    const db = readDb();
    db.aiChatMessages = db.aiChatMessages.filter((m) => m.userId !== req.authUser?.id);
    writeDb(db);
    res.status(204).send();
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
