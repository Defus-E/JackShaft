import { Router as ExpressRouter, Request, Response, NextFunction } from 'express';
import { Admin, IAdmin } from '../models/admin';
import { Urls } from '../constans/Urls';
import HttpError from '../error';
import ModelError from '../error/model';
import Middleware from '../middleware';

import CatalogueController from '../controllers/catalogue.controller';
import GalleryController from '../controllers/gallery.controller';
import SliderController from '../controllers/slider.controller';
import SettingsController from '../controllers/settings.controller';
import DocumentsController from '../controllers/document.controller';

/*
  Контроллер админки, который управляет запросами, начинающимися с:
  @ /home/ - домашней страницы
  @ /catalogue/ - выводом каталогов и товара
  @ /gallery/ - выводом альбомов и фото альбома
  @ /sliders/ - выводом слайдеров и слайдов слайдера
  @ /settings/ - настроек сайта и админа
  @ /docs/ - категорий документов и документов категории
  
  @ /login/ - Авторизация
  @ /logout/ - Выход из адмики
*/
export default class BackEndConroller {
  private static _router: ExpressRouter = ExpressRouter();
  private static _checkauth: (req: Request, res: Response, next: NextFunction) => void = Middleware.ChecAuth;

	public static get routes() {
    this._router.get(Urls.home, this._checkauth, this.getHomePage);
    this._router.use(Urls.catalogue, this._checkauth, CatalogueController.routes());
    this._router.use(Urls.gallery, this._checkauth, GalleryController.routes());
    this._router.use(Urls.sliders, this._checkauth, SliderController.routes());
    this._router.use(Urls.settings, this._checkauth, SettingsController.routes());
    this._router.use(Urls.docs, this._checkauth, DocumentsController.routes());
    
    this._router.post(Urls.login, this.authorizeAdmin);
    this._router.post(Urls.logout, this.logoutAdmin);

		return this._router;
	}

	private static getHomePage(req: Request, res: Response, next: NextFunction) {
		res.render('admins/main');
  }
  
  private static async authorizeAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const DATA: IAdmin = req.body;
      const ADMIN: IAdmin = await Admin.authorize(DATA);
    
      req.session.admin = ADMIN._id;
      res.send({});
    } catch (err) {
      (err instanceof ModelError) ? next(new HttpError(403, err.message)) : next(err);
    }
  }

  private static logoutAdmin(req: Request, res: Response, next: NextFunction) {
    req.session.admin = null;
    req.session.destroy(() => res.redirect('/'));
  }
}