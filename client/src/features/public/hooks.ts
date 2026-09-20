import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import type { BusinessInfo } from "@/config/business-defaults";
import { publicApi } from "./api";
import { parseBusinessInfo } from "./business";

/** Public catalogue data changes rarely; keep it fresh for a few minutes. */
const STALE_MS = 5 * 60_000;

export const publicKeys = {
  packages: ["public", "packages"] as const,
  package: (slug: string) => ["public", "packages", slug] as const,
  branches: ["public", "branches"] as const,
  settings: ["public", "settings"] as const,
  rtaServices: ["public", "rta-services"] as const,
  reviews: ["public", "reviews"] as const,
};

export const usePackages = () =>
  useQuery({
    queryKey: publicKeys.packages,
    queryFn: ({ signal }) => publicApi.packages(signal),
    staleTime: STALE_MS,
  });

export const usePackage = (slug: string) =>
  useQuery({
    queryKey: publicKeys.package(slug),
    queryFn: ({ signal }) => publicApi.package(slug, signal),
    staleTime: STALE_MS,
  });

export const useBranches = () =>
  useQuery({
    queryKey: publicKeys.branches,
    queryFn: ({ signal }) => publicApi.branches(signal),
    staleTime: STALE_MS,
  });

export const useRtaServices = () =>
  useQuery({
    queryKey: publicKeys.rtaServices,
    queryFn: ({ signal }) => publicApi.rtaServices(signal),
    staleTime: STALE_MS,
  });

export const useReviews = () =>
  useQuery({
    queryKey: publicKeys.reviews,
    queryFn: ({ signal }) => publicApi.reviews(signal),
    staleTime: STALE_MS,
  });

const usePublicSettings = () =>
  useQuery({
    queryKey: publicKeys.settings,
    queryFn: ({ signal }) => publicApi.settings(signal),
    staleTime: STALE_MS,
  });

/**
 * Business details (name, phones, address, …) from the owner-managed settings. Always returns usable
 * values: while loading, on failure, or for a missing key it falls back to the facts printed on the
 * business card (see config/business-defaults.ts), so click-to-call and WhatsApp never disappear.
 */
export function useBusinessInfo(): BusinessInfo {
  const { data } = usePublicSettings();
  return useMemo(() => parseBusinessInfo(data), [data]);
}

export const useCreateEnquiry = () => useMutation({ mutationFn: publicApi.createEnquiry });
