"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Reminder = {
	id: string;
	title: string;
	description: string | null;
	dueAt: Date;
	status: string;
};

export function RemindersList({
	prospectId,
	companyId,
	reminders,
}: {
	prospectId: string;
	companyId: string;
	reminders: Reminder[];
}) {
	const [showNewReminder, setShowNewReminder] = useState(false);
	const [formData, setFormData] = useState({
		title: "",
		description: "",
		dueAt: "",
	});
	const [loading, setLoading] = useState(false);
	const router = useRouter();

	const createReminder = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!formData.title || !formData.dueAt) return;

		setLoading(true);
		try {
			const response = await fetch("/api/reminders", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					prospectId,
					companyId,
					title: formData.title,
					description: formData.description || null,
					dueAt: new Date(formData.dueAt).toISOString(),
				}),
			});

			if (response.ok) {
				setShowNewReminder(false);
				setFormData({ title: "", description: "", dueAt: "" });
				router.refresh();
			}
		} catch (error) {
			console.error("Error creating reminder:", error);
		} finally {
			setLoading(false);
		}
	};

	const completeReminder = async (reminderId: string) => {
		try {
			await fetch(`/api/reminders/${reminderId}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					status: "completed",
					completedAt: new Date().toISOString(),
				}),
			});
			router.refresh();
		} catch (error) {
			console.error("Error completing reminder:", error);
		}
	};

	const deleteReminder = async (reminderId: string) => {
		if (!confirm("Are you sure you want to delete this reminder?")) return;

		try {
			await fetch(`/api/reminders/${reminderId}`, {
				method: "DELETE",
			});
			router.refresh();
		} catch (error) {
			console.error("Error deleting reminder:", error);
		}
	};

	const formatDueDate = (date: Date) => {
		const now = new Date();
		const dueDate = new Date(date);
		const diffMs = dueDate.getTime() - now.getTime();
		const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

		if (diffDays < 0) {
			return { text: "Overdue", color: "text-red-500" };
		} else if (diffDays === 0) {
			return { text: "Due today", color: "text-yellow-500" };
		} else if (diffDays === 1) {
			return { text: "Due tomorrow", color: "text-yellow-500" };
		} else {
			return {
				text: `Due in ${diffDays} days`,
				color: "text-zinc-400",
			};
		}
	};

	const pendingReminders = reminders.filter((r) => r.status === "pending");
	const completedReminders = reminders.filter((r) => r.status === "completed");

	return (
		<div className="bg-zinc-800 border border-zinc-700 rounded-lg overflow-hidden">
			<div className="p-6 border-b border-zinc-700">
				<div className="flex items-center justify-between">
					<h3 className="text-lg font-bold text-white">Reminders</h3>
					<button
						onClick={() => setShowNewReminder(!showNewReminder)}
						className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors"
					>
						+ Add
					</button>
				</div>
			</div>

			{showNewReminder && (
				<form onSubmit={createReminder} className="p-6 border-b border-zinc-700 bg-zinc-750 space-y-3">
					<div>
						<input
							type="text"
							placeholder="Reminder title..."
							required
							value={formData.title}
							onChange={(e) =>
								setFormData({ ...formData, title: e.target.value })
							}
							className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>
					<div>
						<textarea
							placeholder="Description (optional)..."
							value={formData.description}
							onChange={(e) =>
								setFormData({ ...formData, description: e.target.value })
							}
							rows={2}
							className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>
					<div>
						<input
							type="datetime-local"
							required
							value={formData.dueAt}
							onChange={(e) =>
								setFormData({ ...formData, dueAt: e.target.value })
							}
							className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>
					<div className="flex gap-2">
						<button
							type="submit"
							disabled={loading}
							className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors disabled:opacity-50"
						>
							Create
						</button>
						<button
							type="button"
							onClick={() => setShowNewReminder(false)}
							className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded transition-colors"
						>
							Cancel
						</button>
					</div>
				</form>
			)}

			<div className="divide-y divide-zinc-700">
				{pendingReminders.length === 0 && completedReminders.length === 0 ? (
					<div className="p-6 text-center">
						<p className="text-zinc-400 text-sm">No reminders set</p>
					</div>
				) : (
					<>
						{pendingReminders.map((reminder) => {
							const dueInfo = formatDueDate(reminder.dueAt);
							return (
								<div key={reminder.id} className="p-4">
									<div className="flex items-start justify-between mb-2">
										<div className="flex-1">
											<h4 className="text-white font-medium">
												{reminder.title}
											</h4>
											{reminder.description && (
												<p className="text-sm text-zinc-400 mt-1">
													{reminder.description}
												</p>
											)}
										</div>
									</div>
									<div className="flex items-center justify-between mt-2">
										<span className={`text-sm font-medium ${dueInfo.color}`}>
											{dueInfo.text}
										</span>
										<div className="flex gap-2">
											<button
												onClick={() => completeReminder(reminder.id)}
												className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors"
											>
												✓
											</button>
											<button
												onClick={() => deleteReminder(reminder.id)}
												className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
											>
												✕
											</button>
										</div>
									</div>
								</div>
							);
						})}

						{completedReminders.length > 0 && (
							<div className="p-4 bg-zinc-750">
								<p className="text-xs text-zinc-500 mb-2">
									Completed ({completedReminders.length})
								</p>
								{completedReminders.map((reminder) => (
									<div
										key={reminder.id}
										className="text-sm text-zinc-500 line-through py-1"
									>
										{reminder.title}
									</div>
								))}
							</div>
						)}
					</>
				)}
			</div>
		</div>
	);
}
