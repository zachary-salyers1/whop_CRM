import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ProspectsList } from "./ProspectsList";
import { CreateProspectButton } from "./CreateProspectButton";
import { RemindersPanel } from "./RemindersPanel";

export default async function ProspectsPage({
	params,
}: {
	params: Promise<{ companyId: string }>;
}) {
	const { companyId } = await params;

	const company = await prisma.company.findUnique({
		where: { whopCompanyId: companyId },
	});

	if (!company) {
		return (
			<div className="min-h-screen bg-zinc-950 flex items-center justify-center">
				<div className="text-center">
					<h1 className="text-2xl font-bold text-white mb-4">
						Company not found
					</h1>
					<Link
						href="/"
						className="text-blue-400 hover:text-blue-300"
					>
						Go back home
					</Link>
				</div>
			</div>
		);
	}

	// Fetch prospects stats
	const totalProspects = await prisma.prospect.count({
		where: { companyId: company.id },
	});

	const newProspects = await prisma.prospect.count({
		where: {
			companyId: company.id,
			status: "new",
		},
	});

	const contactedProspects = await prisma.prospect.count({
		where: {
			companyId: company.id,
			status: { in: ["contacted", "follow_up_needed", "negotiating"] },
		},
	});

	const convertedProspects = await prisma.prospect.count({
		where: {
			companyId: company.id,
			status: "converted",
		},
	});

	// Fetch upcoming reminders
	const now = new Date();
	const nextWeek = new Date();
	nextWeek.setDate(nextWeek.getDate() + 7);

	const upcomingReminders = await prisma.followUpReminder.findMany({
		where: {
			companyId: company.id,
			status: "pending",
			dueAt: {
				gte: now,
				lte: nextWeek,
			},
		},
		include: {
			prospect: true,
		},
		orderBy: {
			dueAt: "asc",
		},
		take: 5,
	});

	// Fetch all prospects for the list
	const prospects = await prisma.prospect.findMany({
		where: { companyId: company.id },
		include: {
			conversations: {
				orderBy: { lastMessageAt: "desc" },
				take: 1,
			},
			followUpReminders: {
				where: { status: "pending" },
				orderBy: { dueAt: "asc" },
				take: 1,
			},
		},
		orderBy: { createdAt: "desc" },
	});

	return (
		<div className="min-h-screen bg-zinc-950">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Header */}
				<div className="mb-8 flex items-center justify-between">
					<div>
						<h1 className="text-3xl font-bold text-white mb-2">
							Conversation Tracking
						</h1>
						<p className="text-zinc-400">
							Track and manage conversations with potential community owners
						</p>
					</div>
					<div className="flex gap-3">
						<Link
							href={`/dashboard/${companyId}`}
							className="px-4 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors border border-zinc-700"
						>
							← Back to Dashboard
						</Link>
						<CreateProspectButton companyId={company.id} />
					</div>
				</div>

				{/* Stats Cards */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
					<div className="bg-zinc-800 border border-zinc-700 rounded-lg p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-zinc-400 text-sm font-medium">
									Total Prospects
								</p>
								<p className="text-3xl font-bold text-white mt-2">
									{totalProspects}
								</p>
							</div>
							<div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
								<svg
									className="w-6 h-6 text-blue-500"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
									/>
								</svg>
							</div>
						</div>
					</div>

					<div className="bg-zinc-800 border border-zinc-700 rounded-lg p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-zinc-400 text-sm font-medium">
									New Prospects
								</p>
								<p className="text-3xl font-bold text-white mt-2">
									{newProspects}
								</p>
							</div>
							<div className="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center">
								<svg
									className="w-6 h-6 text-yellow-500"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M12 4v16m8-8H4"
									/>
								</svg>
							</div>
						</div>
					</div>

					<div className="bg-zinc-800 border border-zinc-700 rounded-lg p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-zinc-400 text-sm font-medium">
									In Progress
								</p>
								<p className="text-3xl font-bold text-white mt-2">
									{contactedProspects}
								</p>
							</div>
							<div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center">
								<svg
									className="w-6 h-6 text-purple-500"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
									/>
								</svg>
							</div>
						</div>
					</div>

					<div className="bg-zinc-800 border border-zinc-700 rounded-lg p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-zinc-400 text-sm font-medium">
									Converted
								</p>
								<p className="text-3xl font-bold text-white mt-2">
									{convertedProspects}
								</p>
							</div>
							<div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
								<svg
									className="w-6 h-6 text-green-500"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg>
							</div>
						</div>
					</div>
				</div>

				{/* Main Content Grid */}
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					{/* Prospects List */}
					<div className="lg:col-span-2">
						<ProspectsList
							companyId={company.id}
							initialProspects={prospects}
						/>
					</div>

					{/* Reminders Sidebar */}
					<div className="lg:col-span-1">
						<RemindersPanel
							companyId={company.id}
							initialReminders={upcomingReminders}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
