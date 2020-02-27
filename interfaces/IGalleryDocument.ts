import { Document } from 'mongoose';

export interface IGalleryDocument extends Document {
	readonly id?: string;
  title: {
    ru: string;
    en: string;
  };
  image: string;
  photos?: IPhoto[];
  date: Date;
}

export interface IPhoto {
  _id?: any;
  photo: string;
  description: {
    ru: string;
    en: string;
  };
}
