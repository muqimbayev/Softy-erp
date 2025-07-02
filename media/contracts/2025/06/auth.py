from fastapi import APIRouter

auth_router = APIRouter()

@auth_router.post("/login")
def login():
    return {"msg": "Logged in"}

@auth_router.post("/logout")
def logout():
    return {"msg": "Logged out"}
