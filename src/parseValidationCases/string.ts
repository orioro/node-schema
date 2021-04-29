import { Alternative } from '@orioro/cascade'
import { ValidationCase } from '@orioro/validate'
import { getError } from '../util'

import { ResolvedSchema } from '../types'

import { ENUM } from './enum'

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

export const DEFAULT_STRING_CASES = [ENUM, STRING_MIN_LENGTH, STRING_MAX_LENGTH]
