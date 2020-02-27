import { Document } from 'mongoose';

export interface ICatalogueDocument extends Document {
	readonly id?: string;
  type: number;
  name: {
    en: string;
    ru: string;
  };
  category?: {
    en: string;
    ru: string;
  };
  power?: string;
  rotation_height?: string;
  power_and_mode?: string;
  poles?: string;
  voltage?: string;
  rated_frequency?: string;
  frequency_control_range?: string;
  possible_options_for_heat_resistance?: {
    ru: string;
    en: string;
  };
  degree_of_protection?: string;
  mounting_method?: string;
  cooling_method?: string;
  image?: string;
  description?: {
    en: string;
    ru: string;
  } | string;
  texttables?: {
    en: string;
    ru: string;
  };
  tables?: ITable[];
  previous?: string;
  next?: string;
  date: Date;
}

export interface ICatalogueGrouped {
  0?: ICatalogueDocument[];
  2?: ICatalogueDocument[];
  3?: ICatalogueDocument[];
  4?: ICatalogueDocument[];
}

export interface ITable {
  name: string;
  path: string;
  size?: number;
}