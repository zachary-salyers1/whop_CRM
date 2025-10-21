import { whopSdk } from "@/lib/whop-sdk";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function ExperiencePage({
	params,
}: {
	params: Promise<{ experienceId: string }>;
}) {
	// The headers contains the user token
	const headersList = await headers();

	// The experienceId is a path param
	const { experienceId } = await params;

	// Check if we're in development mode without whop-proxy
	const isDevelopment = process.env.NODE_ENV === 'development';

	let userId: string;
	let result: any;
	let user: any;
	let experience: any;

	try {
		// Try to get the user token from headers (when whop-proxy is running)
		const tokenResult = await whopSdk.verifyUserToken(headersList);
		userId = tokenResult.userId;

		result = await whopSdk.access.checkIfUserHasAccessToExperience({
			userId,
			experienceId,
		});

		user = await whopSdk.users.getUser({ userId });
		experience = await whopSdk.experiences.getExperience({ experienceId });
	} catch (error) {
		if (isDevelopment) {
			// Development fallback when whop-proxy is not running
			console.log('Development mode: Using fallback data since whop-proxy is not running');
			userId = 'dev_user_123';
			result = {
				hasAccess: true,
				accessLevel: 'admin' as const
			};
			user = {
				name: 'Development User',
				username: 'dev_user'
			};
			experience = {
				name: `CRM Experience (${experienceId})`
			};
		} else {
			// In production, re-throw the error
			throw error;
		}
	}

	// Either: 'admin' | 'customer' | 'no_access';
	// 'admin' means the user is an admin of the whop, such as an owner or moderator
	// 'customer' means the user is a common member in this whop
	// 'no_access' means the user does not have access to the whop
	const { accessLevel } = result;

	// If user is admin, redirect to dashboard
	// For CRM apps, admins should see the dashboard, not the experience page
	if (accessLevel === 'admin') {
		// Extract company ID from the experience or use environment variable
		const companyId = process.env.NEXT_PUBLIC_WHOP_COMPANY_ID;
		if (companyId) {
			redirect(`/dashboard/${companyId}`);
		}
	}

	// For non-admin users (customers), show a message
	return (
		<div className="flex justify-center items-center h-screen px-8 bg-gray-50">
			<div className="text-center max-w-2xl">
				<h1 className="text-3xl font-bold text-gray-900 mb-4">
					Welcome to Whop CRM
				</h1>
				<p className="text-gray-600 mb-6">
					This is an admin-only application for managing member relationships.
				</p>
				{result.hasAccess ? (
					<div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
						<p className="text-sm text-blue-800">
							Hi <strong>{user.name}</strong> (@{user.username})! <br />
							You have <strong>{accessLevel}</strong> access to this experience.
						</p>
						{accessLevel === 'customer' && (
							<p className="text-sm text-blue-700 mt-4">
								Only administrators can access the CRM dashboard.
							</p>
						)}
					</div>
				) : (
					<div className="bg-red-50 border border-red-200 rounded-lg p-6">
						<p className="text-sm text-red-800">
							You do not have access to this experience.
						</p>
					</div>
				)}
			</div>
		</div>
	);
}
