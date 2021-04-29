import {
  interpreterList,
  evaluateSync,
  VALUE_EXPRESSIONS,
} from '@orioro/expression'
import { schemaTypeExpressions } from './expressions'

import { testCases } from '@orioro/jest-util'

describe('schemaTypeExpressions', () => {
  const interpreters = interpreterList({
    ...VALUE_EXPRESSIONS,
    ...schemaTypeExpressions(),
  })

  describe('$schemaType', () => {
    testCases(
      [
        ['2021-04-29T21:13:26.186Z', 'ISODate'],
        ['some_string', 'string'],
        [9, 'number'],
        [{}, 'object'],
        [[], 'array'],
        [true, 'boolean'],
        [undefined, 'undefined'],
        [null, 'null'],
      ],
      (input, expression) =>
        evaluateSync(
          {
            interpreters,
            scope: { $$VALUE: input },
          },
          ['$schemaType']
        ),
      '$schemaType'
    )
  })

  describe('$isSchemaType', () => {
    testCases(
      [
        ['2021-04-29T21:13:26.186Z', 'ISODate', true],
        ['2021-04-29T21:13:26.186Z', 'string', true],
        ['some_string', 'string', true],
        ['some_string', 'ISODate', false],
        [9, 'number', true],
        [{}, 'object', true],
        [[], 'array', true],
        [true, 'boolean', true],
        [undefined, 'undefined', true],
        [null, 'null', true],
      ],
      (input, type, expression) =>
        evaluateSync(
          {
            interpreters,
            scope: { $$VALUE: input },
          },
          ['$isSchemaType', type]
        ),
      '$isSchemaType'
    )
  })
})
