import {
  resolveSchema as resolveSchema_,
  schemaResolverObject,
  schemaResolverArray,
  schemaResolverFunction,
  schemaResolverExpression,
  schemaResolverDefault,
} from './resolveSchema'
import { groupBy } from 'lodash'

const cities = [
  { name: 'São Paulo', state: 'SP' },
  { name: 'Santos', state: 'SP' },
  { name: 'Ribeirão Preto', state: 'SP' },
  { name: 'Rio de Janeiro', state: 'RJ' },
  { name: 'Angra dos Reis', state: 'RJ' },
  { name: 'Belo Horizonte', state: 'MG' },
  { name: 'Ouro Preto', state: 'MG' },
]
const states = ['SP', 'RJ', 'MG']
const citiesByState = groupBy(cities, 'state')

describe('resolveSchema(schema, value, context?) - using schemaResolverFunction', () => {
  const resolveSchema = resolveSchema_.bind(null, {
    resolvers: [
      schemaResolverFunction(),
      schemaResolverObject(),
      schemaResolverArray(),
      schemaResolverDefault(),
    ],
  })

  test('basic', () => {
    const schema = {
      type: 'object',
      properties: {
        state: {
          type: 'string',
          options: states,
        },
        city: {
          type: 'string',
          options: (value) => citiesByState[value.state] || [],
        },
      },
    }

    const expected = [
      [{}, []],
      [{ state: null }, []],
      [{ state: 'RJ' }, citiesByState.RJ],
      [{ state: 'SP' }, citiesByState.SP],
      [{ state: 'MG' }, citiesByState.MG],
    ]

    expected.forEach(([value, expectedOptions]) => {
      expect(resolveSchema(schema, value).properties.city.options).toEqual(
        expectedOptions
      )
    })
  })
})

describe('resolveSchema(schema, context) - using expressions', () => {
  const resolveSchema = resolveSchema_.bind(null, {
    resolvers: [
      schemaResolverExpression(),
      schemaResolverObject(),
      schemaResolverArray(),
      schemaResolverDefault(),
    ],
  })

  test('example: conditional options', () => {
    const schema = {
      type: 'object',
      properties: {
        state: {
          type: 'string',
          options: states,
        },
        city: {
          type: 'string',
          options: ['$switchKey', citiesByState, [], ['$value', 'state']],
        },
      },
    }

    const expected = [
      [{}, []],
      [{ state: null }, []],
      [{ state: 'RJ' }, citiesByState.RJ],
      [{ state: 'SP' }, citiesByState.SP],
      [{ state: 'MG' }, citiesByState.MG],
    ]

    expected.forEach(([value, expectedOptions]) => {
      expect(resolveSchema(schema, value).properties.city.options).toEqual(
        expectedOptions
      )
    })
  })

  test('nested option resolution', () => {
    const schema = {
      type: 'object',
      properties: {
        key1: { type: 'string' },
        key2: { type: 'string' },
        key3: {
          type: 'string',
          options: [
            '$switchKey',
            {
              valueA: [
                'A-OPT1',
                'A-OPT2',
                ['$stringConcat', '-A-OPT3', ['$value', 'key1']],
              ],
              valueB: [
                '$arrayMap',
                [
                  '$stringConcat',
                  ['$value'],
                  ['$value', '$$PARENT_SCOPE.$$VALUE.key1'],
                ],
                ['-B-OPT1', '-B-OPT2'],
              ],
            },
            [],
            ['$value', 'key2'],
          ],
        },
      },
    }

    const expected = [
      [{}, []],
      [
        { key1: 'key1-value', key2: 'valueA' },
        ['A-OPT1', 'A-OPT2', 'key1-value-A-OPT3'],
      ],
      [
        { key1: 'key1-value', key2: 'valueB' },
        ['key1-value-B-OPT1', 'key1-value-B-OPT2'],
      ],
    ]

    expected.forEach(([input, expectedOptions]) => {
      expect(resolveSchema(schema, input).properties.key3.options).toEqual(
        expectedOptions
      )
    })
  })

  describe('properties whose nested resolution should be skipped by default', () => {
    test('`validation`', () => {
      const smallTextValidation = [
        [['$stringStartsWith', 'small-text:'], 'PREFIX_ERROR'],
      ]

      const mediumTextValidation = [
        [['$stringStartsWith', 'medium-text:'], 'PREFIX_ERROR'],
      ]

      const largeTextValidation = [
        [['$stringStartsWith', 'large-text:'], 'PREFIX_ERROR'],
      ]

      const schema = {
        type: 'object',
        properties: {
          size: {
            type: 'string',
            enum: ['small', 'medium', 'large'],
          },
          text: {
            type: 'string',
            maxLength: [
              '$switchKey',
              {
                small: 100,
                medium: 500,
                large: 1000,
              },
              100,
              ['$value', 'size'],
            ],
            validation: [
              '$switchKey',
              {
                small: smallTextValidation,
                medium: mediumTextValidation,
                large: largeTextValidation,
              },
              smallTextValidation,
              ['$value', 'size'],
            ],
          },
        },
      }

      const expectations = [
        [{}, 100, smallTextValidation],
        [{ size: 'small' }, 100, smallTextValidation],
        [{ size: 'medium' }, 500, mediumTextValidation],
        [{ size: 'large' }, 1000, largeTextValidation],
      ]

      expectations.forEach(([input, textMaxLength, textValidation]) => {
        const resolved = resolveSchema(schema, input)

        expect(resolved.properties.text.maxLength).toEqual(textMaxLength)
        expect(resolved.properties.text.validation).toEqual(textValidation)
      })
    })

    test('`items`', () => {
      const schemasBySize = {
        small: {
          type: 'string',
          maxLength: [
            '$switch',
            [
              [['$stringStartsWith', 'prefix-1-'], 200],
              [['$stringStartsWith', 'prefix-2-'], 300],
              [['$stringStartsWith', 'prefix-3-'], 400],
            ],
            100,
          ],
        },
        medium: {
          type: 'string',
          maxLength: 500,
        },
        large: {
          type: 'string',
          maxLength: 1000,
        },
      }

      const schema = {
        type: 'object',
        properties: {
          size: {
            type: 'string',
            enum: ['small', 'medium', 'large'],
          },
          items: {
            type: 'array',
            items: [
              '$switchKey',
              schemasBySize,
              schemasBySize.small,
              ['$value', 'size'],
            ],
          },
        },
      }

      const expectations = [
        [{}, schemasBySize.small],
        [{ size: 'small' }, schemasBySize.small],
        [{ size: 'medium' }, schemasBySize.medium],
        [{ size: 'large' }, schemasBySize.large],
      ]

      expectations.forEach(([input, result]) => {
        const resolved = resolveSchema(schema, input)

        expect(resolved.properties.items.items).toEqual(result)
      })
    })
  })
})
