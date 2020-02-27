import { Schema, Model, model } from 'mongoose';
import { ISliderDocument, ISlide } from '../interfaces/ISliderDocument';
import ModelError from '../error/model';
import * as rimraf from 'rimraf';
import * as path from 'path';

export interface ISliderModel extends Model<ISliderDocument> {
	get(index: number): ISliderDocument;
	add(index: number, data: ISlide): { slide: ISlide, increment: number };
	edit(index: number, data: ISlide[]): void;
	delete(id: string, index: number): void;
}

const schema: Schema = new Schema({
  page: {
    type: String,
    required: true,
    unique: true
  },
  index: {
    type: Number,
    required: true
  },
  slides: [{
    title: {
      type: String,
      required: true
    },
    link: String,
    image: {
      type: String,
      required: true
    }
  }]
}, { versionKey: false });

// Получить слайды конкретного из 4 слайдеров(в базе хранятся слайдеры с ID от 1 до 4 включительно)
schema.static('get', async (index: number): Promise<ISliderDocument> => {
  if ((index < 1 || index > 4)) throw new ModelError('Странциа не найдена');
  
  const ITEM: ISliderDocument = await Slider.findOne({ index });
  const PAGES: string[] = [,'Главная', 'Двигатели', 'Печи', 'Промышленное оборудование'];

  if (!ITEM && (index >= 1 && index <= 4)) {
    const NEWITEM: ISliderDocument = new Slider({ 
      page: PAGES[index],
      index: index,
      slides: []
    });

    return NEWITEM.save();
  }

  return ITEM;
});

// Добавить слайд
schema.static('add', async (index: number, data: ISlide): Promise<{ slide: ISlide, increment: number }> => {
  if (!data || (index < 1 || index > 4)) throw new ModelError('Страница не найдена', 404); 
  const ITEM: ISliderDocument = await Slider.findOne({ index });

  ITEM.slides.push(data);
  ITEM.save();

  const LASTINDEX: number = ITEM.slides.length - 1;

  return { slide: ITEM.slides[LASTINDEX], increment: LASTINDEX };
});


// Редактировать каждый слайд получая массив тех слайдов, что надо редактировать
schema.static('edit', async (index: number, data: ISlide[]): Promise<void> => {
  const ITEM: ISliderDocument = await Slider.findOne({ index });
  let foundedIndex: number, fullpath: string;
  
  for (let i: number = 0; i < data.length; i++) {
    foundedIndex = ITEM.slides.findIndex(x => x._id == data[i]._id);
    
    ITEM.slides[foundedIndex].title = data[i].title;
    ITEM.slides[foundedIndex].link = data[i].link;
    
    if (data[i].image) {
     fullpath = path.join(__dirname, '../public', ITEM.slides[foundedIndex].image);
     ITEM.slides[foundedIndex].image = data[i].image;
     rimraf(fullpath, () => {});
    }
  }

  ITEM.save();
});

// Удалить слайд и фото
schema.static('delete', async (id: string, index: number): Promise<void> => {
  const SLIDER: ISliderDocument = await Slider.findOne({ index });

  SLIDER.slides = SLIDER.slides.filter((slide: ISlide) => {
    if (slide._id == id) rimraf(path.join(__dirname, '../public', slide.image), () => {});
    return slide._id != id;
  });

  SLIDER.save();
});

const Slider: ISliderModel = model<ISliderDocument, ISliderModel>("Slider", schema);
export default Slider;
