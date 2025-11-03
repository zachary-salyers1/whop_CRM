"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Reminder = {
	id: string;
	title: string;
	description: string | null;
	dueAt: Date;
	status: string;
	prospect: {
		id: string;
		name: string;
	};
};

export function RemindersPanel({
	companyId,
	initialReminders,
}: {
	companyId: string;
	initialReminders: Reminder[];
}) {
	const [reminders, setReminders] = useState(initialReminders);
	const router = useRouter();

	const formatDueDate = (date: Date) => {
		const now = new Date();
		const dueDate = new Date(date);
		const diffMs = dueDate.getTime() - now.getTime();
		const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
		const diffDays = Math.floor(diffHours / 24);

		if (diffDays < 0) {
			return { text: "Overdue", color: "text-red-500" };
		} else if (diffDays === 0) {
			if (diffHours <= 0) {
				return { text: "Due now", color: "text-red-500" };
			}
			return { text: `Due in ${diffHours}h`, color: "text-yellow-500" };
		} else if (diffDays === 1) {
			return { text: "Due tomorrow", color: "text-yellow-500" };
		} else {
			return {
				text: `Due in ${diffDays} days`,
				color: "text-zinc-400",
			};
		}
	};

	const completeReminder = async (reminderId: string) => {
		try {
			const response = await fetch(`/api/reminders/${reminderId}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					status: "completed",
					completedAt: new Date().toISOString(),
				}),
			});

			if (response.ok) {
				setReminders(reminders.filter((r) => r.id !== reminderId));
				router.refresh();
			}
		} catch (error) {
			console.error("Error completing reminder:", error);
		}
	};

	const dismissReminder = async (reminderId: string) => {
		try {
			const response = await fetch(`/api/reminders/${reminderId}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					status: "dismissed",
				}),
			});

			if (response.ok) {
				setReminders(reminders.filter((r) => r.id !== reminderId));
				router.refresh();
			}
		} catch (error) {
			console.error("Error dismissing reminder:", error);
		}
	};

	return (
		<div className="bg-zinc-800 border border-zinc-700 rounded-lg overflow-hidden">
			<div className="p-6 border-b border-zinc-700">
				<h2 className="text-xl font-bold text-white">Upcoming Reminders</h2>
			</div>

			<div className="divide-y divide-zinc-700">
				{reminders.length === 0 ? (
					<div className="p-6 text-center">
						<div className="w-12 h-12 bg-zinc-700 rounded-full flex items-center justify-center mx-auto mb-3">
							<svg
								className="w-6 h-6 text-zinc-500"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
								/>
							</svg>
						</div>
						<p className="text-zinc-400 text-sm">No upcoming reminders</p>
					</div>
				) : (
					reminders.map((reminder) => {
						const dueInfo = formatDueDate(reminder.dueAt);
						return (
							<div key={reminder.id} className="p-4">
								<div className="flex items-start justify-between mb-2">
									<div className="flex-1">
										<Link
											href={`/dashboard/${companyId}/prospects/${reminder.prospect.id}`}
											className="text-white font-medium hover:text-blue-400 transition-colors"
										>
											{reminder.title}
										</Link>
										<p className="text-sm text-zinc-400 mt-1">
											{reminder.prospect.name}
										</p>
										{reminder.description && (
											<p className="text-sm text-zinc-500 mt-1">
												{reminder.description}
											</p>
										)}
									</div>
								</div>

								<div className="flex items-center justify-between mt-3">
									<span className={`text-sm font-medium ${dueInfo.color}`}>
										{dueInfo.text}
									</span>

									<div className="flex gap-2">
										<button
											onClick={() => completeReminder(reminder.id)}
											className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors"
											title="Complete"
										>
											✓
										</button>
										<button
											onClick={() => dismissReminder(reminder.id)}
											className="px-3 py-1 bg-zinc-700 hover:bg-zinc-600 text-white text-xs rounded transition-colors"
											title="Dismiss"
										>
											✕
										</button>
									</div>
								</div>
							</div>
						);
					})
				)}
			</div>

			{reminders.length > 0 && (
				<div className="p-4 border-t border-zinc-700">
					<Link
						href={`/dashboard/${companyId}/reminders`}
						className="text-sm text-blue-400 hover:text-blue-300 font-medium"
					>
						View all reminders →
					</Link>
				</div>
			)}
		</div>
	);
}
