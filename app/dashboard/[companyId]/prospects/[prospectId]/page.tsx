import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ProspectHeader } from "./ProspectHeader";
import { ConversationThread } from "./ConversationThread";
import { RemindersList } from "./RemindersList";
import { ProspectNotes } from "./ProspectNotes";

export default async function ProspectDetailPage({
	params,
}: {
	params: Promise<{ companyId: string; prospectId: string }>;
}) {
	const { companyId, prospectId } = await params;

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
					<Link href="/" className="text-blue-400 hover:text-blue-300">
						Go back home
					</Link>
				</div>
			</div>
		);
	}

	const prospect = await prisma.prospect.findUnique({
		where: { id: prospectId },
		include: {
			conversations: {
				include: {
					messages: {
						orderBy: { sentAt: "asc" },
					},
				},
				orderBy: { lastMessageAt: "desc" },
			},
			followUpReminders: {
				orderBy: { dueAt: "asc" },
			},
		},
	});

	if (!prospect) {
		return (
			<div className="min-h-screen bg-zinc-950 flex items-center justify-center">
				<div className="text-center">
					<h1 className="text-2xl font-bold text-white mb-4">
						Prospect not found
					</h1>
					<Link
						href={`/dashboard/${companyId}/prospects`}
						className="text-blue-400 hover:text-blue-300"
					>
						← Back to prospects
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-zinc-950">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Back Button */}
				<Link
					href={`/dashboard/${companyId}/prospects`}
					className="inline-flex items-center text-zinc-400 hover:text-white mb-6 transition-colors"
				>
					<svg
						className="w-5 h-5 mr-2"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M15 19l-7-7 7-7"
						/>
					</svg>
					Back to Prospects
				</Link>

				{/* Prospect Header */}
				<ProspectHeader prospect={prospect} companyId={company.id} />

				{/* Main Content Grid */}
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
					{/* Left Column - Conversation */}
					<div className="lg:col-span-2 space-y-6">
						<ConversationThread
							prospectId={prospectId}
							companyId={company.id}
							conversations={prospect.conversations}
						/>

						<ProspectNotes
							prospectId={prospectId}
							initialNotes={prospect.notes || ""}
						/>
					</div>

					{/* Right Column - Reminders & Info */}
					<div className="lg:col-span-1 space-y-6">
						<RemindersList
							prospectId={prospectId}
							companyId={company.id}
							reminders={prospect.followUpReminders}
						/>

						{/* Prospect Info Card */}
						<div className="bg-zinc-800 border border-zinc-700 rounded-lg p-6">
							<h3 className="text-lg font-bold text-white mb-4">
								Prospect Information
							</h3>

							<div className="space-y-3">
								{prospect.email && (
									<div>
										<p className="text-sm text-zinc-400">Email</p>
										<p className="text-white">{prospect.email}</p>
									</div>
								)}

								{prospect.communityName && (
									<div>
										<p className="text-sm text-zinc-400">Community</p>
										<p className="text-white">{prospect.communityName}</p>
										{prospect.communitySize && (
											<p className="text-sm text-zinc-500">
												{prospect.communitySize.toLocaleString()} members
											</p>
										)}
									</div>
								)}

								{prospect.platform && (
									<div>
										<p className="text-sm text-zinc-400">Platform</p>
										<p className="text-white">{prospect.platform}</p>
									</div>
								)}

								{prospect.niche && (
									<div>
										<p className="text-sm text-zinc-400">Niche</p>
										<p className="text-white">{prospect.niche}</p>
									</div>
								)}

								{prospect.whopDmUrl && (
									<div>
										<p className="text-sm text-zinc-400">Whop DM</p>
										<a
											href={prospect.whopDmUrl}
											target="_blank"
											rel="noopener noreferrer"
											className="text-blue-400 hover:text-blue-300 text-sm"
										>
											Open DM →
										</a>
									</div>
								)}

								{prospect.discordHandle && (
									<div>
										<p className="text-sm text-zinc-400">Discord</p>
										<p className="text-white">{prospect.discordHandle}</p>
									</div>
								)}

								{prospect.twitterHandle && (
									<div>
										<p className="text-sm text-zinc-400">Twitter</p>
										<p className="text-white">{prospect.twitterHandle}</p>
									</div>
								)}

								<div>
									<p className="text-sm text-zinc-400">Added</p>
									<p className="text-white">
										{new Date(prospect.createdAt).toLocaleDateString("en-US", {
											month: "long",
											day: "numeric",
											year: "numeric",
										})}
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
