import * as crypto from 'crypto';
import { Schema, Model, model } from 'mongoose';
import { IAdminDocument } from '../interfaces/IAdminDocument';
import ModelError from '../error/model';

export interface IAdmin extends IAdminDocument {
	encryptPassword(password: string): string;
	checkPassword(password: string): boolean;
	confirmPassword(password: string, confirm: string): boolean;
}

export interface IAdminModel extends Model<IAdmin> {
	authorize(data: IAdmin): IAdmin;
	password(oldpassword: string, password: string, confirm: string): void;
}

const schema: Schema = new Schema({
  login: {
    type: String,
    unique: true,
    required: true
  },
  hashedPassword: {
    type: String,
    required: true
  },
  salt: {
    type: String,
    required: true
	}
});

// Методы схемы: широфвание пароля, проверка, конфирмация
schema.method('encryptPassword', function (password: string): string {
	return crypto.createHmac('sha256', this.salt).update(password).digest('hex');
});

schema.method('checkPassword', function (password: string): boolean {
	return this.encryptPassword(password) === this.hashedPassword;
});

schema.method('confirmPassword', (password: string, confirm: string): boolean => {
	return password === confirm;
});

schema.virtual('password')
	.set(function (password: string): void {
		this._plainPassword = password;
		this.salt = Math.random() + '';
		this.hashedPassword = this.encryptPassword(password);
	})
	.get(function (): string {
		return this._plainPassword;
	});


schema.static('authorize', async (data: IAdmin) => {
	const { login, password } = data;
	const admin: IAdmin = await Admin.findOne({ login }).exec();
		
  if (!admin || !password || !admin.checkPassword(password)) 
    throw new ModelError("Неверные данные");
		
	return admin;
});

schema.static('password', async (oldpassword: string, password: string, confirm: string): Promise<void> => {
	const admin: IAdmin = await Admin.findOne({}).exec();

	if (!admin.checkPassword(oldpassword)) throw new ModelError('Старый пароль неверный.');
	if (!admin.confirmPassword(password, confirm)) throw new ModelError('Пароли не совпадают.');

	admin.hashedPassword = admin.encryptPassword(password);
	admin.save();
});

export const Admin: IAdminModel = model<IAdmin, IAdminModel>("Admin", schema);