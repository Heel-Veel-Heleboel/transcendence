const Errors = {
  //KeyGrid
  INVALID_KEYGRID_CONFIG: 'keygrid config has null value',
  INVALID_MATRIX_LENGTH: 'columns and rows not of same length',
  INVALID_KEYS_LENGTH: 'keys.length not equal to keys.columns or keys.rows',
  DUPLICATE_KEY_VALUES: 'duplicate keys in rows and columns not allowed',
  SURPASSING_KEY_LIMIT: 'surpassing the maximum amount of keys',
  //Arena
  INVALID_ARENA_FORMAT: 'arena wrongly formatted'
};

export default Errors;
