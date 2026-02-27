const gameConfig = {
  // NOTE: PLAYER
  playerMeshName: 'playerMesh',
  playerMaterialName: 'playerWireframe',
  playerLifespanStart: 1000,
  playerManaStart: 0,

  // NOTE: ARENA
  arenaMeshesCount: 4,
  arenaImportpath: '/arena.gltf',
  arenaMaterialName: 'arenaWireframe',
  areneId: 'arena',
  goalId1: 'goal_1',
  goalId2: 'goal_2',
  rootMesh: '__root__',

  // NOTE: HACK
  hackDeath: 0,

  // NOTE: HITINDICATOR
  hitIndicatorFrontColor: { r: 1, g: 0, b: 0 },
  hitIndicatorBackColor: { r: 0, g: 1, b: 0 },
  hitIndicatorDebugMeshName: 'hitIndicatorDebugMesh',
  hitIndicatorDebugMaterialName: 'hitIndicatorDebugMaterial',
  hitDiskMaterialName: 'hitDiskMaterial',
  hitDiskAlpha: 1,
  hitDiskStartColor: { r: 0, g: 1, b: 0 },
  hitDiskEndColor: { r: 1, g: 0, b: 0 },
  hitDiskMeshName: 'diskMesh',
  hitLinesMeshName: 'linesMesh',
  hintFontPath: '/Orbitron_Regular.json',

  // NOTE: HUD
  guiTextureName: 'GUI',
  guiTextureWidth: 600,
  guiTextureHeight: 400,
  guiHealtControlName: 'healthMeter',
  guiManaControlName: 'manaMeter',

  // NOTE: KEYMANAGER
  keyLimit: 13,
  handlePrecisionRatio: 25,

  // NOTE: KEYGRID
  keyGridMeshName: 'keyGridMesh',
  keyGridMaterialName: 'keyGridMaterial',
  KeyGridMaterialOpacity: 0.99,
  KeyGridMaterialMUF: 0.99,
  keyGridRatioMultipler: 4,
  keyGridTextResolution: 20,
  keyGridTextDepth: 0.1,
  keyGridTextMaterialName: 'transparentText',
  keyGridTextMaterialAlpha: 0.15,

  // NOTE: EXTRA
  rootTransformNodeName: 'tr',

  // NOTE: CAMERA
  mainCameraName: 'mainCamera'
};

export default gameConfig;
