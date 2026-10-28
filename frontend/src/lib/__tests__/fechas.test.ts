import { fechaLocalISO } from "@/lib/fechas";

describe("fechaLocalISO", () => {
  it("usa la fecha local, no la UTC", () => {
    // 00:30 hora local del 15 de marzo: en UTC+1/+2 sería todavía el 14.
    expect(fechaLocalISO(new Date(2026, 2, 15, 0, 30))).toBe("2026-03-15");
  });

  it("rellena mes y día con ceros", () => {
    expect(fechaLocalISO(new Date(2026, 0, 5, 12))).toBe("2026-01-05");
  });
});
