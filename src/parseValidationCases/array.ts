import { Alternative } from '@orioro/cascade'
import { ValidationCase } from '@orioro/validate'
import { getError } from '../util'

import { ResolvedSchema } from '../types'

import { ENUM } from './enum'

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

export const DEFAULT_ARRAY_CASES = [
  ENUM,
  ARRAY_MIN_LENGTH,
  ARRAY_MAX_LENGTH,
  ARRAY_EXACT_LENGTH,
  ARRAY_UNIQUE_ITEMS,
]
