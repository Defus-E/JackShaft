import { Router as ExpressRouter } from 'express';
import IndexController from '../controllers/index.controller';
import ErrorController from '../controllers/error.controller';
import BackEndConroller from '../controllers/backend.controller';

/*
	Главный роутер, создающий ветки для других путей
	/ - клиентский контроллер(т.е. там, куда может зайти любой желающий)
	/backend/ - контроллер админки, который управляет всеми запросами для менеджмента сайта
	* - все остальные запросы, обрабатываются контроллером ошибок и, зачастую, расцениваются как ненайденные ресурсы, т.е. 404
*/
export default class Router {
	private static _router: ExpressRouter = ExpressRouter();

	public static get routes() {
		this._router.use('/', IndexController.routes);
		this._router.use('/backend/', BackEndConroller.routes);
		this._router.use('*', ErrorController.routes);

		return this._router;
	}
}