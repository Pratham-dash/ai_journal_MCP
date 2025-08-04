{
  "openapi": "3.0.0",
  "info": {
    "title": "AI-Powered Productivity Journal API",
    "version": "1.0.0",
    "description": "Transform mental clutter into clear action plans with AI-powered analysis"
  },
  "paths": {
    "/": {
      "get": {
        "summary": "GET /",
        "responses": {
          "200": {
            "description": "Successful operation"
          }
        }
      }
    },
    "/api/mental-dumps": {
      "post": {
        "summary": "POST /api/mental-dumps",
        "responses": {
          "200": {
            "description": "Successful operation"
          }
        }
      },
      "get": {
        "summary": "GET /api/mental-dumps",
        "responses": {
          "200": {
            "description": "Successful operation"
          }
        }
      }
    },
    "/api/mental-dumps/{id}": {
      "get": {
        "summary": "GET /api/mental-dumps/{id}",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Successful operation"
          }
        }
      }
    },
    "/api/mental-dumps/{id}/generate-questions": {
      "post": {
        "summary": "POST /api/mental-dumps/{id}/generate-questions",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Successful operation"
          }
        }
      }
    },
    "/api/questions/{id}/answer": {
      "post": {
        "summary": "POST /api/questions/{id}/answer",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Successful operation"
          }
        }
      }
    },
    "/api/mental-dumps/{id}/questions": {
      "get": {
        "summary": "GET /api/mental-dumps/{id}/questions",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Successful operation"
          }
        }
      }
    },
    "/api/mental-dumps/{id}/generate-plan": {
      "post": {
        "summary": "POST /api/mental-dumps/{id}/generate-plan",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Successful operation"
          }
        }
      }
    },
    "/api/action-plans": {
      "get": {
        "summary": "GET /api/action-plans",
        "responses": {
          "200": {
            "description": "Successful operation"
          }
        }
      }
    },
    "/api/action-plans/{id}": {
      "put": {
        "summary": "PUT /api/action-plans/{id}",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Successful operation"
          }
        }
      }
    },
    "/api/action-items/{id}/complete": {
      "put": {
        "summary": "PUT /api/action-items/{id}/complete",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Successful operation"
          }
        }
      }
    },
    "/api/action-items/{id}/progress": {
      "post": {
        "summary": "POST /api/action-items/{id}/progress",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Successful operation"
          }
        }
      }
    },
    "/api/analytics/productivity": {
      "get": {
        "summary": "GET /api/analytics/productivity",
        "responses": {
          "200": {
            "description": "Successful operation"
          }
        }
      }
    },
    "/api/analytics/energy-patterns": {
      "get": {
        "summary": "GET /api/analytics/energy-patterns",
        "responses": {
          "200": {
            "description": "Successful operation"
          }
        }
      }
    },
    "/openapi.json": {
      "get": {
        "summary": "GET /openapi.json",
        "responses": {
          "200": {
            "description": "Successful operation"
          }
        }
      }
    }
  }
} 
