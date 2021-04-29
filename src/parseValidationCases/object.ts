import { isPlainObject } from 'lodash'
import { Alternative } from '@orioro/cascade'
import { ValidationCase } from '@orioro/validate'
import { getError } from '../util'

import { ResolvedSchema } from '../types'

import { ENUM } from './enum'

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

export const DEFAULT_OBJECT_CASES = [ENUM, OBJECT_UNKNOWN_PROPERTIES]
