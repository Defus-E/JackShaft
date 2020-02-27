import { Router as ExpressRouter } from 'express';
import RootController from './root.controller';
import IndustryController from './industry.controller';
import MailController from './mail.controller';
import { Urls } from '../constans/Urls';

/* 
	Контроль запросов, начинающиеся с:
	/, /industry/, /email/
*/
export default class IndexController {
	private static _router: ExpressRouter = ExpressRouter();

	public static get routes() {
		this._router.use(Urls.main, RootController.routes());		
		this._router.use(Urls.industry, IndustryController.routes());
		this._router.use(Urls.email, MailController.routes());

		return this._router;
	}
}