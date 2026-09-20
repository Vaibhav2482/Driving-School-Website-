import { randomUUID } from "node:crypto";
import type { PrismaClient } from "../lib/prisma.js";

/**
 * A small in-memory stand-in for Prisma, used ONLY in tests so the security logic (sessions, rotation,
 * ownership filters, outbox) can be exercised without PostgreSQL. It implements just the subset the
 * code under test uses, and the semantics that matter for correctness:
 *   - unique constraints (P2002),
 *   - `updateMany` with a `where` that is evaluated atomically (used for token claims),
 *   - `{ increment }` updates, relations for the few joins we use,
 *   - interactive transactions with rollback on error.
 * It is NOT a database: passing tests here does not prove the real SQL, migrations or indexes work.
 */

type Row = Record<string, unknown>;
type Where = Record<string, unknown>;

const UNIQUE: Record<string, string[]> = {
  user: ["email", "phone"],
  refreshToken: ["tokenHash"],
  authToken: ["tokenHash"],
  student: ["userId"],
  instructor: ["userId"],
  branch: ["slug", "name"],
  package: ["slug"],
};

/** Relations resolved by `select`/`where`: table → key → how to find the related row(s). */
const RELATIONS: Record<
  string,
  Record<string, { table: string; local: string; foreign: string; many?: boolean }>
> = {
  refreshToken: { user: { table: "user", local: "userId", foreign: "id" } },
  user: {
    student: { table: "student", local: "id", foreign: "userId" },
    instructor: { table: "instructor", local: "id", foreign: "userId" },
  },
  student: {
    user: { table: "user", local: "userId", foreign: "id" },
    branch: { table: "branch", local: "branchId", foreign: "id" },
    lessons: { table: "lesson", local: "id", foreign: "studentId", many: true },
  },
  instructor: {
    user: { table: "user", local: "userId", foreign: "id" },
    branch: { table: "branch", local: "branchId", foreign: "id" },
  },
};

function knownRequestError(code: string, message: string) {
  return Object.assign(new Error(message), { name: "PrismaClientKnownRequestError", code });
}

const isPlainObject = (value: unknown): value is Row =>
  typeof value === "object" && value !== null && !(value instanceof Date) && !Array.isArray(value);

function equal(a: unknown, b: unknown): boolean {
  if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();
  return a === b;
}

function compare(a: unknown, b: unknown): number {
  const x = a instanceof Date ? a.getTime() : (a as number);
  const y = b instanceof Date ? b.getTime() : (b as number);
  return x < y ? -1 : x > y ? 1 : 0;
}

class FakeTable {
  rows: Row[] = [];
  constructor(
    readonly name: string,
    private readonly db: FakeDb,
  ) {}

  matches(row: Row, where: Where | undefined): boolean {
    if (!where) return true;
    for (const [key, condition] of Object.entries(where)) {
      if (key === "AND") {
        const list = Array.isArray(condition) ? (condition as Where[]) : [condition as Where];
        if (!list.every((w) => this.matches(row, w))) return false;
      } else if (key === "OR") {
        if (!(condition as Where[]).some((w) => this.matches(row, w))) return false;
      } else if (key === "NOT") {
        if (this.matches(row, condition as Where)) return false;
      } else if (RELATIONS[this.name]?.[key] && isPlainObject(condition)) {
        const rel = RELATIONS[this.name]![key]!;
        const related = this.db
          .table(rel.table)
          .rows.filter((r) => equal(r[rel.foreign], row[rel.local]));
        const some = condition.some as Where | undefined;
        if (some !== undefined) {
          const target = this.db.table(rel.table);
          if (!related.some((r) => target.matches(r, some))) return false;
        }
      } else if (condition === null) {
        if (row[key] !== null && row[key] !== undefined) return false;
      } else if (isPlainObject(condition)) {
        const value = row[key];
        for (const [op, expected] of Object.entries(condition)) {
          if (op === "equals" && !equal(value, expected)) return false;
          if (op === "not" && equal(value, expected)) return false;
          if (op === "gt" && !(compare(value, expected) > 0)) return false;
          if (op === "gte" && !(compare(value, expected) >= 0)) return false;
          if (op === "lt" && !(compare(value, expected) < 0)) return false;
          if (op === "lte" && !(compare(value, expected) <= 0)) return false;
          if (op === "in" && !(expected as unknown[]).some((e) => equal(value, e))) return false;
        }
      } else if (!equal(row[key], condition)) {
        return false;
      }
    }
    return true;
  }

