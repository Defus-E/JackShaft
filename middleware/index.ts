import { Request, Response, NextFunction } from 'express';
import { Error, IResponse, IRequest } from '../interfaces/IReqRes';
import { Admin } from '../models/admin';
import * as yametrika from 'yametrika';
import HttpError from '../error';
import nconf from '../config';

const COUNTER: any = yametrika.counter({ id: 56979991 });

export default class MiddleWare {
  // Проверка авторизации администратор
  public static ChecAuth(req: Request, res: Response, next: NextFunction) {
    (req.session.admin) ? next() : next(new HttpError(404, 'Страница не найдена'))
  }
  
  // Проверка входит ли страница в список отображаемых страниц
  public static CheckPage(req: Request, res: Response, next: NextFunction) {
    const PATTERN: RegExp = /^\/([^\/]*).*$/;
    const INDUSTRY: RegExp = /\/industry\/?/;
    const PAGES: string[] = req.app.settings.pages;
    const URL = req.originalUrl.replace(PATTERN, '/$1/');
    const PAGE: string = req.url === '/' ? '/main/' 
      : !INDUSTRY.test(URL) ? URL
      : URL + req.url.split('/')[1] + '/';
    
    (PAGES.includes(PAGE)) ? next() : next(new HttpError(404, 'Страница не найдена'));
  }

  // Загрузка администратора
  public static async LoadAdmin(req: IRequest, res: Response, next: NextFunction) {
    req.admin = res.locals.admin = null;
    if (!req.session.admin) 
      return next();
    
    let admin = await Admin.findById(req.session.admin).exec();
    req.admin = res.locals.admin = admin;

    next();
  }

  // Отправлка http ошибок клиенту
  public static async SendHttpError(req: Request, res: IResponse, next: NextFunction) {
    res.sendHttpError = (error: Error) => {
      res.status(error.status);
  
      let xhr: boolean = req.xhr;
      let accpt: string = req.headers.accept;
      
      if (!accpt || xhr || accpt.indexOf('json') > -1) {
        res.json(error);
      } else {
        res.render("error", { error: error });
      }
    };
  
    next();
  }

  // Установления конфига в глобальные переменные в целях избежания перезагрузки всего сервера
  public static SetConfig(req: IRequest, res: IResponse, next: NextFunction) {
    req._host = res.locals._host = null;
    req.sitename = res.locals.sitename = null;
    req.keywords = res.locals.keywords = null;
    req.email = res.locals.email = null;
    req.pages = res.locals.pages = null;
    
    req._host = res.locals._host = req.protocol + '://' + req.get('host');
    req.sitename = res.locals.sitename = req.app.settings.sitename || nconf.get('site:sitename');
    req.keywords = res.locals.keywords = req.app.settings.keywords || nconf.get('site:keywords');
    req.email = res.locals.email = req.app.settings.email || nconf.get('mailer:owner');
    req.pages = res.locals.pages = req.app.settings.pages || JSON.parse(nconf.get('mailer:pages'));

    next(); 
  }

  // ЯМетрика
  public static YaMetrika(req: Request, res: Response, next: NextFunction) {
    COUNTER.req(req);
    next();
  }
}