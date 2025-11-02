# CloneWriter - AI Voice Cloning with Local LLMs

Build a 100% private AI agent that generates content in your personal writing style using local LLMs powered by Ollama.

![CloneWriter](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![Ollama](https://img.shields.io/badge/Ollama-Local%20LLM-green?style=for-the-badge)

## Features

- **100% Private & Local**: All processing happens on your machine
- **Voice Cloning**: Train on your writing samples to match your unique style
- **Modern UI**: Beautiful, responsive interface built with Next.js and Tailwind CSS
- **RAG Pipeline**: Uses ChromaDB for efficient vector search
- **Flexible**: Supports CSV, JSON, and TXT files
- **Real-time Generation**: Generate content instantly with customizable parameters
- **Prompt Library**: Pre-built prompts for social media, professional, creative, and personal content

## Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe code
- **Tailwind CSS** - Utility-first styling
- **Ollama** - Local LLM inference
- **ChromaDB** - Vector database for RAG
- **Xenova/transformers.js** - Local embeddings
- **Framer Motion** - Smooth animations

## Prerequisites

1. **Node.js** (v18 or higher)
2. **Ollama** - [Install Ollama](https://ollama.ai/)
3. **Python & ChromaDB** - For vector storage

## Quick Start

### 1. Install Dependencies

```bash
# Install Node.js dependencies
npm install --legacy-peer-deps

# Install Python dependencies for ChromaDB
pip install chromadb
```

### 2. Setup Ollama

```bash
# Start Ollama service
ollama serve

# In another terminal, pull a model
ollama pull llama3.2:3b
# Or use a larger model for better results:
# ollama pull llama3.1:8b
```

### 3. Start ChromaDB

```bash
# Start ChromaDB server
chroma run --path ./vector_store
```

### 4. Configure Environment

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env if you need to change defaults:
# OLLAMA_HOST=http://localhost:11434
# OLLAMA_MODEL=llama3.2:3b
# CHROMA_URL=http://localhost:8000
```

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### 1. Upload Your Writing Samples

- Prepare your writing samples in CSV, JSON, or TXT format
- Examples:
  - Twitter/X exports (JSON)
  - LinkedIn posts (CSV)
  - Blog posts (TXT)
  - Emails, messages, etc.

### 2. Build Vector Store

- Upload your files using the drag-and-drop interface
- Click "Build Vector Store" to process and embed your writing samples
- This creates a searchable database of your writing style

### 3. Generate Content

- Select a prompt from the library or write your own
- Adjust generation settings (temperature, max length, top_p)
- Click "Generate Content" to create text in your style
- Copy the generated text or view the context used

## File Formats

### CSV Format
```csv
text,author,date
"Your writing sample here",you,2024-01-01
```

### JSON Format
```json
[
  {
    "text": "Your writing sample here",
    "metadata": "optional"
  }
]
```

### TXT Format
```
Each line is treated as a separate writing sample.
Make sure each line has at least 10 characters.
```

## Configuration

### Generation Settings

- **Temperature** (0.0 - 1.0): Controls creativity
  - Low (0.3): More focused and consistent
  - Medium (0.7): Balanced
  - High (0.9): More creative and diverse

- **Max Length** (100 - 2000): Maximum tokens to generate

- **Top P** (0.0 - 1.0): Controls diversity of word choices

### Quick Modes

- **Creative**: Higher temperature and top_p for diverse outputs
- **Balanced**: Default settings for good all-around performance
- **Precise**: Lower temperature for more focused outputs

## Architecture

```
┌─────────────────┐
│   Next.js App   │
│   (Frontend)    │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼───┐ ┌──▼──────┐
│Ollama │ │ChromaDB │
│ (LLM) │ │(Vectors)│
└───────┘ └─────────┘
```

### Data Flow

1. User uploads writing samples
2. Files are parsed and split into chunks
3. Embeddings are generated using Xenova/transformers.js
4. Documents are stored in ChromaDB
5. When generating:
   - User's prompt is embedded
   - Similar writing samples are retrieved
   - Context + prompt sent to Ollama
   - Generated text returned to user

## API Routes

- `POST /api/upload` - Upload and process files
- `POST /api/generate` - Generate content
- `GET /api/status` - Check service status

## Troubleshooting

### Ollama not running
```bash
# Make sure Ollama is running
ollama serve

# Check if model is installed
ollama list
```

### ChromaDB not accessible
```bash
# Start ChromaDB server
chroma run --path ./vector_store

# Or install if not installed
pip install chromadb
```

### npm install fails
```bash
# Use legacy peer deps flag
npm install --legacy-peer-deps

# Or clear cache
npm cache clean --force
npm install --legacy-peer-deps
```

### Generation is slow
- Use a smaller model: `ollama pull llama3.2:3b`
- Reduce max_tokens in settings
- Make sure you have sufficient RAM

## Development

```bash
# Install dependencies
npm install --legacy-peer-deps

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Deployment

### Docker (Recommended for Production)

Deploy the entire app with Ollama included in a single container:

```bash
# Using Docker Compose
docker-compose up -d

# The app will be available at http://localhost:3000
```

**Features:**
- 🐳 Single container with Next.js + Ollama
- 🔒 100% local inference (no external APIs)
- 📦 Uses llama3.2:1b (lightweight, fast)
- 💾 Persistent volumes for data storage
- 🔄 Auto-restart and health checks

**See [DOCKER.md](./DOCKER.md) for complete documentation.**

### Cloud Deployment

#### Fly.io (Best for Docker)
```bash
fly launch
fly deploy
```

#### DigitalOcean App Platform
1. Connect your GitHub repository
2. Select Dockerfile deployment
3. Choose Professional plan (8GB RAM recommended)

#### AWS/GCP
Deploy using ECS, Fargate, or Cloud Run with the provided Dockerfile.

### Local Network Access

To access from other devices on your network:

1. Update `next.config.js`:
```js
module.exports = {
  experimental: {
    serverActions: {
      allowedOrigins: ['*']
    }
  }
}
```

2. Start with hostname binding:
```bash
npm run dev -- -H 0.0.0.0
```

3. Access from: `http://YOUR_LOCAL_IP:3000`

**Note**: For privacy-focused use, Docker deployment keeps everything self-contained and portable.

## Privacy & Security

- All data stays on your machine
- No external API calls (except to local Ollama/ChromaDB)
- No telemetry or tracking
- Your writing samples are never sent to the cloud

## Contributing

Feel free to open issues or submit PRs!

## License

MIT

## Credits

Built with:
- [Next.js](https://nextjs.org/)
- [Ollama](https://ollama.ai/)
- [ChromaDB](https://www.trychroma.com/)
- [Xenova/transformers.js](https://huggingface.co/docs/transformers.js)

---

Made with ❤️ for privacy-conscious writers
