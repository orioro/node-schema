import {
  ENUM,
  STRING_MIN_LENGTH,
  STRING_MAX_LENGTH,
  NUMBER_MIN,
  NUMBER_MAX,
  NUMBER_MULTIPLE_OF,
  // ARRAY_MAX_LENGTH,
  // ARRAY_MIN_LENGTH,
  // ARRAY_UNIQUE_ITEMS,
  parseValidationCases,
} from './parseValidationCases'

describe('common', () => {
  test('ENUM', () => {
    const schema = {
      type: 'string',
      enum: ['A', 'B', 'C'],
    }
    const cases = parseValidationCases(schema, [ENUM])

    expect(cases).toMatchObject([
      [['$in', ['A', 'B', 'C']], { code: 'ENUM_ERROR' }],
    ])
  })
})

test('string', () => {
  const schema = {
    type: 'string',
    minLength: 5,
    maxLength: 10,
  }
  const cases = parseValidationCases(schema, [
    STRING_MIN_LENGTH,
    STRING_MAX_LENGTH,
  ])

  expect(cases).toMatchObject([
    [['$gte', 5, ['$stringLength']], { code: 'STRING_MIN_LENGTH_ERROR' }],
    [['$lte', 10, ['$stringLength']], { code: 'STRING_MAX_LENGTH_ERROR' }],
  ])
})

describe('number', () => {
  const resolvers = [NUMBER_MIN, NUMBER_MAX, NUMBER_MULTIPLE_OF]

  test('NUMBER_MIN, NUMBER_MAX, NUMBER_MULTIPLE_OF', () => {
    expect(
      parseValidationCases(
        {
          type: 'number',
          min: 10,
          max: 100,
          multipleOf: 5,
        },
        resolvers
      )
    ).toMatchObject([
      [['$gte', 10], { code: 'NUMBER_MIN_ERROR' }],
      [['$lte', 100], { code: 'NUMBER_MAX_ERROR' }],
      [['$eq', 0, ['$mathMod', 5]], { code: 'NUMBER_MULTIPLE_OF_ERROR' }],
    ])
  })
})