  private project(row: Row, select: Row | undefined): Row {
    if (!select) return { ...row };
    const out: Row = {};
    for (const [key, spec] of Object.entries(select)) {
      if (!spec) continue;
      const rel = RELATIONS[this.name]?.[key];
      if (rel) {
        const target = this.db.table(rel.table);
        const found = target.rows.filter((r) => equal(r[rel.foreign], row[rel.local]));
        const pick = (r: Row) =>
          target.project(r, isPlainObject(spec) ? (spec.select as Row | undefined) : undefined);
        out[key] = rel.many ? found.map(pick) : found[0] ? pick(found[0]) : null;
      } else {
        out[key] = row[key];
      }
    }
    return out;
  }

  private apply(target: Row, data: Row) {
    for (const [key, value] of Object.entries(data)) {
      if (isPlainObject(value) && "increment" in value) {
        target[key] = ((target[key] as number) ?? 0) + (value.increment as number);
      } else if (value !== undefined) {
        target[key] = value;
      }
    }
  }

  private checkUnique(candidate: Row, ignore?: Row) {
    for (const column of UNIQUE[this.name] ?? []) {
      const value = candidate[column];
      if (value === null || value === undefined) continue;
      if (this.rows.some((r) => r !== ignore && equal(r[column], value))) {
        throw knownRequestError("P2002", `Unique constraint failed on ${this.name}.${column}`);
      }
    }
  }

  private order(rows: Row[], orderBy: unknown): Row[] {
    const spec = Array.isArray(orderBy)
      ? (orderBy[0] as Row | undefined)
      : (orderBy as Row | undefined);
    if (!spec) return rows;
    const [key, dir] = Object.entries(spec)[0] ?? [];
    if (!key) return rows;
    return [...rows].sort((a, b) => compare(a[key], b[key]) * (dir === "desc" ? -1 : 1));
  }

  // ── Prisma-like API ────────────────────────────────────────────────────────────────────────
  create = ({ data, select }: { data: Row; select?: Row }) => {
    const now = new Date();
    const row: Row = {
      id: randomUUID(),
      createdAt: now,
      updatedAt: now,
      ...this.defaults(),
      ...data,
    };
    this.checkUnique(row);
    this.rows.push(row);
    return Promise.resolve(this.project(row, select));
  };

  findUnique = ({ where, select }: { where: Where; select?: Row }) =>
    this.findFirst({ where, select });

  findFirst = ({
    where,
    select,
    orderBy,
  }: { where?: Where; select?: Row; orderBy?: unknown } = {}) => {
    const found = this.order(
      this.rows.filter((r) => this.matches(r, where)),
      orderBy,
    )[0];
    return Promise.resolve(found ? this.project(found, select) : null);
  };

  findMany = ({
    where,
    select,
    orderBy,
    take,
  }: { where?: Where; select?: Row; orderBy?: unknown; take?: number } = {}) => {
    let found = this.order(
      this.rows.filter((r) => this.matches(r, where)),
      orderBy,
    );
    if (take !== undefined) found = found.slice(0, take);
    return Promise.resolve(found.map((r) => this.project(r, select)));
  };

