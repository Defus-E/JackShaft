import { Router as ExpressRouter, Request, Response, NextFunction } from 'express';
import * as formidable from 'formidable';
import * as nodemailer from 'nodemailer';
import HttpError from '../error';
import ModelError from '../error/model';
import nconf from '../config';
import { IRequest } from '../interfaces/IReqRes';

interface IFields {
  name: string;
  phone: string;
  email: string;
  you: string;
  theme: string;
  message: string;
}

interface IFiles {
  filename: string;
  path: string;
}

export default class MailConroller {
	private static _router: ExpressRouter = ExpressRouter();

	public static routes(path: string = '/') {
		this._router.post(`${path}`, this.handleRequest.bind(this));
		return this._router;
	}

	private static async handleRequest(req: IRequest, res: Response, next: NextFunction) {
    const FORM: formidable = new formidable.IncomingForm();
    const VALIDFIELDS: string[] = ['name', 'phone', 'email', 'you', 'theme', 'message'];
    const VALIDFILESTYPES: string[] = ['jpeg','jpg','png','webp','svg','html','pdf','gif','doc','docx','htm','sass','scss','pug','bmp','fb2','lit','txt','rtf','loc','mp3','avi','mpeg','mpeg-1','mpeg-2','mpeg-3','dv','dvd','cfg'];

    FORM.multiples = true;
    FORM.parse(req, async (err: Error, fields: any, files: any) => {
      try {
        for (let i: number =0; i < VALIDFIELDS.length; i++)
          if (!fields[VALIDFIELDS[i]] || fields[VALIDFIELDS[i]].trim == '')
            throw new ModelError('Не все поля формы были заполнены.', 403);

        for (let file in files)
          if (!VALIDFILESTYPES.includes(files[file].name.split('.').pop()))
            throw new ModelError('Формат файла ' + files[file].name + ' не поддерживается.', 415);
        
        await this.sendEmail(fields, files, req.app.settings.email);
        res.send({});
      } catch (err) {
        (err instanceof ModelError) ? next(new HttpError(err.status, err.message)) : next(err);
      }
    });
  }

  private static async sendEmail(fields: IFields, files: any, owner: string) {
    const ATTACHMENTS: IFiles[] = [];
    const { name, phone, email, you, theme, message } = fields;

    if (files && Object.keys(files).length !== 0) {
      for(const key in files) {
        const file = files[key];
        const PARAMS: IFiles = {
          filename: file.name,
          path: file.path
        };
  
        ATTACHMENTS.push(PARAMS);
      }	
    }

    const transporter = nodemailer.createTransport({
      host: nconf.get('mailer:host'),
      port: 465,
      secure: true,
      auth: { 
        user: nconf.get('mailer:login'), 
        pass: nconf.get('mailer:password') 
      }
    });
  
    const mailOptions = {
      from: nconf.get('mailer:login'),
      to: owner || nconf.get('mailer:owner'),
      subject: "Обратная связь: " + theme,
      text: message,
      html: `
        <pre>
          На Вашем сайте <a href="www.jackshaft.ru">www.jackshaft.ru</a> оставили сообщение:
          Имя: ${name}
          Компания: Jackshaft
          Тел.: ${phone}
          Эл.почта: ${email}
          Тема: ${theme}
          Текст сообщения: ${message}
        </pre>
      `,
      attachments: ATTACHMENTS
    };
  
    await transporter.sendMail(mailOptions);
  }
}