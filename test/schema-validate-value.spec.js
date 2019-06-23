import {
  schemaValidateValue,
  ValidationError
} from '../src'

import { shouldThrow } from './util'

describe('schemaValidateValue(options, schema, value)', () => {
  describe('TYPE_MAP', () => {
    const SCHEMA = {
      type: 'map',
      required: {
        message: 'This value is required',
      },
      attributes: {
        title: {
          type: 'text',
          required: true,
        },
        description: {
          type: 'richText',
          required: true,
        },
        place: {
          type: 'map',
          attributes: {
            name: {
              type: 'text',
              required: true,
            },
            address: {
              type: 'map',
              attributes: {
                line_1: {
                  type: 'text',
                  validation: {
                    stringMinLength: {
                      length: 10,
                      message: 'Must be at least 10 chars length',
                    },
                    stringMaxLength: {
                      length: 15,
                      message: 'Must be at most 15 chars length',
                    }
                  }
                },
              },
              required: true
            }
          }
        }
      },
    }

    test('non recursive - succeed', () => {
      const VALUE = {}
      return expect(schemaValidateValue({}, SCHEMA, VALUE)).resolves.toEqual(true)
    })

    test('non recursive - fail', () => {
      expect.assertions(3)

      const VALUE = undefined
      return schemaValidateValue({}, SCHEMA, VALUE)
        .then(shouldThrow, err => {
          expect(err).toBeInstanceOf(ValidationError)
          expect(err.errors).toHaveLength(1)
          expect(err.errors[0].message).toEqual('This value is required')
        })
    })

    test('recursive - succeed', () => {
      const VALUE = {
        title: 'Some title',
        description: 'Lorem ipsum dolor',
      }
      return expect(schemaValidateValue({ recursive: true }, SCHEMA, VALUE)).resolves.toEqual(true)
    })

    test('recursive - succeed', () => {
      const VALUE = {
        title: 'Some title',
        description: 'Lorem ipsum dolor',
        place: {
          name: 'Somewhere',
          address: {
            line_1: '1234567891'
          }
        }
      }
      return expect(schemaValidateValue({ recursive: true }, SCHEMA, VALUE)).resolves.toEqual(true)
    })

    test('recursive - fail deep', () => {
      expect.assertions(6)

      const VALUE = {
        title: 'Some title',
        description: 'Lorem ipsum dolor',
        place: {
          name: 'Somewhere',
          address: {
            line_1: '1234567'
          }
        }
      }
      return schemaValidateValue({ recursive: true }, SCHEMA, VALUE)
        .then(shouldThrow, err => {
          expect(err).toBeInstanceOf(ValidationError)
          expect(err.errors).toHaveLength(4)
          expect(err.errors[0].message).toEqual('Validation `objectProperties` failed.')
          expect(err.errors[1].message).toEqual('Validation `objectProperties` failed.')
          expect(err.errors[2].message).toEqual('Validation `objectProperties` failed.')
          expect(err.errors[3].message).toEqual('Must be at least 10 chars length')
        })
    })
  })

  describe('custom type', () => {
    const SCHEMA = {
      label: 'Title',
      type: 'text',
      required: true
    }

    test('expect to throw error if the type is unknown', () => {
      expect(() => {
        schemaValidateValue({}, SCHEMA, 'Some text')
      }).toThrow('Invalid schema.type `text`')
    })

    test('succeed - ignored as OTHER_TYPES', () => {
      expect.assertions(3)

      return Promise.all([
        // As string
        expect(schemaValidateValue({
          OTHER_TYPES: ['text']
        }, SCHEMA, 'Some text')).resolves.toEqual(true),
        // As number
        expect(schemaValidateValue({
          OTHER_TYPES: ['text']
        }, SCHEMA, 123)).resolves.toEqual(true),
        // As object
        expect(schemaValidateValue({
          OTHER_TYPES: ['text']
        }, SCHEMA, { key: 'value' })).resolves.toEqual(true),
      ])
    })

    test('fail - ignored as OTHER_TYPES but still required', () => {
      expect.assertions(6)

      return Promise.all([
        // As undefined
        schemaValidateValue({
          OTHER_TYPES: ['text'],
          onError: 'returnError'
        }, SCHEMA, undefined),
        // AS null
        schemaValidateValue({
          OTHER_TYPES: ['text'],
          onError: 'returnError'
        }, SCHEMA, null),
      ])
      .then(([error1, error2]) => {
        expect(error1).toBeInstanceOf(ValidationError)
        expect(error1.errors).toHaveLength(1)
        expect(error1.errors[0].message).toEqual('Title is required')

        expect(error2).toBeInstanceOf(ValidationError)
        expect(error2.errors).toHaveLength(1)
        expect(error2.errors[0].message).toEqual('Title is required')
      })
    })

    test('succeed - mapped to STRING_TYPES', () => {
      expect.assertions(1)

      return Promise.all([
        expect(schemaValidateValue({
          STRING_TYPES: ['text']
        }, SCHEMA, 'Some text')).resolves.toEqual(true),
      ])
    })

    test('fail - mapped to STRING_TYPES', () => {
      expect.assertions(6)

      return Promise.all([
        // As number
        schemaValidateValue({
          STRING_TYPES: ['text'],
          onError: 'returnError'
        }, SCHEMA, 123),
        // As object
        schemaValidateValue({
          STRING_TYPES: ['text'],
          onError: 'returnError'
        }, SCHEMA, { key: 'value' }),
      ])
      .then(([error1, error2]) => {
        expect(error1).toBeInstanceOf(ValidationError)
        expect(error1.errors).toHaveLength(1)
        expect(error1.errors[0].message).toEqual('Title must be a string')

        expect(error2).toBeInstanceOf(ValidationError)
        expect(error2.errors).toHaveLength(1)
        expect(error2.errors[0].message).toEqual('Title must be a string')
      })
    })
  })
})
