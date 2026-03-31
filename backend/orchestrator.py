import asyncio
import random
import logging
from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
from datetime import datetime

# Setup Logging to mimic AI reasoning
logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger("SENTINEL")

app = FastAPI()

# CORS for Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Simulator:
    def __init__(self):
        self.running = True
        self.state = "NORMAL"
        self.hr = 75.0
        self.bp_sys = 120.0
        self.bp_dia = 80.0
        self.spo2 = 98.0
        self.lactate = 1.0
        self.temp = 37.0

    def update(self):
        if self.state == "NORMAL":
            # Normal jitter
            self.hr = max(60, min(100, self.hr + random.uniform(-2, 2)))
            self.bp_sys = max(110, min(130, self.bp_sys + random.uniform(-1, 1)))
            self.bp_dia = max(70, min(90, self.bp_dia + random.uniform(-1, 1)))
            self.spo2 = max(95, min(100, self.spo2 + random.uniform(-0.1, 0.1)))
            self.lactate = max(0.5, min(1.5, self.lactate + random.uniform(-0.05, 0.05)))
            self.temp = max(36.5, min(37.5, self.temp + random.uniform(-0.1, 0.1)))
        elif self.state == "CRITICAL":
            # Septic Shock Simulation
            self.hr = min(180, self.hr + random.uniform(0.5, 2.0)) # Tachycardia
            self.bp_sys = max(60, self.bp_sys - random.uniform(0.5, 2.0)) # Hypotension
            self.bp_dia = max(40, self.bp_dia - random.uniform(0.5, 1.5))
            self.spo2 = max(80, self.spo2 - random.uniform(0.05, 0.2))
            self.lactate = min(10, self.lactate + random.uniform(0.05, 0.2)) # Rising Lactate
            self.temp = min(41, self.temp + random.uniform(0.05, 0.2)) # Fever

    def get_data(self):
        return {
            "timestamp": datetime.now().isoformat(),
            "state": self.state,
            "vitals": {
                "heart_rate": round(self.hr, 1),
                "bp_sys": round(self.bp_sys, 1),
                "bp_dia": round(self.bp_dia, 1),
                "spo2": round(self.spo2, 1),
                "lactate": round(self.lactate, 2),
                "temp": round(self.temp, 1)
            }
        }

sim = Simulator()

async def agent_loop():
    """Background task to run the agents and simulation"""
    while True:
        sim.update()
        
        # Agent Logic & Logging
        if sim.state == "NORMAL":
            if random.random() < 0.05:
                logger.info(f"[INFO] Cardiac Agent: HRV Stable. Rhythm Normal.")
        elif sim.state == "CRITICAL":
            if sim.lactate > 4.0 and sim.temp > 38.5:
                 logger.warning(f"[WARN] Sepsis Agent: Lactate/Temp Divergence > {round(sim.lactate/sim.temp, 2)}")
            if sim.hr > 120:
                 logger.info(f"[INFO] Cardiac Agent: HRV Drop Detected (-{random.randint(15, 30)}%)")
            
            if random.random() < 0.1:
                logger.critical("[CRITICAL] ORCHESTRATOR: Conflict Resolved -> Prioritizing Cardiac Support.")

        await asyncio.sleep(0.1) # 10Hz updates for logs, though sim is faster conceptually

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(agent_loop())

@app.get("/status")
async def get_status():
    return sim.get_data()

@app.post("/simulate-crisis")
async def simulate_crisis():
    sim.state = "CRITICAL"
    logger.critical("!!! CRISIS SIMULATION TRIGGERED: SEPTIC SHOCK SEQUENCE INITIATED !!!")
    return {"message": "Crisis initiated"}

@app.post("/reset")
async def reset_simulation():
    sim.state = "NORMAL"
    sim.hr = 75.0
    sim.bp_sys = 120.0
    sim.lactate = 1.0
    logger.info("System Reset to Normal State.")
    return {"message": "System reset"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
