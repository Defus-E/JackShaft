import { Router as ExpressRouter, Request, Response, NextFunction } from 'express';
import { IRequest } from '../interfaces/IReqRes';
import { Admin } from '../models/admin';
import ModelError from '../error/model';
import HttpError from '../error';
import nconf from '../config';

import * as formidable from 'formidable';

export default class SettingsController {
	private static _router: ExpressRouter = ExpressRouter();

	public static routes(path: string = '/') {
    this._router.get(`${path}`, this.getSettingsPage);
    this._router.post(`${path}site`, this.SiteConfiguration);
    this._router.post(`${path}password`, this.PasswordConfiguration);
    this._router.post(`${path}pages`, this.PagesConfiguration);

		return this._router;
  }

  private static getSettingsPage(req: Request, res: Response, next: NextFunction) {
		res.render('admins/settings');
  }

  private static async SiteConfiguration(req: IRequest, res: Response, next: NextFunction) {
    const FORM: formidable = new formidable.IncomingForm();

    FORM.parse(req, (err: Error, fields: { sitename: string, keywords: string, email: string }, files: any) => {
      const { sitename, keywords, email } = fields;
    
      req.app.set('sitename', sitename);
      req.app.set('keywords', keywords);
      req.app.set('email', email);
      
      nconf.set('site:sitename', sitename);
      nconf.set('site:keywords', keywords);
      nconf.set('mailer:owner', email);
    
      nconf.save(() => res.send({}));
    });
  }

  private static async PasswordConfiguration(req: IRequest, res: Response, next: NextFunction) {
    const FORM: formidable = new formidable.IncomingForm();

    FORM.parse(req, async (err: Error, fields: { oldpassword: string, password: string, confirm: string }, files: any) => {
      try {
        const { oldpassword, password, confirm } = fields;
        await Admin.password(oldpassword, password, confirm);
        res.send({});
      } catch (err) {
        (err instanceof ModelError) ? next(new HttpError(403, err.message)) : next(err);
      }
    });
  }

  private static async PagesConfiguration(req: IRequest, res: Response, next: NextFunction) {
    const FORM: formidable = new formidable.IncomingForm();

    FORM.parse(req, (err: Error, fields: { pages: string[] }, files: any) => {
      const { pages } = fields;
      req.app.set('pages', pages);

      nconf.set('site:pages', pages);
      nconf.save(() => res.send({}));
    });
  }
}