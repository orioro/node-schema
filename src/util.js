import {
  TYPE_MAP,
  TYPE_LIST,
  TYPE_NUMBER,
  TYPE_STRING,
  TYPE_BOOLEAN,
  TYPE_DATE,
} from './constants'

export const mergeTypeLists = ({
  STRING_TYPES,
  NUMBER_TYPES,
  BOOLEAN_TYPES,
  DATE_TYPES,
  MAP_TYPES,
  LIST_TYPES,
  OTHER_TYPES
}) => {
  STRING_TYPES = mergeArrays(STRING_TYPES, [TYPE_STRING])
  NUMBER_TYPES = mergeArrays(NUMBER_TYPES, [TYPE_NUMBER])
  BOOLEAN_TYPES = mergeArrays(BOOLEAN_TYPES, [TYPE_BOOLEAN])
  DATE_TYPES = mergeArrays(DATE_TYPES, [TYPE_DATE])
  MAP_TYPES = mergeArrays(MAP_TYPES, [TYPE_MAP])
  LIST_TYPES = mergeArrays(LIST_TYPES, [TYPE_LIST])
  OTHER_TYPES = OTHER_TYPES || []

  return {
    STRING_TYPES,
    NUMBER_TYPES,
    BOOLEAN_TYPES,
    DATE_TYPES,
    MAP_TYPES,
    LIST_TYPES,
    OTHER_TYPES,
    ALL_TYPES: [
      ...STRING_TYPES,
      ...NUMBER_TYPES,
      ...BOOLEAN_TYPES,
      ...DATE_TYPES,
      ...MAP_TYPES,
      ...LIST_TYPES,
      ...OTHER_TYPES,
    ]
  }
}

export const mergeArrays = (...args) => {
  return args.reduce((acc, arr) => {
    return Array.isArray(arr) ? [...acc, ...arr] : acc
  }, [])
}

export const schemaIsType = (schema, types) => {
  return schema.type && types.indexOf(schema.type) !== -1
}
