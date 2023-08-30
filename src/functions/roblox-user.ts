import axios from "axios";

type Item = {
	userAssetId: number;
	serialNumber: null;
	assetId: number;
	name: string;
	recentAveragePrice: number;
	originalPrice: number | null;
	assetStock: number | null;
	buildersClubMembershipType: number;
};

type Inventory = {
	previousPageCursor: string | null;
	nextPageCursor: string | null;
	data: Item[];
};

export default class RobloxUser {
	#roblosecurityCookie: string;
	#userId: number;
	#username: string;
	#displayName: string;

	private constructor(
		roblosecurityCookie: string,
		userId: number,
		username: string,
		displayName: string,
	) {
		this.#roblosecurityCookie = roblosecurityCookie;
		this.#userId = userId;
		this.#username = username;
		this.#displayName = displayName;

		return;
	}

	/**
	 * Does an authorized request.
	 * @param {
	 * 	{url: string, roblosecurityCookie: string}
	 * } options
	 * @param {string} roblosecurityCookie
	 * @returns {any}
	 */
	async doAuthorizedRequest<responseType>(url: string): Promise<responseType> {
		return (
			await axios.get(url, {
				headers: {
					Cookie: `.ROBLOSECURITY=${this.#roblosecurityCookie}`,
				},
			})
		).data;
	}

	/**
	 * Constructor function.
	 * @param {string} roblosecurityCookie
	 * @returns {Promise<RobloxUser>}
	 */
	static async register(roblosecurityCookie: string): Promise<RobloxUser> {
		const { data } = await axios.get("https://users.roblox.com/v1/users/authenticated", {
			headers: {
				Cookie: `.ROBLOSECURITY=${roblosecurityCookie}`,
			},
		});

		return new RobloxUser(roblosecurityCookie, data.id, data.name, data.displayName);
	}

	/**
	 * Get origin country of Roblox account.
	 * @returns {Promise<string>}
	 */
	private async getAccountCountry(): Promise<string> {
		const { countryName } = await this.doAuthorizedRequest<{ countryName: string }>(
			"https://www.roblox.com/account/settings/account-country",
		);

		return countryName;
	}

	/**
	 * Get Roblox account balance. (IN ROBUX)
	 * @returns {Promise<number>}
	 */
	private async getAccountBalance(): Promise<number> {
		const { robux } = await this.doAuthorizedRequest<{ robux: number }>(
			`https://economy.roblox.com/v1/users/${this.#userId}/currency`,
		);

		return robux;
	}

	/**
	 * Get Roblox account pin status (is enabled)
	 * @returns {Promise<string>}
	 */
	private async getAccountPinStatus(): Promise<boolean> {
		const { isEnabled } = await this.doAuthorizedRequest<{ isEnabled: boolean }>(
			`https://auth.roblox.com/v1/account/pin`,
		);

		return isEnabled;
	}

	/**
	 * Get Roblox account 2FA status (is enabled)
	 * @returns {Promise<string>}
	 */
	private async getAccount2FAStatus(): Promise<boolean> {
		const { twoStepVerificationEnabled } = await this.doAuthorizedRequest<{
			twoStepVerificationEnabled: boolean;
		}>(`https://twostepverification.roblox.com/v1/metadata`);

		return twoStepVerificationEnabled;
	}

	/**
	 * Get Roblox account Premium status (is premium)
	 * @returns {Promise<string>}
	 */
	private async getAccountPremiumStatus(): Promise<boolean> {
		try {
			await this.doAuthorizedRequest<{ twoStepVerificationEnabled: boolean }>(
				`https://premiumfeatures.roblox.com/v1/users/${this.#userId}/subscriptions`,
			);

			return true;
		} catch (error) {
			return false;
		}
	}

	/**
	 * Get Roblox account Premium status (is premium)
	 * @returns {Promise<string>}
	 */
	private async getAccountCreditBalance(): Promise<string> {
		const { balance } = await this.doAuthorizedRequest<{ balance: number }>(
			"https://billing.roblox.com/v1/credit",
		);

		const formatter = new Intl.NumberFormat("en-US", {
			style: "currency",
			currency: "USD",
		});

		return formatter.format(balance);
	}

	/**
	 * Get Roblox account Premium status (is premium)
	 * @returns {Promise<string>}
	 */
	private async getAccountBodyShot(): Promise<string> {
		const { data } = await this.doAuthorizedRequest<{ data: Array<{ imageUrl: string }> }>(
			`https://thumbnails.roblox.com/v1/users/avatar?userIds=${
				this.#userId
			}&size=720x720&format=Png&isCircular=false`,
		);

		return data[0].imageUrl;
	}

	/**
	 * Get Roblox account creation date.
	 * @returns {Promise<string>}
	 */
	private async getAccountCreationDate(): Promise<string> {
		const { created } = await this.doAuthorizedRequest<{ created: string }>(
			`https://users.roblox.com/v1/users/${this.#userId}`,
		);

		return new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeStyle: "long" }).format(
			new Date(created),
		);
	}

	private async getAccountRAP(userId: number | string): Promise<number> {
		let calculatedRap: number = 0;
		let nextPageCursor: string | null = "";

		while (nextPageCursor !== null) {
			const inventoryPage: Inventory = await this.doAuthorizedRequest<Inventory>(
				`https://inventory.roblox.com/v1/users/${userId}/assets/collectibles?sortOrder=Asc&limit=100&cursor=${nextPageCursor}`,
			);

			calculatedRap += inventoryPage.data.reduce(
				(rap: number, item: Item) => rap + item.recentAveragePrice,
				0,
			);
			nextPageCursor = inventoryPage.nextPageCursor;
		}

		return calculatedRap;
	}

	public async getUserData(): Promise<{
		username: string;
		uid: number;
		displayName: string;
		avatarUrl: string;
		createdAt: string;
		country: string;
		balance: number;
		isTwoStepVerificationEnabled: boolean;
		isPinEnabled: boolean;
		isPremium: boolean;
		creditbalance: string;
		rap: number;
	}> {
		return {
			username: this.#username,
			uid: this.#userId,
			displayName: this.#displayName,
			avatarUrl: await this.getAccountBodyShot(),
			createdAt: await this.getAccountCreationDate(),
			country: await this.getAccountCountry(),
			balance: await this.getAccountBalance(),
			isTwoStepVerificationEnabled: await this.getAccount2FAStatus(),
			isPinEnabled: await this.getAccountPinStatus(),
			isPremium: await this.getAccountPremiumStatus(),
			creditbalance: await this.getAccountCreditBalance(),
			rap: await this.getAccountRAP(this.#userId),
		};
	}
}
