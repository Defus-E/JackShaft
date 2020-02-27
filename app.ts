import * as express from 'express';
import { Request, NextFunction, Application } from 'express';
import * as path from 'path';
import * as morgan from 'morgan';
import * as helmet from 'helmet';
import * as http from 'http';
import * as mongoose from 'mongoose';
import * as statics from 'serve-static';
import * as cookieParser from 'cookie-parser';
import * as bodyParser from 'body-parser';
import * as session from 'express-session';
import * as errorHandler from 'express-error-handler';

import HttpError from './error';
import Router from './routes';
import nconf from './config';

import sessionStore from './libs/sessionStore';
import Middleware from './middleware';

const PORT: number = +process.env.PORT || +process.argv[2] || nconf.get('server:port');

export class App {
	private static _instance: App;
	private readonly _port: number;
	private _app: Application;
	private _db: any;
 
	private constructor(port: number = PORT) {
		this._app = express();
		this._port = port;

		this._app.set('pages', nconf.get('site:pages'));
		this._app.set('views', path.join(__dirname, 'templates'));
		this._app.set('view engine', 'pug');
		this._app.set('trust proxy', 1);
		console.log('[\x1b[32m OK \x1b[0m] Initializing application variables...');

		this._app.disable('x-powered-by');

		this.setHandlineMiddlewares();
		this.setCustomMiddlewares();
		this.setDataBase();

		this._app.use('/', Router.routes);
		this._app.use(this.errorHandler.bind(this));
		console.log('[\x1b[32m OK \x1b[0m] Routing mechanism');
	}

	public init(): void {
		const SERVER = http.createServer(this._app);
		SERVER.listen(this._port, () => console.log('[\x1b[32m OK \x1b[0m]\x1b[1m Server has been started\x1b[0m'))
		SERVER.on('error', console.error.bind(console, '[\x1b[31m OK \x1b[0m]\x1b[1m Server has been started\x1b[0m\n'));
	}

	public static get Instance(): App {
		return this._instance || (this._instance = new this());
	}

	private setHandlineMiddlewares(): void {
		let secure: boolean = this._app.get('env') !== 'development';

		this._app.use(helmet());
		this._app.use(statics(path.join(__dirname, 'public')));
		console.log('[\x1b[32m OK \x1b[0m] Setting helmet mechanism...');
		console.log('[\x1b[32m OK \x1b[0m] Checking for the static files...');

		this._app.use(morgan('combined'));
		this._app.use(bodyParser.urlencoded({ extended: true }));
		this._app.use(bodyParser.json());
		console.log('[\x1b[32m OK \x1b[0m] Initializing handline middlewares...');

		this._app.use(cookieParser(nconf.get('session:secret')));
		this._app.use(session({
			secret: nconf.get('session:secret'),
			name: nconf.get('session:name'),
			resave: true,
    	rolling: true,
    	saveUninitialized: false,
			store: sessionStore,
			cookie: {
				path: "/",
				httpOnly: true,
				secure: secure,
				maxAge: 86400000
			}
		}));
		console.log('[\x1b[32m OK \x1b[0m] Starting the session...');
	}

	private setCustomMiddlewares(): void {
		this._app.use(Middleware.SendHttpError);
		this._app.use(Middleware.LoadAdmin);
		this._app.use(Middleware.YaMetrika);
		this._app.use(Middleware.SetConfig);
		console.log('[\x1b[32m OK \x1b[0m] Initializing custom middlewares...');
	}

	private setDataBase(): void {
		mongoose.connect(nconf.get('mongoose:uri'), nconf.get('mongoose:options'));
		// mongoose.set('debug', true);

		this._db = mongoose.connection;
		this._db.on('connected', console.log.bind(console, '[\x1b[32m OK \x1b[0m] Connecting to the database...'));
		this._db.on('error', console.error.bind(console, '[\x1b[31m OK \x1b[0m] Connecting to the database...\n'));
	}

	private errorHandler(err: Error, req: Request, res: {[key: string]: any}, next: NextFunction): void {
		if (err instanceof HttpError) {
			res.sendHttpError(err);
		} else {
			console.error(err, 'ERROR');
			if (this._app.get('env') === 'development') {
				 errorHandler()(err, req, res, next);
			} else {
				err = new HttpError(500);
				res.sendHttpError(err);
			}
		}
	}
}

const app = App.Instance;
app.init();
