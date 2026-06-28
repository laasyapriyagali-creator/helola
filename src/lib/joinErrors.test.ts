import { describe, it, expect } from "vitest";
import { friendlyJoinError, isProfileHidden } from "@/lib/joinErrors";

describe("friendlyJoinError", () => {
  it("maps the BEFORE INSERT capacity trigger to 'Trip is full'", () => {
    const f = friendlyJoinError({ message: "Trip is full", code: "23514" });
    expect(f.title).toBe("This trip is full");
    expect(f.description).toMatch(/seats are taken/i);
  });

  it("maps PostgREST capacity raise (uppercase) regardless of casing", () => {
    const f = friendlyJoinError({ message: 'ERROR:  Trip is full\nCONTEXT: trigger enforce_trip_capacity' });
    expect(f.title).toBe("This trip is full");
  });

  it("maps duplicate trip_member to 'already in this trip'", () => {
    const f = friendlyJoinError({ code: "23505", message: "duplicate key value violates unique constraint" });
    expect(f.title).toMatch(/already in this trip/i);
  });

  it("maps RLS denial to a soft 'can't join' message", () => {
    const f = friendlyJoinError({ code: "42501", message: "new row violates row-level security policy" });
    expect(f.title).toMatch(/can't join/i);
  });

  it("maps permission-denied (no code) to 'can't join'", () => {
    const f = friendlyJoinError({ message: "permission denied for table trip_members" });
    expect(f.title).toMatch(/can't join/i);
  });

  it("falls back to a generic, non-technical message", () => {
    const f = friendlyJoinError({ message: "tcp connection reset by peer" });
    expect(f.title).toMatch(/couldn't join/i);
    expect(f.description).not.toMatch(/tcp/i);
  });

  it("never leaks raw SQL or column names to the user", () => {
    const raw = "ERROR: insert or update on table \"trip_members\" violates foreign key constraint";
    const f = friendlyJoinError({ message: raw });
    expect(JSON.stringify(f)).not.toMatch(/trip_members|foreign key|ERROR:/);
  });
});

describe("isProfileHidden", () => {
  it("treats null / undefined profile as hidden (RLS filtered)", () => {
    expect(isProfileHidden(null)).toBe(true);
    expect(isProfileHidden(undefined)).toBe(true);
  });
  it("treats a present profile object as visible", () => {
    expect(isProfileHidden({ id: "x" })).toBe(false);
  });
});
