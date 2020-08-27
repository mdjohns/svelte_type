import { writable } from "svelte/store";

export const isActive = writable(false);
export const isComplete = writable(false);