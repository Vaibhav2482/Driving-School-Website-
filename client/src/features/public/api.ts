import { apiRequest } from "@/lib/apiClient";
import type {
  EnquiryPayload,
  PublicBranch,
  PublicPackage,
  PublicReview,
  PublicRtaService,
  PublicSettings,
} from "./types";

const get = async <T>(path: string, signal?: AbortSignal): Promise<T> =>
  (await apiRequest<T>(path, { signal })).data;

/** Typed calls to the public (unauthenticated) API. */
export const publicApi = {
  packages: (signal?: AbortSignal) => get<PublicPackage[]>("/public/packages", signal),
  package: (slug: string, signal?: AbortSignal) =>
    get<PublicPackage>(`/public/packages/${encodeURIComponent(slug)}`, signal),
  branches: (signal?: AbortSignal) => get<PublicBranch[]>("/public/branches", signal),
  settings: (signal?: AbortSignal) => get<PublicSettings>("/public/settings", signal),
  rtaServices: (signal?: AbortSignal) => get<PublicRtaService[]>("/public/rta-services", signal),
  reviews: (signal?: AbortSignal) => get<PublicReview[]>("/public/reviews", signal),
  createEnquiry: async (payload: EnquiryPayload): Promise<void> => {
    await apiRequest<{ received: true }>("/public/enquiries", { method: "POST", body: payload });
  },
};
