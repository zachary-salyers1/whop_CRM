"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Prospect = {
	id: string;
	name: string;
	status: string;
	priority: string;
	email: string | null;
	communityName: string | null;
};

export function ProspectHeader({
	prospect,
	companyId,
}: {
	prospect: Prospect;
	companyId: string;
}) {
	const [status, setStatus] = useState(prospect.status);
	const [priority, setPriority] = useState(prospect.priority);
	const router = useRouter();

	const updateField = async (field: string, value: string) => {
		try {
			await fetch(`/api/prospects/${prospect.id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ [field]: value }),
			});
			router.refresh();
		} catch (error) {
			console.error(`Error updating ${field}:`, error);
		}
	};

	const getStatusColor = (status: string) => {
		const colors: Record<string, string> = {
			new: "bg-blue-500/10 text-blue-500 border-blue-500/20",
			contacted: "bg-purple-500/10 text-purple-500 border-purple-500/20",
			follow_up_needed:
				"bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
			negotiating: "bg-orange-500/10 text-orange-500 border-orange-500/20",
			converted: "bg-green-500/10 text-green-500 border-green-500/20",
			dead: "bg-red-500/10 text-red-500 border-red-500/20",
		};
		return colors[status] || "bg-zinc-500/10 text-zinc-500 border-zinc-500/20";
	};

	return (
		<div className="bg-zinc-800 border border-zinc-700 rounded-lg p-6">
			<div className="flex items-start justify-between">
				<div className="flex-1">
					<h1 className="text-3xl font-bold text-white mb-2">
						{prospect.name}
					</h1>
					{prospect.communityName && (
						<p className="text-xl text-zinc-300">{prospect.communityName}</p>
					)}
				</div>

				<div className="flex gap-3">
					<select
						value={priority}
						onChange={(e) => {
							setPriority(e.target.value);
							updateField("priority", e.target.value);
						}}
						className="px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
						<option value="low">Low Priority</option>
						<option value="medium">Medium Priority</option>
						<option value="high">High Priority</option>
						<option value="urgent">Urgent</option>
					</select>

					<select
						value={status}
						onChange={(e) => {
							setStatus(e.target.value);
							updateField("status", e.target.value);
						}}
						className={`px-4 py-2 border rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 ${getStatusColor(
							status
						)}`}
					>
						<option value="new">New</option>
						<option value="contacted">Contacted</option>
						<option value="follow_up_needed">Follow-up Needed</option>
						<option value="negotiating">Negotiating</option>
						<option value="converted">Converted</option>
						<option value="dead">Dead</option>
					</select>
				</div>
			</div>
		</div>
	);
}
