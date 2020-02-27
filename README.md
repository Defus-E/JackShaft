Настройки TSConfig'a приведены в файле tsconfig.json <br>
Экосистема pm2 находится в файле pm2.json(порт, режим работы, среда)

Предварительно следует установить такие глобальные пакеты как:
<pre>
  - pm2        (npm install -g pm2)
  - cross-env  (npm install -g cross-env)
  - typescript (npm install -g typescript)
  - ts-node    (npm install -g ts-node)
</pre>
А также typescript компилятор для pm2:
  - pm2 install typescript

npm run start:dev - Запуске сервера в обычном режиме разработчика. <br>
npm run start:prod - Запуске сервера в обычном режиме продукции. <br>
npm run pm2 - Запуск сервера в фоновом режиме. (Порт по умолчанию - 8085) <br>
npm run logs - Смотреть лог сервера