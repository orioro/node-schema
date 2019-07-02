import {
  schemaParse,
} from '../src'

describe('schemaParse', () => {
  test('', () => {
    const ATTACHMENT_SCHEMA = {
      label: 'Attachment',
      type: 'map',
      attributes: {
        title: {
          type: 'string',
        },
        kind: {
          type: 'string',
          options: ['website', 'file']
        },
        websiteUrl: {
          type: 'string',
          hidden: true
        },
        fileId: {
          type: 'string',
          hidden: true
        }
      },
      conditionals: [
        {
          criteria: {
            kind: 'website',
          },
          attributes: {
            websiteUrl: {
              required: true,
              hidden: false
            }
          }
        },
        {
          criteria: {
            kind: 'file',
          },
          attributes: {
            fileId: {
              required: true,
              hidden: false,
            }
          }
        }
      ]
    }

    const EMAIL_SCHEMA = {
      type: 'map',
      attributes: {
        subject: {
          type: 'string',
        },
        from: {
          type: 'string',
        },
        to: {
          type: 'string',
        },
        attachments: {
          type: 'list',
          item: ATTACHMENT_SCHEMA,
        }
      }
    }

    const options = { recursive: true }
    const parsedAttachmentSchema = schemaParse(options, ATTACHMENT_SCHEMA, {
      kind: 'file'
    })
    // console.log(JSON.stringify(parsedAttachmentSchema, null, '  '))

    const parsedEmailSchema = schemaParse(options, EMAIL_SCHEMA, undefined)
    // console.log(JSON.stringify(parsedEmailSchema, null, '  '))
  })
})
