import { useSyncExternalStore } from "react";
import type { Id } from "~/convex/_generated/dataModel";

// Tiny module-level store for "the artifact just saved from the Add sheet".
// The Add sheet dismisses itself immediately on save, so the "Filed in ___"
// toast can't live there — a persistent root-level watcher reads this instead.

let lastSaved: Id<"artificats"> | null = null;
const listeners = new Set<() => void>();

function emit() {
	for (const l of listeners) l();
}

export function setLastSavedArtifact(id: Id<"artificats">) {
	lastSaved = id;
	emit();
}

export function clearLastSavedArtifact() {
	lastSaved = null;
	emit();
}

export function useLastSavedArtifact(): Id<"artificats"> | null {
	return useSyncExternalStore(
		(cb) => {
			listeners.add(cb);
			return () => listeners.delete(cb);
		},
		() => lastSaved,
	);
}
