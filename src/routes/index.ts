import express, { Express } from "express";
import path from "path";
import cookieInfoRoute from "./cookie-info";
import refreshRoute from "./refresh";

export default (): Express => {
	const app: Express = express();
	const port = process.env.PORT;

	app.use("/", express.static(path.join(__dirname, "../web")));

	refreshRoute(app);
	cookieInfoRoute(app);

	return app;
};
