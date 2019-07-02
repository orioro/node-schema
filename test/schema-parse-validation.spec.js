import {
  schemaParseValidation,
} from '../src/schema-parse-validation'

describe('schemaParseValidation(options, schema)', () => {

  test('not recursive', () => {
    const SCHEMA = {
      label: 'Document',
      type: 'map',
      required: true,
      attributes: {
        title: {
          type: 'text',
          required: true,
        },
        description: {
          type: 'richText',
          required: true,
        },
      }
    }

    expect(schemaParseValidation({ recursive: false }, SCHEMA)).toEqual({
      notNull: {
        message: 'Document is required',
      },
      notUndefined: {
        message: 'Document is required',
      },
      objectPlain: {
        message: 'Document must be a plain object'
      }
    })
  })

  test('recursive map', () => {
    const SCHEMA = {
      type: 'map',
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
                    },
                    stringMaxLength: {
                      length: 500,
                    }
                  }
                },
              },
              required: true
            }
          }
        }
      },
      validation: {
        objectPlain: {
          message: 'must be a plain object'
        }
      }
    }

    const validation = schemaParseValidation({ recursive: true }, SCHEMA)

    const REQUIRED_VALIDATION = {
      notNull: {
        message: 'Value is required',
      },
      notUndefined: {
        message: 'Value is required'
      }
    }

    const PLAIN_OBJECT_VALIDATION = {
      objectPlain: {
        message: 'Value must be a plain object',
      }
    }

    expect(validation).toMatchSnapshot()
    expect(validation).toEqual({
      objectProperties: {
        properties: {
          title: {
            ...REQUIRED_VALIDATION
          },
          description: {
            ...REQUIRED_VALIDATION,
          },
          place: {
            ...PLAIN_OBJECT_VALIDATION,
            objectProperties: {
              properties: {
                name: {
                  ...REQUIRED_VALIDATION,
                },
                address: {
                  ...PLAIN_OBJECT_VALIDATION,
                  ...REQUIRED_VALIDATION,
                  objectProperties: {
                    properties: {
                      line_1: {
                        stringMinLength: {
                          length: 10,
                        },
                        stringMaxLength: {
                          length: 500,
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      objectPlain: {
        message: 'must be a plain object'
      }
    })

    // console.log(JSON.stringify(validation, null, '  '))
  })

  test('recursive list', () => {
    const SCHEMA = {
      type: 'map',
      attributes: {
        list_of_addresses: {
          type: 'list',
          item: {
            type: 'map',
            attributes: {
              line_1: {
                type: 'text',
                required: true,
                validation: {
                  stringMinLength: {
                    length: 10,
                    message: 'Line 1 at least 10',
                  }
                }
              },
              line_2: {
                type: 'text',
                required: true
              },
              comments: {
                type: 'list',
                item: {
                  type: 'map',
                  attributes: {
                    author: {
                      type: 'text',
                      required: true,
                    },
                    contents: {
                      type: 'richText',
                      required: true,
                    },
                  }
                },
                validation: {
                  arrayMaxLength: {
                    length: 10,
                    message: 'At most 10 comments per address',
                  }
                }
              }
            }
          }
        }
      }
    }

    const validation = schemaParseValidation({ recursive: true }, SCHEMA)
    expect(validation).toMatchSnapshot()

    // console.log(JSON.stringify(validation, null, '  '))
  })

  test('conditionals', () => {
    const SCHEMA = {
      type: 'map',
      attributes: {
        name: {
          type: 'string',
        },
        age: {
          type: 'number',
        },
        legalResponsible: {
          type: 'string',
        }
      },
      conditionals: [
        {
          criteria: {
            age: {
              $lt: 18
            }
          },
          attributes: {
            legalResponsible: {
              required: true,
            }
          }
        }
      ]
    }

    const validation = schemaParseValidation({ recursive: true }, SCHEMA)

    // console.log(JSON.stringify(validation, null, '  '))
  })

  test('conditionals - 2', () => {
    const SCHEMA = {
      type: 'number',
      conditionals: [
        {
          criteria: {
            $gt: 10
          },
          validation: {
            numberMultipleOf: {
              base: 15,
            }
          }
        }
      ]
    }

    const validation = schemaParseValidation({ recursive: false }, SCHEMA)

    // console.log(JSON.stringify(validation, null, '  '))
  })
})
