/* Настройки для file://; содержимое идентично game.json. */
window.CRYSTAL_OFFLINE_CONFIG = {
  "version": "3.1-balanced",
  "project": "Кристальный рубеж — библиотека ресурсов",
  "notes": "Изменения этого JSON видны на сайте и при запуске через локальный HTTP-сервер. Для запуска файла двойным щелчком используйте также config.offline.js.",
  "game": {
    "startGold": 195,
    "startHealth": 9,
    "maxWaves": 5,
    "bonusBetweenWaves": 30,
    "waveEnemyHealthGrowth": 0.4,
    "waveEnemySpeedGrowth": 0.095,
    "spawnIntervalMultiplier": 0.72,
    "maxTowers": 9
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
