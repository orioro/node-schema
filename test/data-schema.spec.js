import { dataSchema, ValidationError } from '../src'
import { shouldThrow } from './util'

describe('dataSchema(options)', () => {
  const { parseValue, validateValue, parseAndValidateValue } = dataSchema({
    STRING_TYPES: ['text', 'richText'],
    MAP_TYPES: ['dataModel'],
  })

  const SCHEMA = {
    type: 'dataModel',
    attributes: {
      title: {
        type: 'richText',
        required: true,
      },
    }
  }

  test('parseValue(schema, value)', () => {
    expect(parseValue(SCHEMA, {})).toEqual({
      // Not recursive
    })
  })

  test('parseValue(schema, value, { recursive: true })', () => {
    expect(parseValue(SCHEMA, {}, { recursive: true })).toEqual({
      title: ''
    })
  })

  describe('validateValue', () => {
    test('validateValue(schema, value)', () => {
      return expect(validateValue(SCHEMA, {})).resolves.toEqual(true)
    })

    test('validateValue(schema, value)', () => {
      expect.assertions(3)

      return validateValue(SCHEMA, 'NOT AN OBJECT')
        .then(shouldThrow, err => {
          expect(err).toBeInstanceOf(ValidationError)
          expect(err.errors).toHaveLength(1)
          expect(err.errors[0].message).toEqual('Value must be a plain object')
        })
    })

    test('validateValue(schema, value, { recursive: true })', () => {
      return expect(validateValue(SCHEMA, {
        title: 'Some title',
      }, { recursive: true })).resolves.toEqual(true)
    })

    test('validateValue(schema, value, { recursive: true })', () => {
      expect.assertions(4)

      return validateValue(SCHEMA, {
        someOtherProperty: 'Some value',
      }, { recursive: true })
      .then(shouldThrow, err => {
        expect(err).toBeInstanceOf(ValidationError)
        expect(err.errors).toHaveLength(2)
        expect(err.errors[0].message).toEqual('Validation `objectProperties` failed.')
        expect(err.errors[1].message).toEqual('Value is required')
      })
    })
  })
})
