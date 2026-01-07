from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="CapitalYou Card API", version="1.0.0")

# CORS configuration to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Vite and React ports
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"message": "Welcome to CapitalYou Card API"}


@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "message": "Backend is running!"}


@app.get("/api/test")
async def test_endpoint():
    return {"success": True, "data": "This is a test response from FastAPI"}
