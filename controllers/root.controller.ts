import { Router as ExpressRouter, Request, Response, NextFunction } from 'express';
import { IGalleryDocument } from '../interfaces/IGalleryDocument';
import { ISliderDocument } from '../interfaces/ISliderDocument';
import Gallery from '../models/gallery';
import Slider from '../models/slider';
import Document from '../models/document';
import Middleware from '../middleware';
import HttpError from '../error';
import { IDocument, ICategoryDocument } from '../interfaces/IDocument';

// Контроллер, который выдает только странички клиенту
export default class RootConroller {
	private static _router: ExpressRouter = ExpressRouter();
	private static _checkpage: (req: Request, res: Response, next: NextFunction) => void = Middleware.CheckPage;

	public static routes(path: string = '/') {
		this._router.get(`${path}`, this._checkpage, this.getHomePage);
		this._router.get(`${path}contacts`, this._checkpage, this.getContactsPage);
		this._router.get(`${path}gallery/:id?`, this._checkpage, this.getGalleryPage);
		this._router.get(`${path}docs`, this._checkpage, this.getDocumentsPage);
		this._router.get(`${path}backend/login`, this.getLoginPage);
    this._router.get(`${path}policy`, this.getPolicyPage);
		
		return this._router;
	}

	private static async getHomePage(req: Request, res: Response, next: NextFunction) {
		const SLIDER: ISliderDocument = await Slider.get(1);
    res.render('home', SLIDER);
	}

	private static getContactsPage(req: Request, res: Response, next: NextFunction) {
		res.render('contacts');
	}

  private static getPolicyPage(req: Request, res: Response, next: NextFunction) {
    res.render('policy')
	}
	
	private static async getDocumentsPage(req: Request, res: Response, next: NextFunction) {
		const CATEGORIES: ICategoryDocument[] | IDocument[] = await Document.category();
    res.render('docs', { cats: CATEGORIES });
  }

	private static async getGalleryPage(req: Request, res: Response, next: NextFunction) {
		try {
      const ID: string = req.params.id;
      const ALBUMS: IGalleryDocument[] = await Gallery.get(ID);

      if (!ID) res.render('gallery', { albums: ALBUMS });
      else res.render('gallery-item', {
        title: ALBUMS[0].title, 
        photos: ALBUMS[0].photos
      });
    } catch (err) {
      next(new HttpError(404, 'Странциа не найдена'));
		}
	}

	private static getLoginPage(req: Request, res: Response, next: NextFunction) {
		res.render('admins/login');
	}
}
