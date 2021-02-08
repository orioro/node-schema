import {
  resolveSchema,
  schemaResolverObject,
  schemaResolverArray,
  schemaResolverFunction
} from './resolveSchema'
import { groupBy } from 'lodash'

const cities = [
  { name: 'São Paulo', state: 'SP' },
  { name: 'Santos', state: 'SP' },
  { name: 'Ribeirão Preto', state: 'SP' },
  { name: 'Rio de Janeiro', state: 'RJ' },
  { name: 'Angra dos Reis', state: 'RJ' },
  { name: 'Belo Horizonte', state: 'MG' },
  { name: 'Ouro Preto', state: 'MG' }
]
const states = ['SP', 'RJ', 'MG']
const citiesByState = groupBy(cities, 'state')

describe('resolveSchema(schema, context) - using schemaResolverFunction', () => {
  test('', () => {
    const schema = {
      type: 'map',
      properties: {
        state: {
          type: 'string',
          options: states
        },
        city: {
          type: 'string',
          options: value => (citiesByState[value.state] || [])
        }
      }
    }

    const expected = [
      [{}, []],
      [{ state: null }, []],
      [{ state: 'RJ' }, citiesByState.RJ],
      [{ state: 'SP' }, citiesByState.SP],
      [{ state: 'MG' }, citiesByState.MG],
    ]

    expected.forEach(([value, expectedOptions]) => {
      expect(resolveSchema(schema, {
        value,
        resolvers: [
          schemaResolverFunction(),
          schemaResolverObject(),
          schemaResolverArray(),
        ]
      }).properties.city.options)
      .toEqual(expectedOptions)
    })
  })
})

describe('resolveSchema(schema, context) - using expressions', () => {
  test('example: conditional options', () => {
    const schema = {
      type: 'map',
      properties: {
        state: {
          type: 'string',
          options: states
        },
        city: {
          type: 'string',
          options: [
            '$switchKey',
            citiesByState,
            [],
            ['$value', 'state']
          ]
        }
      }
    }

    const expected = [
      [{}, []],
      [{ state: null }, []],
      [{ state: 'RJ' }, citiesByState.RJ],
      [{ state: 'SP' }, citiesByState.SP],
      [{ state: 'MG' }, citiesByState.MG],
    ]

    expected.forEach(([value, expectedOptions]) => {
      expect(resolveSchema(schema, { value }).properties.city.options)
        .toEqual(expectedOptions)
    })
  })

  test('nested option resolution', () => {
    const schema = {
      type: 'map',
      properties: {
        key1: { type: 'string' },
        key2: { type: 'string' },
        key3: {
          type: 'string',
          options: [
            '$switchKey',
            {
              valueA: ['A-OPT1', 'A-OPT2', ['$stringConcat', '-A-OPT3', ['$value', 'key1']]],
              valueB: [
                '$arrayMap',
                ['$stringConcat', ['$value'], ['$value', '$$PARENT_SCOPE.$$VALUE.key1']],
                ['-B-OPT1', '-B-OPT2']
              ],
            },
            [],
            ['$value', 'key2']
          ]
        }
      }
    }

    const expected = [
      [{}, []],
      [
        { key1: 'key1-value', key2: 'valueA' },
        ['A-OPT1', 'A-OPT2', 'key1-value-A-OPT3']
      ],
      [
        { key1: 'key1-value', key2: 'valueB' },
        ['key1-value-B-OPT1', 'key1-value-B-OPT2']
      ]
    ]

    expected.forEach(([input, expectedOptions]) => {
      expect(resolveSchema(schema, { value: input }).properties.key3.options)
        .toEqual(expectedOptions)
    })
  })
})
