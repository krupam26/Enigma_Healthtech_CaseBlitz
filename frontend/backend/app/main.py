from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from app.config import settings
from app.routers import (
    auth,
    medications,
    schedule,
    safety,
    caregiver,
    ai_bridge
)

app = FastAPI(
    title="Enigma HealthTech - Medication Management & Adherence API",
    description="Backend API for AI-powered personalized medication adherence, risk detection, and caregiver coordination.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware to allow Next.js frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(auth.router)
app.include_router(medications.router)
app.include_router(schedule.router)
app.include_router(safety.router)
app.include_router(caregiver.router)
app.include_router(ai_bridge.router)

@app.get("/", include_in_schema=False)
def root():
    """Redirect root path to interactive Swagger documentation."""
    return RedirectResponse(url="/docs")

@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": "Enigma HealthTech API",
        "supabase_configured": settings.is_supabase_configured,
        "environment": settings.ENVIRONMENT
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
