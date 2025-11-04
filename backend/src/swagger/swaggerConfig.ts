import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ToolBox SaaS API',
      version: '2.0.0',
      description: 'A comprehensive RESTful API for data conversion, authentication, subscriptions, and SaaS management. Supports CSV, JSON, XML, YAML, SQL, Excel, HTML, and more. Includes OAuth 2.0, 2FA, API key management, and billing.',
      contact: {
        name: 'ToolBox API Support',
        url: 'https://github.com/jomardyan/ToolBox',
        email: 'support@toolbox.com'
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
      {
        url: 'https://api.toolbox.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtained from login or OAuth'
        },
        apiKey: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description: 'API key for programmatic access'
        }
      },
      schemas: {
        // Authentication Schemas
        RegisterRequest: {
          type: 'object',
          required: ['email', 'password', 'firstName', 'lastName'],
          properties: {
            email: { type: 'string', format: 'email', example: 'user@example.com' },
            password: { type: 'string', minLength: 8, example: 'SecurePass123!' },
            firstName: { type: 'string', example: 'John' },
            lastName: { type: 'string', example: 'Doe' },
            companyName: { type: 'string', example: 'Acme Corp' }
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'user@example.com' },
            password: { type: 'string', example: 'SecurePass123!' }
          }
        },
        AuthResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'object',
              properties: {
                user: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    email: { type: 'string' },
                    firstName: { type: 'string' },
                    lastName: { type: 'string' },
                    role: { type: 'string', enum: ['USER', 'ADMIN'] }
                  }
                },
                tokens: {
                  type: 'object',
                  properties: {
                    accessToken: { type: 'string' },
                    refreshToken: { type: 'string' }
                  }
                }
              }
            },
            statusCode: { type: 'integer', example: 200 }
          }
        },
        // Subscription Schemas
        SubscriptionPlan: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string', example: 'Pro Plan' },
            description: { type: 'string' },
            price: { type: 'number', example: 29.99 },
            currency: { type: 'string', example: 'usd' },
            billingPeriod: { type: 'string', enum: ['monthly', 'yearly'] },
            features: { type: 'object' },
            rateLimit: { type: 'integer', example: 10000 },
            monthlyLimit: { type: 'integer', example: 100000 }
          }
        },
        Subscription: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            userId: { type: 'string' },
            planId: { type: 'string' },
            status: { type: 'string', enum: ['ACTIVE', 'CANCELLED', 'PENDING'] },
            currentPeriodStart: { type: 'string', format: 'date-time' },
            currentPeriodEnd: { type: 'string', format: 'date-time' },
            plan: { $ref: '#/components/schemas/SubscriptionPlan' }
          }
        },
        // API Key Schemas
        ApiKey: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string', example: 'Production API Key' },
            keyPrefix: { type: 'string', example: 'tb_12345' },
            createdAt: { type: 'string', format: 'date-time' },
            lastUsedAt: { type: 'string', format: 'date-time' },
            isActive: { type: 'boolean' }
          }
        },
        CreateApiKeyResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                key: { type: 'string', description: 'Full API key - save it now!' },
                keyPrefix: { type: 'string' }
              }
            },
            message: { type: 'string' },
            statusCode: { type: 'integer', example: 201 }
          }
        },
        // Usage Schemas
        UsageSummary: {
          type: 'object',
          properties: {
            totalCalls: { type: 'integer', example: 1523 },
            successfulCalls: { type: 'integer', example: 1498 },
            failedCalls: { type: 'integer', example: 25 },
            totalCost: { type: 'number', example: 12.45 },
            topEndpoints: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  endpoint: { type: 'string' },
                  count: { type: 'integer' }
                }
              }
            }
          }
        },
        QuotaStatus: {
          type: 'object',
          properties: {
            used: { type: 'integer', example: 1523 },
            limit: { type: 'integer', example: 10000 },
            remaining: { type: 'integer', example: 8477 },
            resetDate: { type: 'string', format: 'date-time' },
            percentUsed: { type: 'number', example: 15.23 }
          }
        },
        // Billing Schemas
        Invoice: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            amount: { type: 'number', example: 29.99 },
            currency: { type: 'string', example: 'usd' },
            status: { type: 'string', enum: ['PAID', 'PENDING', 'FAILED', 'REFUNDED'] },
            createdAt: { type: 'string', format: 'date-time' },
            paidAt: { type: 'string', format: 'date-time' },
            description: { type: 'string' }
          }
        },
        PaymentMethod: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            type: { type: 'string', enum: ['CARD', 'BANK_ACCOUNT'] },
            lastFour: { type: 'string', example: '4242' },
            brand: { type: 'string', example: 'visa' },
            expiryMonth: { type: 'integer', example: 12 },
            expiryYear: { type: 'integer', example: 2025 },
            isDefault: { type: 'boolean' }
          }
        },
        // 2FA Schemas
        TwoFactorSetup: {
          type: 'object',
          properties: {
            secret: { type: 'string' },
            qrCode: { type: 'string', description: 'Data URL for QR code image' },
            backupCodes: {
              type: 'array',
              items: { type: 'string' }
            }
          }
        },
        // Account Schemas
        UserProfile: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string', format: 'email' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            companyName: { type: 'string' },
            avatar: { type: 'string' },
            phone: { type: 'string' },
            address: { type: 'string' },
            city: { type: 'string' },
            state: { type: 'string' },
            postalCode: { type: 'string' },
            country: { type: 'string' },
            emailVerified: { type: 'boolean' },
            twoFactorEnabled: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        // Admin Schemas
        UserList: {
          type: 'object',
          properties: {
            users: {
              type: 'array',
              items: { $ref: '#/components/schemas/UserProfile' }
            },
            total: { type: 'integer' },
            page: { type: 'integer' },
            pageSize: { type: 'integer' },
            totalPages: { type: 'integer' }
          }
        },
        Analytics: {
          type: 'object',
          properties: {
            totalUsers: { type: 'integer' },
            activeUsers: { type: 'integer' },
            totalRevenue: { type: 'number' },
            mrr: { type: 'number' },
            activeSubscriptions: { type: 'integer' }
          }
        },
        // Conversion Schemas (existing)
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
      tags: [
        { name: 'Authentication', description: 'User authentication and session management' },
        { name: 'OAuth', description: 'OAuth 2.0 authentication (Google, GitHub)' },
        { name: '2FA', description: 'Two-factor authentication management' },
        { name: 'Account', description: 'User account and profile management' },
        { name: 'Subscription', description: 'Subscription and plan management' },
        { name: 'Billing', description: 'Billing, invoices, and payment methods' },
        { name: 'API Keys', description: 'API key management' },
        { name: 'Usage', description: 'API usage tracking and quotas' },
        { name: 'Conversion', description: 'Data format conversion' },
        { name: 'Extraction', description: 'Data extraction utilities' },
        { name: 'Presets', description: 'Conversion presets' },
        { name: 'Admin - Users', description: 'Admin user management' },
        { name: 'Admin - Plans', description: 'Admin plan management' },
        { name: 'Admin - Analytics', description: 'Admin analytics and reporting' },
        { name: 'Webhooks', description: 'Stripe webhook handlers' },
        { name: 'Health', description: 'Health check and system status' }
      ]
    },
  },
  apis: ['./src/routes/*.ts', './src/routes/admin/*.ts', './src/index.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
