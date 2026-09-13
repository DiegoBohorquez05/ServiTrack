from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import jwt

from database import supabase
from security import hash_password, verify_password, create_access_token, SECRET_KEY, ALGORITHM
from ia_agent import generar_respuesta_contencion

app = FastAPI()

# Habilitar CORS para conectar con React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Modelos Pydantic
class RegisterModel(BaseModel):
    nombre: str
    email: str
    password: str
    rol_id: int

class LoginModel(BaseModel):
    email: str
    password: str

class TicketCreate(BaseModel):
    titulo: str
    descripcion: str
    categoria: str

class TicketUpdate(BaseModel):
    estado: Optional[str] = None
    prioridad: Optional[str] = None
    solucion_final: Optional[str] = None

# Autenticación JWT Helper
def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token de acceso no proporcionado")
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except Exception:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")

# --- RUTAS DE AUTENTICACIÓN ---
@app.post("/auth/register")
def register(user_data: RegisterModel):
    # Cifrar contraseña
    hashed = hash_password(user_data.password)

    # Insertar en Supabase asegurando el nombre correcto 'password_hash'
    response = supabase.table("usuarios").insert({
        "nombre": user_data.nombre,
        "email": user_data.email,
        "password_hash": hashed,
        "rol_id": user_data.rol_id
    }).execute()

    return {"message": "Usuario registrado exitosamente"}

@app.post("/auth/login")
def login(credentials: LoginModel):
    response = supabase.table("usuarios").select("*, roles(nombre)").eq("email", credentials.email).execute()

    if not response.data:
        raise HTTPException(status_code=400, detail="Credenciales incorrectas")

    user = response.data[0]

    # Usamos la clave correcta 'password_hash' de la BD
    if not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=400, detail="Credenciales incorrectas")

    rol_nombre = "Trabajador"
    if user.get("roles") and isinstance(user["roles"], dict):
        rol_nombre = user["roles"].get("nombre", "Trabajador")

    token_data = {
        "sub": str(user["id"]),
        "email": user["email"],
        "rol": rol_nombre
    }

    access_token = create_access_token(data=token_data)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "nombre": user["nombre"],
            "email": user["email"],
            "rol": rol_nombre
        }
    }

# --- RUTAS DE TICKETS ---
@app.post("/tickets")
def create_ticket(ticket: TicketCreate, user: dict = Depends(get_current_user)):
    respuesta_ia = generar_respuesta_contencion(ticket.titulo, ticket.descripcion, ticket.categoria)

    res = supabase.table("tickets").insert({
        "titulo": ticket.titulo,
        "descripcion": ticket.descripcion,
        "categoria": ticket.categoria,
        "usuario_id": user["sub"],
        "respuesta_ia": respuesta_ia,
        "estado": "Abierto",
        "prioridad": "Media"
    }).execute()

    return res.data[0]

@app.get("/tickets")
def get_tickets(user: dict = Depends(get_current_user)):
    if user["rol"] == "Trabajador":
        res = supabase.table("tickets").select("*, usuarios(nombre, email)").eq("usuario_id", user["sub"]).execute()
    else:
        res = supabase.table("tickets").select("*, usuarios(nombre, email)").execute()
    return res.data

@app.patch("/tickets/{ticket_id}")
def update_ticket(ticket_id: int, update_data: TicketUpdate, user: dict = Depends(get_current_user)):
    data = {k: v for k, v in update_data.model_dump().items() if v is not None}
    res = supabase.table("tickets").update(data).eq("id", ticket_id).execute()
    return res.data