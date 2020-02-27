import { Router as ExpressRouter, Request, Response, NextFunction } from 'express';
import { ICatalogueDocument, ICatalogueGrouped } from '../interfaces/ICatalogueDocument';
import { promisify } from 'util';
import { exists } from 'fs';
import * as path from 'path';
import HttpError from '../error';
import Middleware from '../middleware';
import ModelError from '../error/model';
import Catalogue from '../models/catalogue';
import { ISliderDocument } from '../interfaces/ISliderDocument';
import Slider from '../models/slider';

export default class IndustryConroller {
	private static _router: ExpressRouter = ExpressRouter();
	private static _exists: any = promisify(exists);
	private static _checkpage: (req: Request, res: Response, next: NextFunction) => void = Middleware.CheckPage;

	public static routes(path: string = '/:equipment') {
		this._router.get(`${path}/info`, this._checkpage, this.getIndustryInfoPage.bind(this));
		this._router.get(`${path}/catalogue/:id?`, this._checkpage, this.getIndustryCataloguePage.bind(this));

		return this._router;
	}

	private static async getIndustryInfoPage(req: Request, res: Response, next: NextFunction) {
		try {
			const EQUIPMENT: string = req.params.equipment;
			const NAME: string = 'info' + EQUIPMENT;
			const TEMP: string = await this.checkTemplate(NAME);
			const SLIDER: ISliderDocument = await Slider.get(+EQUIPMENT+1);

			if (!EQUIPMENT) return res.redirect('/industry/1/info');
			if (!TEMP) return next(new HttpError(404, 'Страница не найдена'));

			res.render(TEMP, SLIDER);
		} catch (err) {
			next(new HttpError(404, 'Страница не найдена'));
		}
	}

	private static async getIndustryCataloguePage(req: Request, res: Response, next: NextFunction) {
		try {
			const ID: string = req.params.id;
			const EQUIPMENT: number = +req.params.equipment;
			
			if (EQUIPMENT == 1) {
				const NAME: string = 'engine' + ID;
				const TEMP: string = await this.checkTemplate(NAME);

				if (TEMP) res.render(TEMP);
				else res.render('catalogue-item', { item: (await Catalogue.get(ID))[0] })
			} else if (EQUIPMENT == 2 && ID) {
				const NAME: string = 'stove' + ID;
				const TEMP: string = await this.checkTemplate(NAME);

				if (!TEMP) next(new HttpError(404, 'Страница не найдена'));
				else res.render(TEMP);
			} else {
				next(new HttpError(404, 'Страница не найдена'));
			}
		} catch (err) {
			if (err instanceof ModelError) {
        switch(err.status) {
          case 403:
            next(new HttpError(404, err.message));
            break;
          case 404:
						const ITEMS: ICatalogueDocument[] | ICatalogueGrouped = await Catalogue.get(null, true, true);
						res.render('catalogue', { items: ITEMS });
            break;
          default:
            next(err);
            break;
        }
      } else {
        next(new HttpError(404, 'Страница не найдена'));
      }
		}
	}

	private static async checkTemplate(name: string): Promise<string> {
		const PATH: string = path.join(__dirname, '../templates', name + '.pug');
		const EXISTS: boolean = await this._exists(PATH);
		
		if (!EXISTS)
			return null;
			
		return name;
	}
}