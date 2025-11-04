import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CSV Conversion API',
      version: '1.0.0',
      description: 'A comprehensive RESTful API for converting CSV files to and from multiple data formats (JSON, XML, YAML, SQL, Excel, HTML, TSV, KML, TXT, Markdown, JSONL, NDJSON, ICS, TOML)',
      contact: {
        name: 'ToolBox API',
        url: 'https://github.com/jomardyan/ToolBox',
      },
      license: {
        name: 'MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: 'http://0.0.0.0:3000',
        description: 'Local network server',
      },
    ],
    components: {
      schemas: {
        ConversionRequest: {
          type: 'object',
          required: ['data', 'sourceFormat', 'targetFormat'],
          properties: {
            data: {
              type: 'string',
              description: 'The data to convert',
              example: 'name,age\nJohn,30\nJane,28',
            },
            sourceFormat: {
              type: 'string',
              enum: [
                'csv',
                'json',
                'xml',
                'yaml',
                'html',
                'table',
                'tsv',
                'kml',
                'txt',
                'markdown',
                'jsonl',
                'ndjson',
                'lines',
                'ics',
                'toml',
                'excel',
                'sql',
              ],
              description: 'The source format of the data',
              example: 'csv',
            },
            targetFormat: {
              type: 'string',
              enum: [
                'csv',
                'json',
                'xml',
                'yaml',
                'html',
                'table',
                'tsv',
                'kml',
                'txt',
                'markdown',
                'jsonl',
                'ndjson',
                'lines',
                'ics',
                'toml',
                'excel',
                'sql',
              ],
              description: 'The target format for conversion',
              example: 'json',
            },
            options: {
              type: 'object',
              description: 'Optional conversion options',
              example: {},
            },
          },
        },
        ConversionResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'string',
              description: 'The converted data',
              example: '[{"name":"John","age":"30"},{"name":"Jane","age":"28"}]',
            },
            statusCode: {
              type: 'integer',
              example: 200,
            },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'string',
              description: 'Error message',
              example: 'Invalid format',
            },
            statusCode: {
              type: 'integer',
              example: 400,
            },
          },
        },
        BatchConversionRequest: {
          type: 'object',
          required: ['items'],
          properties: {
            items: {
              type: 'array',
              description: 'Array of conversion requests',
              items: {
                $ref: '#/components/schemas/ConversionRequest',
              },
              minItems: 1,
              maxItems: 100,
            },
          },
        },
        BatchConversionResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
            },
            data: {
              type: 'object',
              properties: {
                results: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      index: {
                        type: 'integer',
                      },
                      success: {
                        type: 'boolean',
                      },
                      data: {
                        type: 'string',
                      },
                      error: {
                        type: 'string',
                      },
                    },
                  },
                },
                summary: {
                  type: 'object',
                  properties: {
                    total: {
                      type: 'integer',
                    },
                    successful: {
                      type: 'integer',
                    },
                    failed: {
                      type: 'integer',
                    },
                  },
                },
              },
            },
            statusCode: {
              type: 'integer',
            },
          },
        },
        ColumnExtractionRequest: {
          type: 'object',
          required: ['csvData', 'columns'],
          properties: {
            csvData: {
              type: 'string',
              description: 'CSV data to extract columns from',
              example: 'name,age,email\nJohn,30,john@example.com\nJane,28,jane@example.com',
            },
            columns: {
              type: 'array',
              description: 'Column names to extract',
              items: {
                type: 'string',
              },
              example: ['name', 'email'],
            },
            filterOptions: {
              type: 'array',
              description: 'Optional filters to apply',
              items: {
                type: 'object',
                properties: {
                  column: {
                    type: 'string',
                  },
                  value: {
                    type: 'string',
                  },
                  operator: {
                    type: 'string',
                    enum: ['equals', 'contains', 'startsWith', 'endsWith'],
                  },
                },
              },
            },
          },
        },
        PresetRequest: {
          type: 'object',
          required: ['name', 'sourceFormat', 'targetFormat'],
          properties: {
            name: {
              type: 'string',
              minLength: 1,
              maxLength: 100,
              description: 'Preset name',
              example: 'CSV to JSON',
            },
            sourceFormat: {
              type: 'string',
              description: 'Source format',
              example: 'csv',
            },
            targetFormat: {
              type: 'string',
              description: 'Target format',
              example: 'json',
            },
            description: {
              type: 'string',
              description: 'Preset description',
              example: 'Convert CSV data to JSON format',
            },
          },
        },
        Preset: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: '1234567890',
            },
            name: {
              type: 'string',
              example: 'CSV to JSON',
            },
            sourceFormat: {
              type: 'string',
              example: 'csv',
            },
            targetFormat: {
              type: 'string',
              example: 'json',
            },
            description: {
              type: 'string',
              example: 'Convert CSV data to JSON format',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        HealthResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'object',
              properties: {
                status: {
                  type: 'string',
                  example: 'healthy',
                },
                timestamp: {
                  type: 'string',
                  format: 'date-time',
                },
                uptime: {
                  type: 'number',
                  example: 12345.67,
                },
              },
            },
            statusCode: {
              type: 'integer',
              example: 200,
            },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.ts', './src/index.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
