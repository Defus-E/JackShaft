import { Schema, Model, model } from 'mongoose';
import { ICategoryDocument, IDocument, IDocRes } from '../interfaces/IDocument';
import ModelError from '../error/model';
import * as rimraf from 'rimraf';
import * as path from 'path';

export interface IDocumentModel extends Model<ICategoryDocument> {
  category(id?: string): ICategoryDocument[] | IDocument[];
  catedit(id: number, categorytitle: { ru: string, en: string }): { category: ICategoryDocument, new: boolean };
  docedit(data: IDocument, files: boolean): IDocRes;
  delete(id: string, categoryid: string): void;
}

const schema: Schema = new Schema({
  categorytitle: {
    ru: {
      type: String,
      required: true
    },
    en: String
  },
  documents: [{
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
    document: {
      name: String,
      size: Number,
      path: {
        type: String,
        required: true
      }
    },
    date: {
      type: Date,
      default: Date.now()
    }
  }]
}, { versionKey: false });

// Получить категории документов или документы конкретной категории по ID
schema.static('category', async (id?: string): Promise<ICategoryDocument[] | IDocument[]> => {
  return id ? (await Document.findById(id).exec()).documents : await Document.find({}).exec();
});

// Редактирование категории если она найдена, в ином случае - создать новую
schema.static('catedit', async (id: string, categorytitle: { ru: string, en: string }): Promise<{ category: ICategoryDocument, new: boolean }> => {
  try {
    const CATEGORY: ICategoryDocument = await Document.findById(id).exec();
    const response: { category: ICategoryDocument, new: boolean } = { category: null, new: false };
    
    if (!CATEGORY) {
      const NEWCATEGORY = new Document({ categorytitle, documents: [] });

      response.category = await NEWCATEGORY.save();
      response.new = true;
    } else {
      CATEGORY.categorytitle.ru = categorytitle.ru;
      CATEGORY.categorytitle.en = categorytitle.en;

      response.category = await CATEGORY.save();
      response.new = false;
    }

    return response;
  } catch (err) {
    throw new ModelError('Недостаточно данных для дальнейшей обработки запроса.');
  }
});

// Редактирование документа, если найден в базе, иначе - создать новый
schema.static('docedit', async ({ id, categoryid, title, image, document }, files: boolean): Promise<IDocRes> => {
  try {
    const CATEGORY: ICategoryDocument = await Document.findById(categoryid).exec();
    const DOCUMENT: IDocument = CATEGORY.documents.find((document: IDocument) => document.id == id);
    const RESPONSE: IDocRes = { doc: null, new: false };
    
    if (!DOCUMENT) {
      if (!files) throw new ModelError('Файл не найден либо его формат не поддерживается.');
      const NEWDOCUMENT: any = { title, image, document };

      CATEGORY.documents.push(NEWDOCUMENT);
      RESPONSE.doc = NEWDOCUMENT;
      RESPONSE.new = true;
    } else {
      DOCUMENT.title.ru = title.ru;
      DOCUMENT.title.en = title.en;

      if (image !== '') {
        await rimraf(path.join(__dirname, '../public', DOCUMENT.image), () => {});
        DOCUMENT.image = image;
      }
      if (Object.keys(document).length > 0) {
        await rimraf(path.join(__dirname, '../public', DOCUMENT.document.path), () => {});
        DOCUMENT.document.name = document.name;
        DOCUMENT.document.path = document.path;
      }
      
      RESPONSE.doc = DOCUMENT
      RESPONSE.new = false;
    }

    await CATEGORY.save();
    return RESPONSE;
  } catch (err) {
    if (image) await rimraf(path.join(__dirname, '../public', image), () => {});
    if (document.path) await rimraf(path.join(__dirname, '../public', document.path), () => {});
    throw err instanceof ModelError ? err : new ModelError('Недостаточно данных для дальнейшей обработки запроса.');
  }
});

// Удаление документа и его файлов из файловой системы по ID категории, которой он принадлежит
schema.static('delete', async (id: string, categoryid: string): Promise<void> => {
  const CATEGORY: ICategoryDocument = await Document.findById(categoryid).exec();
  const INDEX: number = CATEGORY.documents.findIndex((document: IDocument) => document.id == id);
  const { image, document } = CATEGORY.documents[INDEX];

  CATEGORY.documents.splice(INDEX, 1);

  await rimraf(path.join(__dirname, '../public', image), () => {});
  await rimraf(path.join(__dirname, '../public', document.path), () => {});
  await CATEGORY.save();
});

const Document: IDocumentModel = model<ICategoryDocument, IDocumentModel>("Document", schema);
export default Document;
