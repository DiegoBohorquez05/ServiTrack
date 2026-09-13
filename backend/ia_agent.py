import os
from google import genai
from dotenv import load_dotenv

load_dotenv()

def generar_respuesta_contencion(titulo: str, descripcion: str, categoria: str) -> str:
    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        return "Hola, recibimos tu solicitud. Un integrante del equipo de soporte revisará tu caso en breve."

    try:
        client = genai.Client(api_key=api_key)
        prompt = f"""
        Eres un agente de nivel 1 de soporte técnico de IT para ServiTrack.
        Proporciona un diagnóstico breve y 3 pasos de solución para:
        Categoría: {categoria}
        Título: {titulo}
        Descripción: {descripcion}
        """

        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
        )
        return response.text
    except Exception as e:
        print(f"Error al llamar a Gemini: {e}")
        return "Hola, recibimos tu solicitud. Un integrante del equipo de soporte revisará tu caso en breve."