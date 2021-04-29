import { Alternative } from '@orioro/cascade'
import { ValidationCase } from '@orioro/validate'
import { getError } from '../util'

import { ResolvedSchema } from '../types'

import { ENUM } from './enum'

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

export const DEFAULT_NUMBER_CASES = [
  ENUM,
  NUMBER_MIN,
  NUMBER_MAX,
  NUMBER_MULTIPLE_OF,
]
