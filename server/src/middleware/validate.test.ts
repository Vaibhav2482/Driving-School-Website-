import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { sendData } from "../lib/response.js";
import { silentLogger } from "../test/helpers.js";
import { errorHandler } from "./errorHandler.js";
import { getValidated, validate } from "./validate.js";

const schemas = {
  body: z.object({ name: z.string().trim().min(2), age: z.coerce.number().int().min(18) }),
  query: z.object({ page: z.coerce.number().int().min(1).default(1) }),
  params: z.object({ id: z.uuid() }),
};

function makeApp() {
  const app = express();
  app.use(express.json());
  app.post("/things/:id", validate(schemas), (req, res) => {
    sendData(res, getValidated(req, schemas));
  });
  app.use(errorHandler(silentLogger));
  return app;
}

const ID = "0199e6c0-0000-7000-8000-000000000000";

describe("validate middleware", () => {
  it("passes parsed, coerced and defaulted values to the handler", async () => {
    const res = await request(makeApp())
      .post(`/things/${ID}`)
      .send({ name: "  Asha  ", age: "21" });
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({
      body: { name: "Asha", age: 21 },
      query: { page: 1 },
      params: { id: ID },
    });
  });

  it("strips unknown body fields so clients cannot smuggle extra data", async () => {
    const res = await request(makeApp())
      .post(`/things/${ID}`)
      .send({ name: "Asha", age: 30, role: "OWNER" });
    expect(res.body.data.body).toEqual({ name: "Asha", age: 30 });
  });

  it("rejects invalid input with every problem listed under VALIDATION_ERROR", async () => {
    const res = await request(makeApp())
      .post("/things/not-a-uuid?page=0")
      .send({ name: "A", age: 10 });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    const paths = (res.body.error.details as { path: string }[]).map((d) => d.path).sort();
    expect(paths).toEqual(["body.age", "body.name", "params.id", "query.page"]);
  });
});
