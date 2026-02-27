const Errors = {
  // NOTE: KEYGRID
  INVALID_KEYGRID_CONFIG: 'Keygrid config has null value',
  INVALID_MATRIX_LENGTH: 'Columns and rows not of same length',
  INVALID_KEYS_LENGTH: 'Keys.length not equal to keys.columns or keys.rows',
  DUPLICATE_KEY_VALUES: 'Duplicate keys in rows and columns not allowed',
  SURPASSING_KEY_LIMIT: 'Surpassing the maximum amount of keys',

  // NOTE: ARENA
  INVALID_ARENA_FORMAT: 'Arena wrongly formatted',
  MISSING_ARENA_MESH: 'Missing mesh(es) to complete arena initialization',
  FAILED_ARENA_IMPORT: 'Failed to import arena mesh',

  // NOTE: HUD
  FAILED_HUD_IMPORT: 'Failed to import hud',
  MISSING_HUD_CONTROL: 'Missing necessary hud control',

  // NOTE: HITINDICATOR
  FAILED_LINES_INIT: 'Failed to initialize lines',

  // NOTE: CREATE
  FAILED_MATERIAL_INIT: 'Failed to initialization material'
};

export default Errors;
