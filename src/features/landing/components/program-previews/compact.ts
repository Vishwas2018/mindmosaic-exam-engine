"use client";

import { createContext, useContext } from "react";

/**
 * True when the window is a phone-sized frame. The screens then recompose (one task, no side panels) at a
 * phone-width canvas instead of shrinking the desktop layout. The server and the first client render are
 * never compact; the window measures its frame before it shows anything but the skeleton.
 */
export const CompactContext = createContext(false);
export const useCompact = () => useContext(CompactContext);
