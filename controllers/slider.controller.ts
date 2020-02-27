import { Router as ExpressRouter, Request, Response, NextFunction } from 'express';
import { ISliderDocument, ISlide } from '../interfaces/ISliderDocument';
import HttpError from '../error';
import ModelError from '../error/model';
import Slider from '../models/slider';

import * as formidable from 'formidable';
import * as path from 'path';

export default class SliderController {
	private static _router: ExpressRouter = ExpressRouter();

	public static routes(path: string = '/') {
    this._router.get(`${path}:id?`, this.getSlidersEditPage);
    this._router.post(`${path}add`, this.SlidersAdd.bind(this));
    this._router.post(`${path}edit`, this.SlidersEdit.bind(this));
    this._router.delete(`${path}delete`, this.SlidersDelete);

		return this._router;
  }

  private static async getSlidersEditPage(req: Request, res: Response, next: NextFunction) {
    try {
      const ID: number = +req.params.id;
      const SLIDER: ISliderDocument = await Slider.get(ID);

      res.render('admins/sliders-edit', { slider: SLIDER });
    } catch (err) {
      (err instanceof ModelError) ? next(new HttpError(404, err.message)) : res.render('admins/sliders');
    }
  }

  private static SlidersAdd(req: Request, res: Response, next: NextFunction) {
    const FORM: formidable = new formidable.IncomingForm();
    const VALIDEIMAGETYPES: string[] = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
    const SELF = this;
    let image: string, filename: string;

    FORM.multiples = true;
    FORM.parse(req, async (err: Error, { index, title, link }, files: any) => {
      try {
        if (!image) throw new ModelError('Изображение запрашивается.', 404);
        const { slide, increment } = await Slider.add(index, { title, link, image });
        res.send({ slide, increment, index });
      } catch (err) {
        (err instanceof ModelError) ? next(new HttpError(err.status, err.message)) : next(err);
      }
    });

    FORM.on('fileBegin', function (name: string, file: any) {
      if (!VALIDEIMAGETYPES.includes(file.type)) return;

      filename = SELF.generateUniqueFileName(file.name);
      image = '/img/slides/' + filename;
      file.path = path.join(__dirname, '../public', image);
    });
  }

  private static SlidersEdit(req: Request, res: Response, next: NextFunction) {
    const FORM: formidable = new formidable.IncomingForm();
    const VALIDEIMAGETYPES: string[] = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
    const SELF = this;
    let filename: string, index: number;
    let datamin: ISlide[] = [];

    FORM.multiples = true;
    FORM.parse(req, async (err: Error, fields: any, files: any) => {
       let length: number = Object.keys(files).length;
       let temp: ISlide[] = JSON.parse(fields.data);

       if (length > 0 && temp.length != 0) {
         for (let z: number = 0; z < datamin.length; z++) {
           index = temp.findIndex(x => x._id == datamin[z]._id);
           temp[index].image = datamin[z].image;
         }
       }

       await Slider.edit(+fields.index, temp);
       res.send({});
    });

    FORM.on('fileBegin', (name: string, file: any) => {
      if (!VALIDEIMAGETYPES.includes(file.type)) return;

      filename = SELF.generateUniqueFileName(file.name);
      file.path = path.join(__dirname, '../public/img/slides/' + filename);
      datamin.push({ _id: name, image: '/img/slides/' + filename });
    });
  }

  private static async SlidersDelete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id, index } = req.query;
      await Slider.delete(id, +index);
      res.send({});
    } catch (err) {
      next(new HttpError(404, "Неверный индентификатор."));
    }
  }

  private static generateUniqueFileName(name: string): string {
    return `${Math.floor(Math.random() * 1e8) + name[0]}.${name.match(/[^.]*$/g)[0]}`;
  }
}
