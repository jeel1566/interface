# n8n-interface

**A modern, open-source interface for managing your n8n instances.**

n8n-interface provides a clean, fast, and centralized dashboard to monitor and manage multiple n8n instances, whether they are self-hosted or on n8n.cloud. It's designed for developers, DevOps engineers, and power users who need a more efficient way to handle their automation workflows.

![Project Banner](https://user-images.githubusercontent.com/1068221/208325092-2b1f4a6c-927a-4548-959a-2d728a2f9583.png)

---

## 1. Project Overview

### Problem Solved

Managing multiple n8n instances can be cumbersome. Switching between browser tabs, re-authenticating, and keeping track of workflows and executions across different environments is inefficient and error-prone. n8n-interface solves this by providing a single pane of glass for all your n8n activities.

### Target Users

- **Developers & DevOps:** Quickly check the status of automation workflows, debug executions, and manage instances across development, staging, and production environments.
- **n8n Power Users:** Organize and monitor a large number of workflows without the clutter of the default n8n UI.
- **Teams:** (Future) Collaborate on workflows and manage access with per-seat subscriptions.

### Key Features

- **Centralized Dashboard:** Connect to and switch between multiple n8n instances seamlessly.
- **Workflow Management:** View, search, and filter all your workflows in one place.
- **Execution History:** Monitor workflow execution status, view logs, and get notified of failures.
- **Modern Tech Stack:** Built with FastAPI and React for a fast, responsive, and real-time user experience.
- **Secure:** Your n8n API keys are encrypted and stored securely in Supabase Vault, never exposed on the client-side.

---

## 2. Quick Start (5 Minutes)

Get the project up and running on your local machine in just 5 minutes.

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/n8n-interface.git
    cd n8n-interface
    ```

2.  **Install dependencies:**
    - **Backend (Python):**
      ```bash
      cd backend
      pip install -r requirements.txt
      cd ..
      ```
    - **Frontend (Node.js):**
      ```bash
      cd frontend
      npm install
      cd ..
      ```

### Environment Setup

The project uses environment variables for configuration.

1.  **Backend:**
    - Navigate to the `backend` directory: `cd backend`
    - Copy the example file: `cp .env.example .env`
    - Edit the `.env` file with your credentials (see [Configuration](#5-configuration) for details).

2.  **Frontend:**
    - Navigate to the `frontend` directory: `cd frontend`
    - Copy the example file: `cp .env.example .env`
    - Edit the `.env` file. `VITE_API_URL` should point to your backend.

### Local Development

1.  **Start services:** This project requires a Redis instance. Use the provided Docker Compose file to start one easily.
    ```bash
    docker-compose up -d redis
    ```

2.  **Start the backend server:**
    ```bash
    cd backend
    uvicorn main:app --reload --port 8000
    ```
    The API will be available at `http://localhost:8000`.

3.  **Start the frontend server:**
    ```bash
    cd frontend
    npm run dev
    ```
    The application will be available at `http://localhost:5173`.

### End-to-End Testing

1.  Open your browser and navigate to `http://localhost:5173`.
2.  (Future) On the "Settings" page, add a new n8n instance by providing its URL and API key.
3.  Navigate to the "Workflows" page. You should see a list of all workflows from the connected n8n instance.
4.  Navigate to the "History" page to see recent workflow executions.

---

## 3. Architecture

The application is built on a microservices architecture, ensuring scalability and separation of concerns.

### Diagram

```
+------+     (1) API Request     +---------+     (2) Enqueue Job     +-------+
| User | ----------------------> | FastAPI | ----------------------> | Redis |
+------+                         +---------+                         +-------+
  ^                                                                      | (3) Process Job
  | (6) Real-time UI Update                                              |
  |                                                                      v
+----------+     (5) Callback     +---------+     (4) API Call      +-----+
| Frontend | <------------------- | Webhook | <-------------------- | n8n |
+----------+                      +---------+                       +-----+
```

### Data Flow Explanation

1.  **API Request:** The user interacts with the React frontend, which sends API requests to the FastAPI backend (e.g., to fetch workflows).
2.  **Enqueue Job:** For long-running tasks like triggering a workflow, the backend enqueues a job in a Redis queue using Celery. This prevents blocking the API.
3.  **Process Job:** A Celery worker picks up the job and makes the necessary API call to the target n8n instance.
4.  **API Call to n8n:** The worker communicates with the n8n API to fetch data or trigger actions.
5.  **Webhook Callback:** n8n can be configured to send a webhook callback to a dedicated endpoint on the FastAPI backend upon workflow completion.
6.  **Real-time UI Update:** The backend processes the callback and can push a real-time update to the frontend (e.g., via WebSockets) to notify the user.

---

## 4. API Documentation

The API is built with FastAPI and provides automatically generated interactive documentation. While the local server is running, visit `http://localhost:8000/docs` to see the Swagger UI.

### Endpoints

#### Health Check

- **`GET /health`**
  - **Description:** Checks if the API service is running.
  - **Response (200 OK):**
    ```json
    {
      "status": "ok"
    }
    ```

#### Workflows

- **`GET /api/v1/workflows`**
  - **Description:** Retrieves a list of all workflows for a connected n8n instance.
  - **Response (200 OK):**
    ```json
    [
      {
        "id": "1",
        "name": "Sample Workflow",
        "active": true
      }
    ]
    ```

#### Executions

- **`GET /api/v1/executions`**
  - **Description:** Retrieves a list of all workflow executions.
  - **Response (200 OK):**
    ```json
    [
      {
        "id": "1",
        "workflowId": "1",
        "status": "success"
      }
    ]
    ```

### Error Codes

- **`404 Not Found`**: The requested resource or endpoint does not exist.
  ```json
  {
    "detail": "Not Found",
    "path": "/api/v1/non-existent-route"
  }
  ```
- **`422 Unprocessable Entity`**: The request body contains invalid data.
  ```json
  {
    "detail": "Validation Error",
    "errors": [
      {
        "loc": ["body", "email"],
        "msg": "value is not a valid email address",
        "type": "value_error.email"
      }
    ]
  }
  ```
- **`500 Internal Server Error`**: An unexpected error occurred on the server.
  ```json
  {
    "detail": "Internal Server Error"
  }
  ```

---

## 5. Configuration

### Environment Variables

- **`backend/.env`**
  - `SUPABASE_URL`: The URL of your Supabase project.
  - `SUPABASE_ANON_KEY`: The anonymous key for your Supabase project.
  - `SUPABASE_SERVICE_ROLE_KEY`: The service role key for elevated privileges.
  - `REDIS_URL`: The connection URL for your Redis instance (e.g., `redis://redis:6379/0`).
  - `JWT_SECRET`: A secret key for encoding JWTs (used for future authentication features).
  - `N8N_API_BASE_URL`: A default base URL for an n8n instance.
  - `FRONTEND_URL`: The URL of the frontend application for CORS (e.g., `http://localhost:5173`).
  - `PRODUCTION_FRONTEND_URL`: The production URL of the frontend for CORS.

- **`frontend/.env`**
  - `VITE_API_URL`: The URL of the backend API (e.g., `http://localhost:8000/api`).
  - `VITE_SUPABASE_URL`: The URL of your Supabase project (if accessed from the client).
  - `VITE_SUPABASE_ANON_KEY`: The anonymous key for your Supabase project (if accessed from the client).

### Supabase Setup

1.  Create a new project on [Supabase](https://supabase.com/).
2.  In your project settings, go to the "API" section.
3.  You will find your `SUPABASE_URL` and `SUPABASE_ANON_KEY` there.
4.  The `SUPABASE_SERVICE_ROLE_KEY` is also in this section. Treat it like a password and do not expose it on the client-side.

### n8n Webhook Configuration

To receive real-time updates on workflow executions, you can configure a webhook in n8n.

1.  In your n8n workflow, add a "Webhook" node at the end.
2.  Set the HTTP Method to `POST`.
3.  Set the Webhook URL to `YOUR_BACKEND_URL/api/v1/callback/n8n`.
4.  (Recommended) Add a secret header for security, which your backend can verify.

---

## 6. Deployment

### Backend on Render

1.  Create a new "Web Service" on [Render](https://render.com/).
2.  Connect your Git repository.
3.  Set the "Build Command" to `pip install -r requirements.txt`.
4.  Set the "Start Command" to `uvicorn main:app --host 0.0.0.0 --port $PORT`.
5.  Under "Environment", add all the required environment variables from your `.env` file as secrets.

### Frontend on Vercel

1.  Create a new project on [Vercel](https://vercel.com/).
2.  Connect your Git repository.
3.  Vercel will automatically detect that it's a Vite project and configure the build settings.
4.  Under "Environment Variables", add `VITE_API_URL` and point it to your deployed backend URL on Render.

---

## 7. Troubleshooting

### Common Issues

- **CORS Errors:** If the frontend cannot connect to the backend, ensure that `FRONTEND_URL` and `PRODUCTION_FRONTEND_URL` in the backend's `.env` file are set correctly.
- **500 Internal Server Error:** Check the backend logs for details. This is often caused by incorrect environment variable settings or database connection issues.

### Debug Logs

The FastAPI backend uses `uvicorn` for logging. When running locally, all logs are printed directly to the console. On Render, you can view the logs in your service's "Logs" tab.

### Performance Tips

- **Enable Celery Workers:** For production, ensure you have Celery workers running to process background jobs.
- **Database Indexing:** As your data grows, add appropriate indexes to your Supabase tables for faster queries.
- **Caching:** Implement caching for frequently accessed, non-critical data.

---

## 8. Contributing

We welcome contributions from the community!

### Git Workflow

1.  **Fork the repository.**
2.  **Create a new branch:** `git checkout -b feature/your-feature-name`
3.  **Commit your changes:** `git commit -m "feat: Add some amazing feature"`
4.  **Push to the branch:** `git push origin feature/your-feature-name`
5.  **Open a Pull Request.**

### Testing

- (Future) All new features should be accompanied by unit and integration tests.
- Run existing tests to ensure you haven't introduced any regressions.

### Code Style

- **Python:** We follow [PEP 8](https://www.python.org/dev/peps/pep-0008/). Use a linter like `flake8` or `black` to format your code.
- **TypeScript/React:** We use ESLint and Prettier. Run `npm run lint` in the `frontend` directory to check your code.

---

**Made with ❤️ by the n8n-interface community.**
