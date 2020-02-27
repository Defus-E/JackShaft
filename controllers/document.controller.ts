import { Router as ExpressRouter, Request, Response, NextFunction } from 'express';
import { IDocument, IDocRes, ICategoryDocument } from '../interfaces/IDocument';
import HttpError from '../error';
import ModelError from '../error/model';
import Document from '../models/document';

import * as formidable from 'formidable';
import * as path from 'path';

interface RUEN { 
  en: string, 
  ru: string 
}

export default class DocumentsController {
	private static _router: ExpressRouter = ExpressRouter();

	public static routes(path: string = '/') {
    this._router.get(`${path}:id?`, this.getDocumentPage);
    this._router.post(`${path}edit`, this.DocumentEdit.bind(this));
    this._router.post(`${path}category/edit`, this.DocumentCategoryEdit.bind(this));
    this._router.delete(`${path}category/delete`, this.DocumentCategoryDelete);
    this._router.delete(`${path}delete`, this.DocumentDelete);

		return this._router;
  }
  
  private static async getDocumentPage(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const RESPONSE: ICategoryDocument[] | IDocument[] = await Document.category(id);
      const PAGE: string = id ? 'admins/documents' : 'admins/doc-cat';

      res.render(PAGE, { documents: RESPONSE, id });
    } catch (err) {
      next(new HttpError(404, 'Страница не найдена'));
    }
  }

  private static async DocumentCategoryEdit(req: Request, res: Response, next: NextFunction) {
    (new formidable.IncomingForm())
      .parse(req, async (err: Error, { id, categorytitle }, files) =>
      res.send(await Document.catedit(id, JSON.parse(categorytitle))));
  }

  private static DocumentEdit(req: Request, res: Response, next: NextFunction) {
    const FORM: formidable = new formidable.IncomingForm();
    const VALIDEIMAGETYPES: string[] = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
    const SELF = this;
    let documentf: string, docname: string, image: string;
   
    FORM.multiples = true;
    FORM.parse(req, async (err: Error, fields: any, { document }) => {
      try {
        let title: RUEN = JSON.parse(fields.title);
        let temp: any = {
          id: fields.id,
          categoryid: fields.categoryid,
          title: {
            ru: title.ru,
            en: title.en
          },
          image: image ? '/img/docs/' + image : '',
          document: document ? {
            name: docname,
            path: '/img/docs/documents/' + documentf,
            size: parseFloat((document.size  / (1024 * 1024)).toFixed(2))
          } : {}
        }

        const RESP: IDocRes = await Document.docedit(temp, (!!image && !!documentf));
        res.send(RESP);
      } catch (err) {
        (err instanceof ModelError) ? next(new HttpError(404, err.message)) : next(err);
      }
    });

    FORM.on('fileBegin', async (name: string, file: any) => {
      let filename: string = SELF.generateUniqueFileName(file.name);

      if ((name === 'image' && !VALIDEIMAGETYPES.includes(file.type)) || !file) return;
      if (name === 'image') {
        image = filename;
        file.path = path.join(__dirname, '../public/img/docs/', filename);
      } else {
        docname = file.name;
        documentf = filename;
        file.path = path.join(__dirname, '../public/img/docs/documents', filename);
      }
    });
  }

  private static async DocumentDelete(req: Request, res: Response, next: NextFunction) {
    try {
      const ID: string = req.query.id;
      const CATEGORYID: string = req.query.categoryid;

      await Document.delete(ID, CATEGORYID);
      res.send({});
    } catch (err) {
      next(new HttpError(404, "Неверный индентификатор."));
    }
  }

  private static async DocumentCategoryDelete(req: Request, res: Response, next: NextFunction) {
    try {
      const ID: string = req.query.id;
      await Document.findByIdAndDelete(ID);
      res.send({});
    } catch (error) {
      next(new HttpError(404, "Неверный индентификатор."));
    }
  }

  private static generateUniqueFileName(name: string): string {
    return `${Math.floor(Math.random() * 1e8) + name[0]}.${name.match(/[^.]*$/g)[0]}`;
  }
}
