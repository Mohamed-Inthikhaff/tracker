"use client";

import { useAuth0Session } from "../hooks/useAuth0Session";

export function Auth0SessionBridge() {
  useAuth0Session();
  return null;
}
