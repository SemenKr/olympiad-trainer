"use client";

import { createContext, useContext } from "react";

export const LearnerViewReady = createContext(false);

export function useLearnerViewReady() {
  return useContext(LearnerViewReady);
}
