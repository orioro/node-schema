import { ENUM, parseValidationCases } from './parseValidationCases'

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

test.skip('string', () => {}) // eslint-disable-line

test.skip('number', () => {}) // eslint-disable-line
