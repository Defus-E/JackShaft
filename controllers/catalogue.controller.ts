import { Router as ExpressRouter, Request, Response, NextFunction } from 'express';
import { ICatalogueDocument, ICatalogueGrouped, ITable } from '../interfaces/ICatalogueDocument';
import HttpError from '../error';
import ModelError from '../error/model';
import Catalogue from '../models/catalogue';

import * as formidable from 'formidable';
import * as path from 'path';

export default class CatalogueController {
	private static _router: ExpressRouter = ExpressRouter();

	public static routes(path: string = '/') {
    this._router.get(`${path}`, this.getCataloguePage);
    this._router.get(`${path}edit/:id?`, this.getCatalogueEditPage);
    this._router.post(`${path}edit`, this.CatalogueEdit.bind(this));
    this._router.delete(`${path}delete`, this.CatalogueDelete);
    
		return this._router;
  }
  
  private static async getCataloguePage(req: Request, res: Response, next: NextFunction) {
    try {
      const ITEMS: ICatalogueDocument[] | ICatalogueGrouped = await Catalogue.get(null, true);
		  res.render('admins/catalogue', { items: ITEMS });
    } catch (err) {
      (err instanceof ModelError) ? next(new HttpError(err.status, err.message)) : next(err);
    }
  }

  private static async getCatalogueEditPage(req: Request, res: Response, next: NextFunction) {
    try {
      const ID: string = req.params.id;
      const ITEM: ICatalogueDocument[] | ICatalogueGrouped = await Catalogue.get(ID, false);
      
      res.render('admins/catalogue-edit', { item: ITEM[0] ? ITEM[0] : {} });
    } catch (err) {
      if (err instanceof ModelError) {
        switch(err.status) {
          case 403:
            next(new HttpError(err.status, err.message));
            break;
          case 404:
            res.render('admins/catalogue-edit', { item: {} });
            break;
          default:
            next(err);
            break;
        }
      } else {
        next(err);
      }
    }
  }

  private static CatalogueEdit(req: Request, res: Response, next: NextFunction) {
    const FORM: formidable = new formidable.IncomingForm();
    const VALIDEIMAGETYPES: string[] = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
    const SELF = this;
    let image: string, filename: string;
    let tables: ITable[] = [];

    FORM.multiples = true;
    FORM.parse(req, async (err: Error, fields: any, files: any) => {
      try {
        const TABLES: ITable[] = await Catalogue.edit(fields, image, tables);
        res.send({ TABLES });
      } catch (err) {
        (err instanceof ModelError) ? next(new HttpError(err.status, err.message)) : next(err);
      }
    });

    FORM.on('file', (name: string, file: any) => {
      let indx: number = tables.findIndex((table: ITable) => table.name == file.name);
      (indx !== -1) ? tables[indx].size = parseFloat((file.size / (1024 * 1024)).toFixed(2)) : null;
    });

    FORM.on('fileBegin', function (name: string, file: any) {
      filename = SELF.generateUniqueFileName(file.name);

      if (!VALIDEIMAGETYPES.includes(file.type)) return;
      if (name == 'image') {
        image = '/img/catalogue/' + filename;
        file.path = path.join(__dirname, '../public/img/catalogue/' + filename);
      } else {
        let table: ITable = { name: file.name, path: '/img/catalogue/tables/' + filename }
        file.path = path.join(__dirname, '../public/img/catalogue/tables/' + filename);
        tables.push(table);
      }
    });
  }

  private static async CatalogueDelete(req: Request, res: Response, next: NextFunction) {
    try {
      const ID: string = req.query.id;
      await Catalogue.delete(ID);
      res.send({});
    } catch (err) {
      next(new HttpError(404, "Неверный индентификатор."));
    }
  }

  private static generateUniqueFileName(name: string): string {
    return `${Math.floor(Math.random() * 1e8) + name[0]}.${name.match(/[^.]*$/g)[0]}`;
  }
}