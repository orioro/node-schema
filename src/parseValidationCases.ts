import { isPlainObject } from 'lodash'
import { Alternative, cascadeFilter, test } from '@orioro/cascade'
import { ValidationCase } from '@orioro/validate'
import { getError } from './util'
import { ResolvedSchema } from './types'

import { CORE_SCHEMA_TYPES } from './expressions'

/**
 * @todo parseValidationCases Split alternatives into separate files by type
 * @todo parseValidationCases Tests for custom validation errors defined in schema
 * @const ENUM
 */
export const ENUM: Alternative = [
  (schema: ResolvedSchema): boolean => Array.isArray(schema.enum),
  (schema: ResolvedSchema): ValidationCase => {
    const enum_ = schema.enum as any[]

    return [
      ['$in', schema.enum],
      getError(schema, 'enum', {
        code: 'ENUM_ERROR',
        message: `Must be one of ${enum_.join(', ')}`,
      }),
    ]
  },
]

/**
 * @const STRING_MIN_LENGTH
 */
export const STRING_MIN_LENGTH: Alternative = [
  (schema: ResolvedSchema): boolean => typeof schema.minLength === 'number',
  (schema: ResolvedSchema): ValidationCase => [
    ['$gte', schema.minLength, ['$stringLength']],
    getError(schema, 'minLength', {
      code: 'STRING_MIN_LENGTH_ERROR',
    }),
  ],
]

/**
 * @const STRING_MAX_LENGTH
 */
export const STRING_MAX_LENGTH: Alternative = [
  (schema: ResolvedSchema): boolean => typeof schema.maxLength === 'number',
  (schema: ResolvedSchema): ValidationCase => [
    ['$lte', schema.maxLength, ['$stringLength']],
    getError(schema, 'maxLength', {
      code: 'STRING_MAX_LENGTH_ERROR',
    }),
  ],
]

/**
 * @const NUMBER_MIN
 */
export const NUMBER_MIN: Alternative = [
  (schema: ResolvedSchema): boolean =>
    typeof schema.min === 'number' || typeof schema.minExclusive === 'number',
  (schema: ResolvedSchema): ValidationCase => [
    typeof schema.minExclusive === 'number'
      ? ['$gt', schema.minExclusive]
      : ['$gte', schema.min],
    getError(schema, 'min', {
      code: 'NUMBER_MIN_ERROR',
    }),
  ],
]

/**
 * @const NUMBER_MAX
 */
export const NUMBER_MAX: Alternative = [
  (schema: ResolvedSchema): boolean =>
    typeof schema.max === 'number' || typeof schema.maxExclusive === 'number',
  (schema: ResolvedSchema): ValidationCase => [
    typeof schema.maxExclusive === 'number'
      ? ['$lt', schema.maxExclusive]
      : ['$lte', schema.max],
    getError(schema, 'max', {
      code: 'NUMBER_MAX_ERROR',
    }),
  ],
]

/**
 * @const NUMBER_MULTIPLE_OF
 */
export const NUMBER_MULTIPLE_OF: Alternative = [
  (schema: ResolvedSchema): boolean => typeof schema.multipleOf === 'number',
  (schema: ResolvedSchema): ValidationCase => [
    ['$eq', 0, ['$mathMod', schema.multipleOf]],
    getError(schema, 'multipleOf', {
      code: 'NUMBER_MULTIPLE_OF_ERROR',
    }),
  ],
]

/**
 * @const ARRAY_MIN_LENGTH
 */
export const ARRAY_MIN_LENGTH: Alternative = [
  (schema: ResolvedSchema): boolean => typeof schema.minLength === 'number',
  (schema: ResolvedSchema): ValidationCase => [
    ['$gte', schema.minLength, ['$arrayLength']],
    getError(schema, 'minLength', {
      code: 'ARRAY_MIN_LENGTH_ERROR',
    }),
  ],
]

/**
 * @const ARRAY_MAX_LENGTH
 */
export const ARRAY_MAX_LENGTH: Alternative = [
  (schema: ResolvedSchema): boolean => typeof schema.maxLength === 'number',
  (schema: ResolvedSchema): ValidationCase => [
    ['$lte', schema.maxLength, ['$arrayLength']],
    getError(schema, 'maxLength', {
      code: 'ARRAY_MAX_LENGTH_ERROR',
    }),
  ],
]

/**
 * @const ARRAY_EXACT_LENGTH
 */
