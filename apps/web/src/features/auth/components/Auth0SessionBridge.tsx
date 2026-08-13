"use client";

import { useAuth0Session } from "../hooks/useAuth0Session";

/** Hydrates Zustand from Auth0; render once under AppProviders. */
export function Auth0SessionBridge() {
  useAuth0Session();
  return null;
}