  update = ({ where, data, select }: { where: Where; data: Row; select?: Row }) => {
    const row = this.rows.find((r) => this.matches(r, where));
    if (!row) return Promise.reject(knownRequestError("P2025", "Record to update not found."));
    const next = { ...row };
    this.apply(next, data);
    this.checkUnique(next, row);
    Object.assign(row, next, { updatedAt: new Date() });
    return Promise.resolve(this.project(row, select));
  };

  /** Atomic: the `where` is evaluated and applied in one synchronous step, like a single SQL UPDATE. */
  updateMany = ({ where, data }: { where?: Where; data: Row }) => {
    const targets = this.rows.filter((r) => this.matches(r, where));
    for (const row of targets) {
      this.apply(row, data);
      row.updatedAt = new Date();
    }
    return Promise.resolve({ count: targets.length });
  };

  count = ({ where }: { where?: Where } = {}) =>
    Promise.resolve(this.rows.filter((r) => this.matches(r, where)).length);

  private defaults(): Row {
    switch (this.name) {
      case "user":
        return {
          isActive: true,
          mustChangePassword: false,
          failedLoginCount: 0,
          lockedUntil: null,
          lastLoginAt: null,
          deletedAt: null,
          email: null,
          phone: null,
        };
      case "refreshToken":
        return { revokedAt: null, replacedById: null, userAgent: null, ipAddress: null };
      case "authToken":
        return { usedAt: null };
      case "notification":
        return {
          attempts: 0,
          lastError: null,
          sentAt: null,
          readAt: null,
          userId: null,
          recipient: null,
        };
      case "student":
        return { status: "ACTIVE", deletedAt: null };
      case "instructor":
        return { isActive: true, deletedAt: null, bio: null, experienceYears: null };
      case "branch":
        return { isActive: true };
      case "enquiry":
        return { status: "NEW" };
      default:
        return {};
    }
  }
}

const TABLES = [
  "user",
  "refreshToken",
  "authToken",
  "auditLog",
  "notification",
  "student",
  "instructor",
  "branch",
  "lesson",
  "package",
  "enquiry",
] as const;

export class FakeDb {
  private tables = new Map<string, FakeTable>();

  constructor() {
    for (const name of TABLES) this.tables.set(name, new FakeTable(name, this));
  }

  table(name: string): FakeTable {
    const table = this.tables.get(name);
    if (!table) throw new Error(`FakeDb has no table "${name}"`);
    return table;
  }

  private txQueue: Promise<unknown> = Promise.resolve();

  /**
   * Interactive transaction with rollback: if the callback throws, every change is undone.
   * Transactions run one at a time, like row locks in PostgreSQL: a second transaction that touches the
   * same row waits for the first to commit, then sees its result.
   */
  $transaction = <T>(fn: (tx: FakeDb) => Promise<T>): Promise<T> => {
    const run = async (): Promise<T> => {
      const snapshot = new Map(
        [...this.tables].map(([name, t]) => [name, t.rows.map((r) => ({ ...r }))] as const),
      );
      try {
        return await fn(this);
      } catch (err) {
        for (const [name, rows] of snapshot) this.table(name).rows = rows;
        throw err;
      }
    };
    const result = this.txQueue.then(run, run);
    this.txQueue = result.catch(() => undefined);
    return result;
  };

  // Delegates in the shape of the Prisma client.
  get user() {
    return this.table("user");
  }
  get refreshToken() {
    return this.table("refreshToken");
  }
  get authToken() {
    return this.table("authToken");
  }
  get auditLog() {
    return this.table("auditLog");
  }
  get notification() {
    return this.table("notification");
  }
  get student() {
    return this.table("student");
  }
  get instructor() {
    return this.table("instructor");
  }
  get branch() {
    return this.table("branch");
  }
  get lesson() {
    return this.table("lesson");
  }
  get package() {
    return this.table("package");
  }
  get enquiry() {
    return this.table("enquiry");
  }

  /** Cast for passing into code that expects the real client. */
  asPrisma(): PrismaClient {
    return this as unknown as PrismaClient;
  }
}
