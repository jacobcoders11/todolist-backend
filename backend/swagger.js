const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Swagger definition - Basic info about your API
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'TodoList API Documentation',
    version: '1.0.0',
    description: 'API documentation for TodoList application with authentication',
    contact: {
      name: 'TodoList Team',
    },
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'Development server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT token in the format: your-token-here',
      },
    },
  },
};

// Options for swagger-jsdoc
const options = {
  swaggerDefinition,
  // Path to the API routes files where @swagger comments are
  apis: ['./routes/*.js'],
};

// Initialize swagger-jsdoc
const swaggerSpec = swaggerJsdoc(options);

// Function to setup Swagger
function setupSwagger(app) {
  // Serve swagger documentation at /api-docs
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
  }));
  
  console.log('Swagger documentation available at http://localhost:5000/api-docs');
}

module.exports = setupSwagger;