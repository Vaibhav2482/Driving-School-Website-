import type { Request, RequestHandler } from "express";
import { sendData } from "../../lib/response.js";
import { getValidated } from "../../middleware/validate.js";
import type { CatalogService } from "./catalog.service.js";
import type { EnquiryService } from "./enquiries.service.js";
import { slugParamsSchema, type createEnquirySchema } from "./public.schemas.js";

/** Thin HTTP adapters: read validated input, call a service, send the standard envelope. */
export function createPublicController(catalog: CatalogService, enquiries: EnquiryService) {
  const listPackages: RequestHandler = async (_req, res) => {
    sendData(res, await catalog.listPackages());
  };

  const getPackage: RequestHandler = async (req, res) => {
    const { params } = getValidated(req, { params: slugParamsSchema });
    sendData(res, await catalog.getPackage(params.slug));
  };

  const listBranches: RequestHandler = async (_req, res) => {
    sendData(res, await catalog.listBranches());
  };

  const getSettings: RequestHandler = async (_req, res) => {
    sendData(res, await catalog.getSettings());
  };

  const listRtaServices: RequestHandler = async (_req, res) => {
    sendData(res, await catalog.listRtaServices());
  };

  const listReviews: RequestHandler = async (_req, res) => {
    sendData(res, await catalog.listReviews());
  };

  const createEnquiry = (schema: ReturnType<typeof createEnquirySchema>): RequestHandler => {
    return async (req: Request, res) => {
      const { body } = getValidated(req, { body: schema });
      await enquiries.create(body);
      // Deliberately minimal: no ids, no echo of what was submitted.
      sendData(res, { received: true }, { status: 201 });
    };
  };

  return {
    listPackages,
    getPackage,
    listBranches,
    getSettings,
    listRtaServices,
    listReviews,
    createEnquiry,
  };
}
