import { Request, Response, Express } from 'express';
import { IAdminDocument } from './IAdminDocument';

export interface Error { status?: number; }
export interface IResponse extends Response { sendHttpError(error: Error): void; }
export interface IRequest extends Request {
	session: Express.Session;
	admin?: IAdminDocument;
	_host?: string;
	sitename?: string;
	keywords?: string;
	email?: string;
	[key: string]: any;
}