export const ARRAY_EXACT_LENGTH: Alternative = [
  (schema: ResolvedSchema): boolean =>
    typeof schema.exactLength === 'number' || Array.isArray(schema.items),
  (schema: ResolvedSchema): ValidationCase => [
    [
      '$eq',
      typeof schema.exactLength === 'number'
        ? schema.exactLength
        : schema.items.length,
      ['$arrayLength'],
    ],
    getError(schema, 'exactLength', {
      code: 'ARRAY_EXACT_LENGTH_ERROR',
    }),
  ],
]

/**
 * @const ARRAY_UNIQUE_ITEMS
 */
export const ARRAY_UNIQUE_ITEMS: Alternative = [
  (schema: ResolvedSchema): boolean => Boolean(schema.uniqueItems),
  (schema: ResolvedSchema): ValidationCase => [
    [
      '$arrayEvery',
      [
        '$eq',
        ['$value', '$$INDEX'],
        [
          '$arrayFindIndex',
          ['$eq', ['$value', '$$PARENT_SCOPE.$$VALUE']],
          ['$value', '$$ARRAY'],
        ],
        // ['$arrayIndexOf', ['$value', '$$VALUE'], ['$value', '$$ARRAY']],
      ],
    ],
    getError(schema, 'uniqueItems', {
      code: 'ARRAY_UNIQUE_ITEMS_ERROR',
    }),
  ],
]

/**
 * @const OBJECT_UNKNOWN_PROPERTIES
 */
export const OBJECT_UNKNOWN_PROPERTIES: Alternative = [
  (schema: ResolvedSchema): ValidationCase => [
    [
      '$arrayIncludesAll',
      ['$objectKeys'],
      isPlainObject(schema.properties) ? Object.keys(schema.properties) : [],
    ],
    getError(schema, 'uniqueItems', {
      code: 'OBJECT_UNKNOWN_PROPERTIES_ERROR',
    }),
  ],
]

export const ISO_DATE_MIN: Alternative = [
  (schema: ResolvedSchema): boolean =>
    CORE_SCHEMA_TYPES.ISODate(schema.min) ||
    CORE_SCHEMA_TYPES.ISODate(schema.minExclusive),
  (schema: ResolvedSchema): ValidationCase => [
    typeof schema.minExclusive === 'string'
      ? ['$dateGt', schema.minExclusive]
      : ['$dateGte', schema.min],
    getError(schema, 'min', {
      code: 'ISO_DATE_MIN_ERROR',
    }),
  ],
]

export const ISO_DATE_MAX: Alternative = [
  (schema: ResolvedSchema): boolean =>
    CORE_SCHEMA_TYPES.ISODate(schema.max) ||
    CORE_SCHEMA_TYPES.ISODate(schema.maxExclusive),
  (schema: ResolvedSchema): ValidationCase => [
    typeof schema.maxExclusive === 'string'
      ? ['$dateLt', schema.maxExclusive]
      : ['$dateLte', schema.max],
    getError(schema, 'max', {
      code: 'ISO_DATE_MAX_ERROR',
    }),
  ],
]

/**
 * @function parseValidationCases
 */
export const parseValidationCases = (
  schema: ResolvedSchema,
  caseAlternatives: Alternative[]
): ValidationCase[] => {
  const parsedCases = cascadeFilter(
    test,
    caseAlternatives,
    schema
  ).map((prepareCase) => prepareCase(schema))

  const schemaCases = Array.isArray(schema.validation) ? schema.validation : []

  return [...parsedCases, ...schemaCases]
}

export const DEFAULT_STRING_CASES = [ENUM, STRING_MIN_LENGTH, STRING_MAX_LENGTH]

export const DEFAULT_NUMBER_CASES = [
  ENUM,
  NUMBER_MIN,
  NUMBER_MAX,
  NUMBER_MULTIPLE_OF,
]

export const DEFAULT_ARRAY_CASES = [
  ARRAY_MIN_LENGTH,
  ARRAY_MAX_LENGTH,
  ARRAY_EXACT_LENGTH,
  ARRAY_UNIQUE_ITEMS,
]

export const DEFAULT_OBJECT_CASES = [ENUM, OBJECT_UNKNOWN_PROPERTIES]

export const DEFAULT_BOOLEAN_CASES = [ENUM]

export const DEFAULT_ISO_DATE_CASES = [ISO_DATE_MIN, ISO_DATE_MAX]
