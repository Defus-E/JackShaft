import { Document } from 'mongoose';

export interface ICategoryDocument extends Document {
  id: number;
  categorytitle: {
    ru: string;
    en: string;
  };
  documents: IDocument[];
}

export interface IDocument extends Document {
	readonly id?: string;
  title: {
    ru: string;
    en: string;
  };
  image: string;
  document: {
    name: string;
    path: string;
    size: number
  };
  date: Date;
}

export interface IDocRes {
  doc?: IDocument,
  new: boolean
}