import { describe, expect, it } from "vitest";
import { paginationQuerySchema } from "./common";

describe("paginationQuerySchema", () => {
  it("applies defaults when omitted", () => {
    const result = paginationQuerySchema.parse({});
    expect(result).toEqual({ page: 1, pageSize: 20 });
  });

  it("rejects a pageSize above the max", () => {
    expect(() => paginationQuerySchema.parse({ pageSize: 500 })).toThrow();
  });
});
