/* Используется при открытии index.html двойным щелчком (file://).\n   При публикации / http:// браузер читает game.json.\n   Для одинакового поведения заменяйте объект ниже после изменения game.json. */
window.CRYSTAL_OFFLINE_CONFIG = {
  "version": "3.0-pilot",
  "project": "Кристальный рубеж — библиотека ресурсов",
  "notes": "Изменения этого JSON видны на сайте и при запуске через локальный HTTP-сервер. Для запуска файла двойным щелчком используйте также config.offline.js.",
  "game": {
    "startGold": 230,
    "startHealth": 12,
    "maxWaves": 5,
    "bonusBetweenWaves": 50
  },
  "towerCosts": {
    "ray": 65,
    "frost": 90,
    "nova": 120
  },
  "assets": {
    "flare": "assets/kenney/flare.png",
    "magic": "assets/kenney/magic.png",
    "bush": "assets/kenney/bush.png",
    "bushOrange": "assets/kenney/bush-orange.png"
  },
  "assetLimits": {
    "maxSingleImageKB": 250,
    "totalImagesKB": 600,
    "recommendedImagePx": 512,
    "mobileTouchTargetPx": 44
  },
  "license": "Kenney CC0 — подробности в assets/ASSETS_LICENSES.md"
};
