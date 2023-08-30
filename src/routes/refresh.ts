import {Express, Request, Response} from 'express';
import { redeemAuthTicket, generateAuthTicket } from '../functions/tickets';

export default function refreshRoute(server: Express): void {

	server.post("/refresh/:cookie", async (req: Request, res: Response) => {
		res.send(await redeemAuthTicket(await generateAuthTicket(req.params.cookie)));
	})
}