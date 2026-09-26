import re

def process_file():
    with open('backend/app/routers/ai_bridge.py', 'r') as f:
        content = f.read()

    replacement = '''
from groq import AsyncGroq
from app.config import settings
from app.db import get_supabase
from fastapi import Header, HTTPException
'''
    content = content.replace('import httpx\n', 'import httpx\n' + replacement)

    new_func = '''@router.post("/patient-qa")
async def patient_chat_assistant(payload: ChatQueryRequest, x_user_id: str = Header(...)):
    """
    AI Patient Assistant endpoint using Groq API.
    """
    try:
        supabase = get_supabase()
        meds_res = supabase.table("medications").select("name, dosage, frequency").eq("patient_id", x_user_id).eq("is_active", True).execute()
        meds_context = ", ".join([f"{m['name']} {m.get('dosage','')} ({m.get('frequency','')})" for m in meds_res.data]) if meds_res.data else "No active medications."
        
        system_prompt = f"""You are a helpful and comforting AI health assistant for an elderly patient. 
Your tone must be warm, reassuring, and very simple to understand. Avoid complex medical jargon.
The patient is currently taking the following medications: {meds_context}.
If the patient asks about missing a dose, advise them to check their 'Missed Dose Advice' on the dashboard.
If they ask about taking OTC drugs like ibuprofen or crocin, remind them to use the Safety Checker if it might interact with their current medications."""
        
        client = AsyncGroq(api_key=settings.GROQ_API_KEY)
        chat_completion = await client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": payload.query}
            ],
            model="llama3-8b-8192",
            temperature=0.3,
            max_tokens=150,
        )
        
        answer = chat_completion.choices[0].message.content
        return {"answer": answer, "suggested_actions": ["View Today's Schedule", "Run Safety Check"]}
    except Exception as e:
        logger.error(f"Groq API Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get answer from AI Assistant")
'''

    content = re.sub(r'@router\.post\("/patient-qa"\)[\s\S]*?(?=\n\n|\Z)', new_func, content, count=1)

    with open('backend/app/routers/ai_bridge.py', 'w') as f:
        f.write(content)

if __name__ == '__main__':
    process_file()
