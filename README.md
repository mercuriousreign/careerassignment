# Career Assignment

A career counseling web app powered by a local LLM (Ollama llama3.2), built with FastAPI and React.

---

## Prerequisites

Make sure the following are installed on your machine before running:

### 1. Python 3.10+
Download from https://www.python.org/downloads/
> During installation, check **"Add Python to PATH"**

Verify:
```bash
python --version
```

### 2. Node.js (v20+)
Download from https://nodejs.org/ (LTS version)

Verify:
```bash
node --version
npm --version
```

### 3. Ollama
Download from https://ollama.com/download

After installing, pull the model:
```bash
ollama pull llama3.2
```

Ollama runs automatically in the background after installation.

---

## Running Locally

You need **two terminals** running at the same time.

### Terminal 1 — Backend

```bash
# From the project root
python -m venv venv

# Activate the virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Start the backend
python main.py
```

The backend will be running at `http://localhost:8000`

---

### Terminal 2 — Frontend

```bash
# From the project root
cd client

# Install Node dependencies
npm install

# Start the dev server
npm run dev
```

The frontend will be running at `http://localhost:5173`

---

## Usage

Open **http://localhost:5173** in your browser, type a career question in the text area, and click **Send**.

> Note: Responses may take 1-2 minutes on CPU-only machines since the LLM runs locally.

---

## Project Structure

```
careerassignment/
├── main.py           # FastAPI backend
├── requirements.txt  # Python dependencies
└── client/           # React frontend (Vite + TypeScript)
    └── src/
        ├── App.tsx   # Main UI component
        └── api.ts    # Axios API config
```
