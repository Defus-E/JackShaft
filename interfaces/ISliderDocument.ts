import { Document } from 'mongoose';

export interface ISliderDocument extends Document {
	readonly id?: string;
  page: string;
  index: number;
  slides: ISlide[]
}

export interface ISlide {
  _id?: any;
  title?: string;
  link?: string;
  image?: string;
}