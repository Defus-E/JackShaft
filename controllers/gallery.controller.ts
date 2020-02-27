import { Router as ExpressRouter, Request, Response, NextFunction } from 'express';
import { IGalleryDocument, IPhoto } from '../interfaces/IGalleryDocument';
import HttpError from '../error';
import ModelError from '../error/model';
import Gallery from '../models/gallery';

import * as formidable from 'formidable';
import * as path from 'path';

interface RUEN { 
  en: string, 
  ru: string 
}

export default class GalleryController {
	private static _router: ExpressRouter = ExpressRouter();

	public static routes(path: string = '/') {
    this._router.get(`${path}:id?`, this.getGaleryPage);
    this._router.post(`${path}edit-album`, this.GalleryEditAlbum.bind(this));
    this._router.post(`${path}edit-photo`, this.GalleryEditPhoto.bind(this));
    this._router.delete(`${path}delete-album`, this.GalleryDeleteAlbum);
    this._router.delete(`${path}delete-photo`, this.GalleryDeletePhoto);

		return this._router;
  }
  
  private static async getGaleryPage(req: Request, res: Response, next: NextFunction) {
    try {
      const ID: string = req.params.id;
      const ITEMS: IGalleryDocument[] = await Gallery.get(ID);

      if (!ID) res.render('admins/gallery', { albums: ITEMS });
      else res.render('admins/gallery-edit', {
        id: ITEMS[0]._id, 
        title: ITEMS[0].title, 
        photos: ITEMS[0].photos
      });
    } catch (err) {
      next(new HttpError(404, 'Странциа не найдена'));
    }
  }

  private static GalleryEditAlbum(req: Request, res: Response, next: NextFunction) {
    const FORM: formidable = new formidable.IncomingForm();
    const VALIDEIMAGETYPES: string[] = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
    const SELF = this;
    let filename: string;

    FORM.parse(req, async (err: Error, fields: any, files: any) => {
      try {
        let title: RUEN = JSON.parse(fields.title);
        let temp: any = {
          id: fields.id,
          title: {
            ru: title.ru,
            en: title.en
          },
          image: '/img/albums/' + filename,
          photos: fields.id ? null : []
        }

        const RESP: { album: IGalleryDocument, new: boolean } = await Gallery.edit(temp, !!filename);
        res.send(RESP);
      } catch (err) {
        (err instanceof ModelError) ? next(new HttpError(404, err.message)) : next(err);
      }
    });

    FORM.on('fileBegin', async (name: string, file: any) => {
      if (!VALIDEIMAGETYPES.includes(file.type)) return;

      filename = SELF.generateUniqueFileName(file.name);
      file.path = path.join(__dirname, '../public/img/albums/' + filename);
    });
  }

  private static GalleryEditPhoto(req: Request, res: Response, next: NextFunction) {
    const FORM: formidable = new formidable.IncomingForm();
    const VALIDEIMAGETYPES: string[] = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
    const SELF = this;
    let filename: string;

    FORM.parse(req, async (err: Error, fields: any, files: any) => {
      try {
        let title: RUEN = JSON.parse(fields.description);
        let temp: IPhoto = {
          _id: fields.id,
          description: {
            ru: title.ru,
            en: title.en
          },
          photo: '/img/albums/photos/' + filename
        }
        
        const RESP: { id: string, photo: IPhoto, new: boolean } = await Gallery.photo(fields._id, temp, !!filename);
        res.send(RESP);
      } catch (err) {
        (err instanceof ModelError) ? next(new HttpError(404, err.message)) : next(err);
      }
    });

    FORM.on('fileBegin', async (name: string, file: any) => {
      if (!VALIDEIMAGETYPES.includes(file.type)) return;

      filename = SELF.generateUniqueFileName(file.name);
      file.path = path.join(__dirname, '../public/img/albums/photos/' + filename);
    });
  }

  private static async GalleryDeleteAlbum(req: Request, res: Response, next: NextFunction) {
    try {
      const ID: string = req.query.id;
      await Gallery.delete(ID);
      res.send({});
    } catch (err) {
      next(new HttpError(404, "Неверный индентификатор."));
    }
  }

  private static async GalleryDeletePhoto(req: Request, res: Response, next: NextFunction) {
    try {
      const ID: string = req.query.id;
      const PHOTOID: string = req.query.index;
      await Gallery.delete(ID, PHOTOID);
      res.send({});
    } catch (err) {
      next(new HttpError(404, "Неверный индентификатор."));
    }
  }

  private static generateUniqueFileName(name: string): string {
    return `${Math.floor(Math.random() * 1e8) + name[0]}.${name.match(/[^.]*$/g)[0]}`;
  }
}