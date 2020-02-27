import { Schema, Model, Types, model } from 'mongoose';
import { IGalleryDocument, IPhoto } from '../interfaces/IGalleryDocument';
import ModelError from '../error/model';
import * as rimraf from 'rimraf';
import * as path from 'path';

export interface IGalleryModel extends Model<IGalleryDocument> {
	get(id: string): IGalleryDocument[];
	edit(data: IGalleryDocument, image: boolean): { album: IGalleryDocument, new: boolean };
	photo(id: string, data: IPhoto, image: boolean): { id: string, photo: IPhoto, new: boolean };
	delete(id: string, photoid?: string): void;
}

const schema: Schema = new Schema({
  title: {
    ru: {
      type: String,
      required: true
    },
    en: String
  },
  image: {
    type: String,
    required: true
  },
  photos: [{
    description: {
      ru: {
        type: String,
        required: true
      },
      en: String
    },
    photo: {
      type: String,
      required: true
    }
  }],
  date: {
    type: Date,
    default: Date.now()
  }
}, { versionKey: false });

// Выдать список альбомов или все фото конкретного альбома
schema.static('get', async (id: string): Promise<IGalleryDocument[]> => {
  if (!id) return await Gallery.find({}).exec();
  else return [await Gallery.findById(id).exec()];
});

// Если уже альбом найден то редактировать его, иначе создать новый
schema.static('edit', async (data: IGalleryDocument, image: boolean): Promise<{ album?: IGalleryDocument, new?: boolean }> => {
  try {
    const ITEM: IGalleryDocument = await Gallery.findById(data.id).exec();
    const response: { album?: IGalleryDocument, new?: boolean } = {};
    
    if (!ITEM) {
      if (!image) throw new ModelError('Файл не найден либо его формат не поддерижвается.');
      const NEWITEM = new Gallery(data);

      response.album = await NEWITEM.save();
      response.new = true;
    } else {
      ITEM.title.ru = data.title.ru;
      ITEM.title.en = data.title.en;

      if (image) {
        rimraf(path.join(__dirname, '../public', ITEM.image), () => {});
        ITEM.image = data.image
      }
      
      response.album = await ITEM.save();
      response.new = false;
    }

    return response;
  } catch (err) {
    await rimraf(path.join(__dirname, '../public', data.image), () => {});
    throw new ModelError('Недостаточно данных для дальнейшей обработки запроса.');
  }
});

// Если фото не найдено то добавить в альбом, иначе редактировать
schema.static('photo', async (id: string, data: IPhoto, image: boolean): Promise<{ id?: string, photo?: IPhoto, new?: boolean }> => {
  try {
    const ITEM: IGalleryDocument = await Gallery.findById(id).exec();
    const response: { id?: string, photo?: IPhoto, new?: boolean } = {};
    let foundedIndex: number = ITEM.photos.findIndex(x => x._id == data._id);
    
    if (foundedIndex !== -1) {
      ITEM.photos[foundedIndex].description.ru = data.description.ru;
      ITEM.photos[foundedIndex].description.en = data.description.en;
    
      if (image) {
        await rimraf(path.join(__dirname, '../public', ITEM.photos[foundedIndex].photo), () => {});
        ITEM.photos[foundedIndex].photo = data.photo;
      }

      response.photo = data;
      response.new = false;

      await ITEM.save();
    } else if (image) {
      ITEM.photos.push(data);
      
      response.photo = ITEM.photos[ITEM.photos.length - 1];
      response.new = true;

      await ITEM.save();
    } else {
      throw Error;
    }

    response.id = id;
    return response;
  } catch (err) {
    await rimraf(path.join(__dirname, '../public', data.photo), () => {});
    throw new ModelError('Недостаточно данных для дальнейшей обработки запроса.');
  }
});

// Если ид фото получен - удалить фото с этим ид, иначе удалить весь альбом
schema.static('delete', async (id: string, photoid?: string): Promise<void> => {
  const ITEM: IGalleryDocument = await Gallery.findById(id).exec();

  if (photoid) {
    let foundedIndex: number = ITEM.photos.findIndex(x => x._id == photoid);

    await rimraf(path.join(__dirname, '../public', ITEM.photos[foundedIndex].photo), () => {});
    ITEM.photos.splice(foundedIndex, 1);
    ITEM.save();
  } else {
    await Gallery.findByIdAndRemove(id).exec();
    await rimraf(path.join(__dirname, '../public', ITEM.image), () => {});

    for (let i: number = 0; i < ITEM.photos.length; i++)
      await rimraf(path.join(__dirname, '../public', ITEM.photos[i].photo), () => {});
  }
});

const Gallery: IGalleryModel = model<IGalleryDocument, IGalleryModel>("Gallery", schema);
export default Gallery;