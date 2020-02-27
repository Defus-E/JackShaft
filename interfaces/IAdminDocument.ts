import { Document } from 'mongoose';

export interface IAdminDocument extends Document {
	readonly id?: string;
	salt?: string;
	hashedPassword?: string;
	login: string;
	password: string;
}