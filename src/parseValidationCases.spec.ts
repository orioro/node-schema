import {
  ENUM,
  parseValidationCases
} from './parseValidationCases'

describe('common', () => {
  test('ENUM', () => {
    const schema = {
      type: 'string',
      enum: ['A', 'B', 'C']
    }
    const cases = parseValidationCases(schema, {
      resolvers: [
        ENUM
      ]
    })

    expect(cases).toMatchObject([
      [
        ['$in', ['A', 'B', 'C']],
        { code: 'ENUM_ERROR' }
      ]
    ])
  })
})

test('string', () => {

})

test('number', () => {

})
