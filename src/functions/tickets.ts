import axios, { AxiosError } from 'axios';

/**
 * Fetch a sessions cookies current CSRF token.
 * @param {string} roblosecurityCookie
 * @returns {any}
 */
async function fetchSessionCSRFToken(roblosecurityCookie: string): Promise<string | null> {
	try {
		await axios.post("https://auth.roblox.com/v2/logout", {}, {
			headers: {
				'Cookie': `.ROBLOSECURITY=${roblosecurityCookie}`
			}
		});

		return null;
	} catch (error) {
		return (error as AxiosError).response?.headers["x-csrf-token"] || null;
	}
}


/**
 * Generate an auth ticket via a given session cookie.
 * @param {string} roblosecurityCookie
 * @returns {any}
 */
export async function generateAuthTicket(roblosecurityCookie: string): Promise<string> {
	try {
		const {headers} = await axios.post("https://auth.roblox.com/v1/authentication-ticket", {}, {
			headers: {
				"x-csrf-token": await fetchSessionCSRFToken(roblosecurityCookie),
				"referer": "https://www.roblox.com/camel",
				'Content-Type': 'application/json',
				'Cookie': `.ROBLOSECURITY=${roblosecurityCookie}`
			}
		});

		return headers['rbx-authentication-ticket'] || "Failed to fetch auth ticket.";
		
	} catch (error) {
		return "Failed to fetch auth ticket."
	}
}


/**
 * Redeem a given auth ticket and return the unpacked session data.
 * @param {string} authTicket
 * @returns {Promise<object>}
 */
export async function redeemAuthTicket(authTicket: string): Promise<object> {
	try {
		const {headers} = await axios.post("https://auth.roblox.com/v1/authentication-ticket/redeem", {
			"authenticationTicket": authTicket
		}, {
			headers: {
				'RBXAuthenticationNegotiation': '1'
			}
		});

		const refreshedCookieData: string = headers['set-cookie']?.toString() || "";

		return {
			success: true,
			refreshedCookie: refreshedCookieData.match(/(_\|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.\|_[A-Za-z0-9]+)/g)?.toString()
		};
	} catch (error) {
		return {success: false, robloxDebugResponse: (error as AxiosError).response?.data}
	}
}