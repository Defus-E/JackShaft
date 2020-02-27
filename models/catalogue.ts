import { Schema, Model, model } from 'mongoose';
import { ICatalogueDocument, ICatalogueGrouped, ITable } from '../interfaces/ICatalogueDocument';
import ModelError from '../error/model';
import * as rimraf from 'rimraf';
import * as path from 'path';

export interface ICatalogueModel extends Model<ICatalogueDocument> {
	get(id: string, all?: boolean, grouped?: boolean): ICatalogueDocument[] | ICatalogueGrouped;
	edit(data: ICatalogueDocument, image?: string, tables?: ITable[]): ITable[];
	delete(id: string): void;
}

interface RUEN { 
  en: string, 
  ru: string 
}

const schema: Schema = new Schema({
  type: {
    type: Number,
    required: true
  },
  name: {
    en: String,
    ru: {
      type: String,
      required: true
    }
  },
  category: {
    en: String,
    ru: {
      type: String,
      required: true
    }
  },
  power: String,
  rotation_height: String,
  power_and_mode: String,
  poles: String,
  voltage: String,
  rated_frequency: String,
  frequency_control_range: String,
  possible_options_for_heat_resistance: {
    en: String,
    ru: String
  },
  degree_of_protection: String,
  mounting_method: String,
  cooling_method: String,
  image: {
    type: String,
    required: true
  },
  description: {
    en: String,
    ru: String
  },
  texttables: {
    en: String,
    ru: String
  },
  tables: [{
    name: String,
    path: String,
    size: Number
  }],
  date: {
    type: Date,
    default: Date.now()
  }
}, { versionKey: false });

// Получение товаров
schema.static('get', async (id: string, all?: boolean, grouped?: boolean): Promise<ICatalogueDocument[] | ICatalogueGrouped> => {
  /*
    Сгруппировать товары при помощи агрегата так,
    чтобы он был отсортирован по дате,
    сгруппирован по типу товара,
    и на выход оставляя лишь его ObjectID, имя и изображение
  */
  let item: ICatalogueDocument[] | ICatalogueGrouped = [];
  let aggregate: any[] = [
    { $sort: { date: 1 } },
    {
      $group: { 
        _id: '$type',
        doc: { 
          $push: { 
            _id: '$_id', 
            name: '$name', 
            image: "$image" 
          } 
        },
        count: { $sum: 1 }
      }
    }
  ];
  
  if (!id && !all) throw new ModelError("Индентификатор не найден.", 404); // ID товара в URL найден и товар надо выводить один
  else if (all && !grouped) item = await Catalogue.find({}).sort({ date: 1 }).exec(); // товары надо вывести все, но не группировать
  else if (all && grouped) item = await Catalogue.aggregate(aggregate).exec(); // товары надо вывести все, но сгруппировать
  else { // конкретный товар по его ID в URL
    let temp: ICatalogueDocument = await Catalogue.findById(id).exec();
    let next: ICatalogueDocument = (await Catalogue.find({ date: { $gt: temp.date }}).sort({ type: 1, date: 1 }).limit(1).exec())[0];
    let previous: ICatalogueDocument = (await Catalogue.find({ date: { $lt: temp.date }}).sort({ type: -1, date: -1 }).limit(1).exec())[0];

    temp.next = next ? next._id : (await Catalogue.find({}).sort({ date: 1 }).limit(1).exec())[0]._id;
    temp.previous = previous ? previous._id : (await Catalogue.find({}).sort({ date: -1 }).limit(1).exec())[0]._id;
    
    item.push(temp);
  }

  return item;
});

/*
  Редактирование каталога -

  Если товар по ID найден:
    Проверять наличие изображения в аргументе(сведетельствует о том, поддерживается он или нет) (см. контроллер каталога)
    Сущ. исключающие поля, которые не надо добавлять как все
    Проверка наличия прикрепленного текста к таблицам - обязательное условие
  В ином случае:
    Исключающие поля обрабатываются отдельно
    Также есть список удаленных изображений(таблиц), которые посылается на сервер и обрабатывается
    Удалить старое изображение и установить новое в базу
*/
schema.static('edit', async (data: ICatalogueDocument, image?: string, tables?: ITable[]): Promise<ITable[]> => {
  let response: ITable[] = [];
  const ITEM: ICatalogueDocument = await Catalogue.findById(data.id).exec();
  const EXCEPTION: string[] = [
    'name', 'category', 'description', 'deleted',
    'possible_options_for_heat_resistance', 'texttables'
  ];
  
  if (!data.type || !data.category || !data.name) throw new ModelError("Пропущены следующие поля: тип двигателя, имя каталога, категория.", 404);
  if (!ITEM) {
    if (!image) throw new ModelError('Формат файла не поддерживается или же его размер слишком велик.', 415);
    for (let i = 0; i < EXCEPTION.length; i++)
      data[EXCEPTION[i]] = data[EXCEPTION[i]] ? JSON.parse(data[EXCEPTION[i]]) : null;
      
    if (image) data.image = image;
    if (tables && !data.texttables.ru) throw new ModelError('Текст над таблицами не найден.', 404);
    else data.tables = tables;
    
    const NEWITEM: ICatalogueDocument = new Catalogue(data);
    NEWITEM.save();
  } else {
    for (let prop in data)
      if (!EXCEPTION.includes(prop))
        ITEM[prop] = data[prop];
      else if (prop !== 'deleted') {
        let temp: RUEN = JSON.parse(data[prop]);
        ITEM[prop].ru = temp.ru;
        ITEM[prop].en = temp.en;
      } else if (prop === 'deleted' && ITEM.tables) {
        let deleted: string[] = JSON.parse(data[prop]);
        let index: number;
        
        for (let i: number = 0; i < deleted.length; i++) {
          await rimraf(path.join(__dirname, '../public', deleted[i]), () => {});
          index = ITEM.tables.findIndex((table: ITable) => table.path == deleted[i]);
          ITEM.tables.splice(index, 1);
        }
      }

    if (tables) ITEM.tables = [...ITEM.tables, ...tables];
    if (image) {
      if (ITEM.image && ITEM.image !== '')
        if (ITEM.image !== '/img/nf.jpeg')
          rimraf(path.join(__dirname, '../public', ITEM.image), () => {});
      
      ITEM.image = image;
    }

    response = tables;
    ITEM.date = new Date();
    ITEM.save();
  } 

  return response;
});

/*
  Удаление товара по ID -

  Берёт изображение и массив таблиц(изображений) из базы
  Удаляет сам документ из базы и главное изображение
  Затем удаляет поочередно каждое изображение таблиц
*/
schema.static('delete', async (id: string): Promise<void> => {
  const { image, tables } = await Catalogue.findById(id).exec();

  await Catalogue.findByIdAndRemove(id).exec();
  await rimraf(path.join(__dirname, '../public', image), () => {});

  for (let i: number = 0; i < tables.length; i++)
    await rimraf(path.join(__dirname, '../public', tables[i].path), () => {});
});

const Catalogue: ICatalogueModel = model<ICatalogueDocument, ICatalogueModel>("Catalogue", schema);
export default Catalogue;
