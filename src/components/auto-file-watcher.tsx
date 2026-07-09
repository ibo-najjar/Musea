import { useMutation, useQuery } from "convex/react";
import { useEffect, useRef } from "react";
import { clearLastSavedArtifact, useLastSavedArtifact } from "@/lib/last-saved";
import { useAppToast } from "@/lib/toast";
import { api } from "~/convex/_generated/api";

// How long to keep watching a saved artifact before giving up (enrichment +
// filing usually resolves in a few seconds).
const WATCH_TIMEOUT_MS = 3 * 60 * 1000;

// Mounted once inside the authenticated layout. When the Add sheet saves an
// artifact it stashes the id; this watcher subscribes to that artifact's gallery
// memberships and, the moment it lands in a real gallery, shows a
// "Filed in ___ · Undo" toast — then stops watching.
export function AutoFileWatcher() {
	const artificatId = useLastSavedArtifact();
	const toast = useAppToast();
	const undoAutoFile = useMutation(api.organize.undoAutoFile);
	const firedRef = useRef(false);

	const galleries = useQuery(
		api.galleryArtifacts.listGalleriesForArtifact,
		artificatId ? { artificatId } : "skip",
	);

	// Reset the "already toasted" guard whenever we start watching a new artifact,
	// and auto-clear after a timeout so a never-filed item doesn't watch forever.
	useEffect(() => {
		firedRef.current = false;
		if (!artificatId) return;
		const timer = setTimeout(clearLastSavedArtifact, WATCH_TIMEOUT_MS);
		return () => clearTimeout(timer);
	}, [artificatId]);

	useEffect(() => {
		if (!artificatId || firedRef.current || !galleries) return;

		// Baseline is the empty set (the artifact is brand-new), so the first
		// gallery to appear is the auto-file.
		const filed = galleries[0];
		if (!filed) return;

		firedRef.current = true;
		const galleryId = filed._id;
		toast.action(`Filed in ${filed.title}`, "Undo", () => {
			undoAutoFile({ artificatId, galleryId });
		});
		clearLastSavedArtifact();
	}, [artificatId, galleries, toast, undoAutoFile]);

	return null;
}
