"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Prospect = {
	id: string;
	name: string;
	email: string | null;
	communityName: string | null;
	communitySize: number | null;
	status: string;
	priority: string;
	createdAt: Date;
	conversations: any[];
	followUpReminders: any[];
};

export function ProspectsList({
	companyId,
	initialProspects,
}: {
	companyId: string;
	initialProspects: Prospect[];
}) {
	const [prospects, setProspects] = useState(initialProspects);
	const [statusFilter, setStatusFilter] = useState("all");
	const [priorityFilter, setPriorityFilter] = useState("all");
	const [searchQuery, setSearchQuery] = useState("");
	const router = useRouter();

	// Filter prospects
	const filteredProspects = prospects.filter((prospect) => {
		const matchesStatus =
			statusFilter === "all" || prospect.status === statusFilter;
		const matchesPriority =
			priorityFilter === "all" || prospect.priority === priorityFilter;
		const matchesSearch =
			searchQuery === "" ||
			prospect.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			prospect.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
			prospect.communityName?.toLowerCase().includes(searchQuery.toLowerCase());

		return matchesStatus && matchesPriority && matchesSearch;
	});

	const getStatusColor = (status: string) => {
		const colors: Record<string, string> = {
			new: "bg-blue-500/10 text-blue-500",
			contacted: "bg-purple-500/10 text-purple-500",
			follow_up_needed: "bg-yellow-500/10 text-yellow-500",
			negotiating: "bg-orange-500/10 text-orange-500",
			converted: "bg-green-500/10 text-green-500",
			dead: "bg-red-500/10 text-red-500",
		};
		return colors[status] || "bg-zinc-500/10 text-zinc-500";
	};

	const getPriorityColor = (priority: string) => {
		const colors: Record<string, string> = {
			low: "text-zinc-500",
			medium: "text-blue-500",
			high: "text-orange-500",
			urgent: "text-red-500",
		};
		return colors[priority] || "text-zinc-500";
	};

	const formatDate = (date: Date) => {
		return new Date(date).toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
		});
	};

	return (
		<div className="bg-zinc-800 border border-zinc-700 rounded-lg overflow-hidden">
			{/* Header with filters */}
			<div className="p-6 border-b border-zinc-700">
				<h2 className="text-xl font-bold text-white mb-4">Prospects</h2>

				{/* Search */}
				<div className="mb-4">
					<input
						type="text"
						placeholder="Search by name, email, or community..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
				</div>

				{/* Filters */}
				<div className="flex gap-4">
					<select
						value={statusFilter}
						onChange={(e) => setStatusFilter(e.target.value)}
						className="px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
						<option value="all">All Statuses</option>
						<option value="new">New</option>
						<option value="contacted">Contacted</option>
						<option value="follow_up_needed">Follow-up Needed</option>
						<option value="negotiating">Negotiating</option>
						<option value="converted">Converted</option>
						<option value="dead">Dead</option>
					</select>

					<select
						value={priorityFilter}
						onChange={(e) => setPriorityFilter(e.target.value)}
						className="px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
						<option value="all">All Priorities</option>
						<option value="urgent">Urgent</option>
						<option value="high">High</option>
						<option value="medium">Medium</option>
						<option value="low">Low</option>
					</select>
				</div>
			</div>

			{/* Prospects List */}
			<div className="divide-y divide-zinc-700">
				{filteredProspects.length === 0 ? (
					<div className="p-8 text-center">
						<p className="text-zinc-400">No prospects found</p>
					</div>
				) : (
					filteredProspects.map((prospect) => (
						<Link
							key={prospect.id}
							href={`/dashboard/${companyId}/prospects/${prospect.id}`}
							className="block p-6 hover:bg-zinc-750 transition-colors"
						>
							<div className="flex items-start justify-between">
								<div className="flex-1">
									<div className="flex items-center gap-3 mb-2">
										<h3 className="text-lg font-semibold text-white">
											{prospect.name}
										</h3>
										<span
											className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
												prospect.status
											)}`}
										>
											{prospect.status.replace(/_/g, " ")}
										</span>
										<span className={getPriorityColor(prospect.priority)}>
											<svg
												className="w-4 h-4"
												fill="currentColor"
												viewBox="0 0 20 20"
											>
												<path
													fillRule="evenodd"
													d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
													clipRule="evenodd"
												/>
											</svg>
										</span>
									</div>

									{prospect.communityName && (
										<p className="text-zinc-300 mb-1">
											<span className="text-zinc-500">Community:</span>{" "}
											{prospect.communityName}
											{prospect.communitySize && (
												<span className="text-zinc-500">
													{" "}
													• {prospect.communitySize.toLocaleString()} members
												</span>
											)}
										</p>
									)}

									{prospect.email && (
										<p className="text-zinc-400 text-sm">{prospect.email}</p>
									)}

									<div className="flex items-center gap-4 mt-3 text-sm text-zinc-500">
										<span>Added {formatDate(prospect.createdAt)}</span>
										{prospect.conversations.length > 0 && (
											<span>
												{prospect.conversations.length} conversation
												{prospect.conversations.length !== 1 ? "s" : ""}
											</span>
										)}
										{prospect.followUpReminders.length > 0 && (
											<span className="text-yellow-500">
												⏰ {prospect.followUpReminders.length} reminder
												{prospect.followUpReminders.length !== 1 ? "s" : ""}
											</span>
										)}
									</div>
								</div>

								<div className="ml-4">
									<svg
										className="w-5 h-5 text-zinc-600"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M9 5l7 7-7 7"
										/>
									</svg>
								</div>
							</div>
						</Link>
					))
				)}
			</div>
		</div>
	);
}
