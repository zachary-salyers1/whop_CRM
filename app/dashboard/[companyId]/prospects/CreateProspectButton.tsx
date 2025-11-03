"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CreateProspectButton({ companyId }: { companyId: string }) {
	const [showModal, setShowModal] = useState(false);
	const [loading, setLoading] = useState(false);
	const router = useRouter();

	const [formData, setFormData] = useState({
		name: "",
		email: "",
		communityName: "",
		communitySize: "",
		platform: "",
		niche: "",
		priority: "medium",
		whopDmUrl: "",
		discordHandle: "",
		twitterHandle: "",
		notes: "",
	});

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);

		try {
			const response = await fetch("/api/prospects", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					...formData,
					companyId,
					communitySize: formData.communitySize
						? parseInt(formData.communitySize)
						: null,
				}),
			});

			if (response.ok) {
				setShowModal(false);
				setFormData({
					name: "",
					email: "",
					communityName: "",
					communitySize: "",
					platform: "",
					niche: "",
					priority: "medium",
					whopDmUrl: "",
					discordHandle: "",
					twitterHandle: "",
					notes: "",
				});
				router.refresh();
			} else {
				alert("Failed to create prospect");
			}
		} catch (error) {
			console.error("Error creating prospect:", error);
			alert("Failed to create prospect");
		} finally {
			setLoading(false);
		}
	};

	return (
		<>
			<button
				onClick={() => setShowModal(true)}
				className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
			>
				+ Add Prospect
			</button>

			{showModal && (
				<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
					<div className="bg-zinc-800 border border-zinc-700 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
						<div className="p-6 border-b border-zinc-700">
							<h2 className="text-2xl font-bold text-white">
								Add New Prospect
							</h2>
						</div>

						<form onSubmit={handleSubmit} className="p-6 space-y-4">
							<div>
								<label className="block text-sm font-medium text-zinc-300 mb-2">
									Name *
								</label>
								<input
									type="text"
									required
									value={formData.name}
									onChange={(e) =>
										setFormData({ ...formData, name: e.target.value })
									}
									className="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
								/>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="block text-sm font-medium text-zinc-300 mb-2">
										Email
									</label>
									<input
										type="email"
										value={formData.email}
										onChange={(e) =>
											setFormData({ ...formData, email: e.target.value })
										}
										className="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-zinc-300 mb-2">
										Priority
									</label>
									<select
										value={formData.priority}
										onChange={(e) =>
											setFormData({ ...formData, priority: e.target.value })
										}
										className="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
									>
										<option value="low">Low</option>
										<option value="medium">Medium</option>
										<option value="high">High</option>
										<option value="urgent">Urgent</option>
									</select>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="block text-sm font-medium text-zinc-300 mb-2">
										Community Name
									</label>
									<input
										type="text"
										value={formData.communityName}
										onChange={(e) =>
											setFormData({
												...formData,
												communityName: e.target.value,
											})
										}
										className="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-zinc-300 mb-2">
										Community Size
									</label>
									<input
										type="number"
										value={formData.communitySize}
										onChange={(e) =>
											setFormData({
												...formData,
												communitySize: e.target.value,
											})
										}
										className="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
									/>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="block text-sm font-medium text-zinc-300 mb-2">
										Platform
									</label>
									<input
										type="text"
										placeholder="Discord, Telegram, etc."
										value={formData.platform}
										onChange={(e) =>
											setFormData({ ...formData, platform: e.target.value })
										}
										className="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-zinc-300 mb-2">
										Niche
									</label>
									<input
										type="text"
										placeholder="Gaming, Fitness, etc."
										value={formData.niche}
										onChange={(e) =>
											setFormData({ ...formData, niche: e.target.value })
										}
										className="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
									/>
								</div>
							</div>

							<div>
								<label className="block text-sm font-medium text-zinc-300 mb-2">
									Whop DM URL
								</label>
								<input
									type="url"
									value={formData.whopDmUrl}
									onChange={(e) =>
										setFormData({ ...formData, whopDmUrl: e.target.value })
									}
									className="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
								/>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="block text-sm font-medium text-zinc-300 mb-2">
										Discord Handle
									</label>
									<input
										type="text"
										value={formData.discordHandle}
										onChange={(e) =>
											setFormData({
												...formData,
												discordHandle: e.target.value,
											})
										}
										className="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-zinc-300 mb-2">
										Twitter Handle
									</label>
									<input
										type="text"
										value={formData.twitterHandle}
										onChange={(e) =>
											setFormData({
												...formData,
												twitterHandle: e.target.value,
											})
										}
										className="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
									/>
								</div>
							</div>

							<div>
								<label className="block text-sm font-medium text-zinc-300 mb-2">
									Notes
								</label>
								<textarea
									value={formData.notes}
									onChange={(e) =>
										setFormData({ ...formData, notes: e.target.value })
									}
									rows={3}
									className="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
								/>
							</div>

							<div className="flex gap-3 pt-4">
								<button
									type="submit"
									disabled={loading}
									className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
								>
									{loading ? "Creating..." : "Create Prospect"}
								</button>
								<button
									type="button"
									onClick={() => setShowModal(false)}
									className="px-4 py-2 bg-zinc-700 text-white rounded-lg hover:bg-zinc-600 transition-colors"
								>
									Cancel
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</>
	);
}
