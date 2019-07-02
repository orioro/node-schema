import { schemaParseValue } from '../src'

describe('schemaParseValue(options, schema, value)', () => {
  test('text defaults', () => {
    expect(schemaParseValue({
      STRING_TYPES: ['text'],
    }, {
      type: 'text',
      default: 'Some default text'
    }, undefined)).toEqual('Some default text')
  })

  test('recursive map defaults', () => {
    const PERSON_SCHEMA = {
      type: 'map',
      attributes: {
        name: {
          type: 'text',
          default: 'João'
        },
        address: {
          type: 'map',
          attributes: {
            line_1: {
              type: 'text',
              default: 'Rua Teste, 123'
            },
            line_2: {
              type: 'text',
            }
          }
        }
      }
    }

    expect(schemaParseValue({
      STRING_TYPES: ['text'],
      recursive: true
    }, PERSON_SCHEMA, undefined)).toEqual({
      name: 'João',
      address: {
        line_1: 'Rua Teste, 123',
        line_2: ''
      }
    })
  })

  test('recursive map omits unknown attributes', () => {
    const PERSON_SCHEMA = {
      type: 'map',
      attributes: {
        name: {
          type: 'text',
          default: 'João'
        }
      }
    }

    expect(schemaParseValue({
      STRING_TYPES: ['text'],
      recursive: true
    }, PERSON_SCHEMA, {
      name: 'João',
      unknownProp1: 'value 1',
      unknownProp2: {
        line_1: 'Rua Teste, 123'
      }
    })).toEqual({
      name: 'João',
    })
  })

  test('recursive list defaults', () => {
    const PERSON_SCHEMA = {
      type: 'map',
      attributes: {
        name: {
          type: 'text',
          default: 'João'
        },
        address: {
          type: 'map',
          attributes: {
            line_1: {
              type: 'text',
              default: 'Rua Teste, 123'
            },
            line_2: {
              type: 'text',
            }
          }
        }
      }
    }

    const PEOPLE_SCHEMA = {
      type: 'list',
      item: PERSON_SCHEMA
    }

    expect(schemaParseValue({ recursive: true }, PEOPLE_SCHEMA, [undefined])).toEqual([
      {
        name: 'João',
        address: {
          line_1: 'Rua Teste, 123'
        }
      }
    ])
  })
})
