"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Message = {
	id: string;
	content: string;
	sender: string;
	senderName: string | null;
	sentAt: Date;
};

type Conversation = {
	id: string;
	title: string;
	status: string;
	messages: Message[];
	lastMessageAt: Date | null;
};

export function ConversationThread({
	prospectId,
	companyId,
	conversations,
}: {
	prospectId: string;
	companyId: string;
	conversations: Conversation[];
}) {
	const [activeConversation, setActiveConversation] = useState<Conversation | null>(
		conversations[0] || null
	);
	const [showNewConversation, setShowNewConversation] = useState(false);
	const [newConversationTitle, setNewConversationTitle] = useState("");
	const [newMessage, setNewMessage] = useState("");
	const [messageSender, setMessageSender] = useState<"user" | "prospect">("user");
	const [loading, setLoading] = useState(false);
	const router = useRouter();

	const createConversation = async () => {
		if (!newConversationTitle.trim()) return;

		setLoading(true);
		try {
			const response = await fetch("/api/conversations", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					prospectId,
					companyId,
					title: newConversationTitle,
				}),
			});

			if (response.ok) {
				const conversation = await response.json();
				setActiveConversation(conversation);
				setShowNewConversation(false);
				setNewConversationTitle("");
				router.refresh();
			}
		} catch (error) {
			console.error("Error creating conversation:", error);
		} finally {
			setLoading(false);
		}
	};

	const addMessage = async () => {
		if (!activeConversation || !newMessage.trim()) return;

		setLoading(true);
		try {
			const response = await fetch(
				`/api/conversations/${activeConversation.id}/messages`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						content: newMessage,
						sender: messageSender,
						senderName: messageSender === "user" ? "You" : null,
					}),
				}
			);

			if (response.ok) {
				setNewMessage("");
				router.refresh();
			}
		} catch (error) {
			console.error("Error adding message:", error);
		} finally {
			setLoading(false);
		}
	};

	const formatMessageTime = (date: Date) => {
		return new Date(date).toLocaleString("en-US", {
			month: "short",
			day: "numeric",
			hour: "numeric",
			minute: "2-digit",
		});
	};

	return (
		<div className="bg-zinc-800 border border-zinc-700 rounded-lg overflow-hidden">
			{/* Header */}
			<div className="p-6 border-b border-zinc-700">
				<div className="flex items-center justify-between mb-4">
					<h2 className="text-xl font-bold text-white">Conversations</h2>
					<button
						onClick={() => setShowNewConversation(true)}
						className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
					>
						+ New Conversation
					</button>
				</div>

				{/* Conversation Tabs */}
				{conversations.length > 0 && (
					<div className="flex gap-2 overflow-x-auto">
						{conversations.map((conv) => (
							<button
								key={conv.id}
								onClick={() => setActiveConversation(conv)}
								className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
									activeConversation?.id === conv.id
										? "bg-blue-600 text-white"
										: "bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
								}`}
							>
								{conv.title}
							</button>
						))}
					</div>
				)}
			</div>

			{/* New Conversation Modal */}
			{showNewConversation && (
				<div className="p-6 border-b border-zinc-700 bg-zinc-750">
					<h3 className="text-white font-medium mb-3">
						Create New Conversation
					</h3>
					<div className="flex gap-3">
						<input
							type="text"
							placeholder="Conversation title..."
							value={newConversationTitle}
							onChange={(e) => setNewConversationTitle(e.target.value)}
							className="flex-1 px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
						<button
							onClick={createConversation}
							disabled={loading}
							className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
						>
							Create
						</button>
						<button
							onClick={() => setShowNewConversation(false)}
							className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors"
						>
							Cancel
						</button>
					</div>
				</div>
			)}

			{/* Messages */}
			{activeConversation ? (
				<>
					<div className="p-6 space-y-4 max-h-[500px] overflow-y-auto">
						{activeConversation.messages.length === 0 ? (
							<div className="text-center py-8">
								<p className="text-zinc-400">
									No messages yet. Start the conversation!
								</p>
							</div>
						) : (
							activeConversation.messages.map((message) => (
								<div
									key={message.id}
									className={`flex ${
										message.sender === "user"
											? "justify-end"
											: "justify-start"
									}`}
								>
									<div
										className={`max-w-[70%] rounded-lg p-4 ${
											message.sender === "user"
												? "bg-blue-600 text-white"
												: "bg-zinc-700 text-white"
										}`}
									>
										<div className="flex items-center justify-between mb-1">
											<span className="text-xs opacity-75">
												{message.sender === "user" ? "You" : "Prospect"}
											</span>
											<span className="text-xs opacity-75 ml-3">
												{formatMessageTime(message.sentAt)}
											</span>
										</div>
										<p className="whitespace-pre-wrap">{message.content}</p>
									</div>
								</div>
							))
						)}
					</div>

					{/* Message Input */}
					<div className="p-6 border-t border-zinc-700">
						<div className="flex gap-3 mb-3">
							<button
								onClick={() => setMessageSender("user")}
								className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
									messageSender === "user"
										? "bg-blue-600 text-white"
										: "bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
								}`}
							>
								From: You
							</button>
							<button
								onClick={() => setMessageSender("prospect")}
								className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
									messageSender === "prospect"
										? "bg-blue-600 text-white"
										: "bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
								}`}
							>
								From: Prospect
							</button>
						</div>
						<div className="flex gap-3">
							<textarea
								value={newMessage}
								onChange={(e) => setNewMessage(e.target.value)}
								placeholder="Type your message..."
								rows={3}
								className="flex-1 px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
							<button
								onClick={addMessage}
								disabled={loading || !newMessage.trim()}
								className="px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
							>
								Send
							</button>
						</div>
					</div>
				</>
			) : (
				<div className="p-8 text-center">
					<div className="w-16 h-16 bg-zinc-700 rounded-full flex items-center justify-center mx-auto mb-4">
						<svg
							className="w-8 h-8 text-zinc-500"
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
					<p className="text-zinc-400 mb-4">
						No conversations yet with this prospect
					</p>
					<button
						onClick={() => setShowNewConversation(true)}
						className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
					>
						Start a Conversation
					</button>
				</div>
			)}
		</div>
	);
}
