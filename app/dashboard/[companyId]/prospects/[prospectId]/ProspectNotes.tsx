"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ProspectNotes({
	prospectId,
	initialNotes,
}: {
	prospectId: string;
	initialNotes: string;
}) {
	const [notes, setNotes] = useState(initialNotes);
	const [isEditing, setIsEditing] = useState(false);
	const [saving, setSaving] = useState(false);
	const router = useRouter();

	const saveNotes = async () => {
		setSaving(true);
		try {
			await fetch(`/api/prospects/${prospectId}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ notes }),
			});
			setIsEditing(false);
			router.refresh();
		} catch (error) {
			console.error("Error saving notes:", error);
		} finally {
			setSaving(false);
		}
	};

	return (
		<div className="bg-zinc-800 border border-zinc-700 rounded-lg p-6">
			<div className="flex items-center justify-between mb-4">
				<h3 className="text-lg font-bold text-white">Notes</h3>
				{!isEditing ? (
					<button
						onClick={() => setIsEditing(true)}
						className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors"
					>
						Edit
					</button>
				) : (
					<div className="flex gap-2">
						<button
							onClick={saveNotes}
							disabled={saving}
							className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium transition-colors disabled:opacity-50"
						>
							{saving ? "Saving..." : "Save"}
						</button>
						<button
							onClick={() => {
								setNotes(initialNotes);
								setIsEditing(false);
							}}
							className="px-3 py-1 bg-zinc-700 hover:bg-zinc-600 text-white rounded text-sm font-medium transition-colors"
						>
							Cancel
						</button>
					</div>
				)}
			</div>

			{isEditing ? (
				<textarea
					value={notes}
					onChange={(e) => setNotes(e.target.value)}
					rows={6}
					placeholder="Add notes about this prospect..."
					className="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			) : (
				<div className="text-zinc-300 whitespace-pre-wrap">
					{notes || (
						<p className="text-zinc-500 italic">
							No notes yet. Click Edit to add notes.
						</p>
					)}
				</div>
			)}
		</div>
	);
}
