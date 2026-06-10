import streamlit as st
import requests
import os
from datetime import datetime

# Configure page metadata and look
st.set_page_config(
    page_title="OmniChat - Multilingual Support Platform",
    page_icon="💬",
    layout="wide",
    initial_sidebar_state="expanded"
)

# API Configurations
API_URL = os.getenv("VITE_API_URL", "http://localhost:8000")

LANGUAGE_LABELS = {
    "en": "English",
    "ta": "Tamil (தமிழ்)",
    "es": "Spanish (Español)",
    "hi": "Hindi (हिन्दी)",
    "fr": "French (Français)",
    "de": "German (Deutsch)"
}

# Custom Dark CSS to align with Discord theme
st.markdown("""
<style>
    .stApp {
        background-color: #202225;
        color: #dcddde;
    }
    .main .block-container {
        padding-top: 2rem;
    }
    /* Sidebar styling */
    section[data-testid="stSidebar"] {
        background-color: #2f3136;
        border-right: 1px solid rgba(0, 0, 0, 0.4);
    }
    /* Ticket boxes */
    .ticket-card {
        background-color: #36393f;
        padding: 12px;
        border-radius: 6px;
        border: 1px solid #202225;
        margin-bottom: 8px;
    }
    /* Message bubble styling */
    .chat-bubble-me {
        background-color: #5865F2; /* blurple */
        color: white;
        padding: 10px 14px;
        border-radius: 12px 12px 0px 12px;
        margin-bottom: 8px;
        align-self: flex-end;
        max-width: 70%;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .chat-bubble-other {
        background-color: #2f3136;
        color: #dcddde;
        padding: 10px 14px;
        border-radius: 12px 12px 12px 0px;
        margin-bottom: 8px;
        align-self: flex-start;
        max-width: 70%;
        border: 1px solid #202225;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .meta-text {
        font-size: 0.75rem;
        color: #72767d;
        margin-bottom: 12px;
    }
</style>
""", unsafe_allow_html=True)

# Initialize Session State
if "token" not in st.session_state:
    st.session_state.token = None
if "user" not in st.session_state:
    st.session_state.user = None
if "active_ticket_id" not in st.session_state:
    st.session_state.active_ticket_id = None
if "active_ticket_detail" not in st.session_state:
    st.session_state.active_ticket_detail = None
if "error" not in st.session_state:
    st.session_state.error = ""

# API Request Helper Functions
def api_headers():
    headers = {}
    if st.session_state.token:
        headers["Authorization"] = f"Bearer {st.session_state.token}"
    return headers

def handle_login(username, password):
    try:
        res = requests.post(f"{API_URL}/api/auth/login", json={"username": username, "password": password})
        if res.status_code == 200:
            data = res.json()
            st.session_state.token = data["access_token"]
            st.session_state.user = {
                "username": data["username"],
                "role": data["role"],
                "preferred_language": data["preferred_language"]
            }
            st.session_state.error = ""
            st.session_state.active_ticket_id = None
            st.session_state.active_ticket_detail = None
            st.rerun()
        else:
            st.session_state.error = res.json().get("detail", "Login failed.")
    except Exception as e:
        st.session_state.error = f"Connection error: {str(e)}"

def handle_signup(username, password, role, lang):
    try:
        res = requests.post(f"{API_URL}/api/auth/signup", json={
            "username": username,
            "password": password,
            "role": role,
            "preferred_language": lang
        })
        if res.status_code == 200:
            # Login immediately
            handle_login(username, password)
        else:
            st.session_state.error = res.json().get("detail", "Registration failed.")
    except Exception as e:
        st.session_state.error = f"Connection error: {str(e)}"

def handle_logout():
    st.session_state.token = None
    st.session_state.user = None
    st.session_state.active_ticket_id = None
    st.session_state.active_ticket_detail = None
    st.session_state.error = ""
    st.rerun()

# --- LOGIN & SIGNUP SCREEN ---
if not st.session_state.user:
    st.markdown("<h1 style='text-align: center; color: #5865F2;'>💬 OmniChat Support Portal</h1>", unsafe_allow_html=True)
    st.markdown("<p style='text-align: center; color: #72767d; margin-bottom: 2rem;'>Multilingual Customer Support platform with automatic translation pipeline.</p>", unsafe_allow_html=True)
    
    col1, col2 = st.columns([1.5, 1])
    
    with col1:
        tab1, tab2 = st.tabs(["🔐 Log In", "📝 Register"])
        
        with tab1:
            with st.form("login_form"):
                username_in = st.text_input("Username", placeholder="Enter your username")
                password_in = st.text_input("Password", type="password", placeholder="Enter your password")
                submitted = st.form_submit_button("Sign In", use_container_width=True)
                if submitted:
                    handle_login(username_in, password_in)
                    
        with tab2:
            with st.form("signup_form"):
                new_username = st.text_input("Username", placeholder="Choose a username")
                new_password = st.text_input("Password", type="password", placeholder="Choose a password")
                new_role = st.selectbox("Role", ["client", "engineer"], format_func=lambda x: "Client (Raises Tickets)" if x == "client" else "Support Engineer (English Only)")
                new_lang = st.selectbox("Preferred Language (Client only)", ["en", "ta", "es", "hi", "fr", "de"], format_func=lambda x: {
                    "en": "English", "ta": "Tamil (தமிழ்)", "es": "Spanish (Español)", "hi": "Hindi (हिन्दी)", "fr": "French (Français)", "de": "German (Deutsch)"
                }.get(x, x))
                
                signup_submitted = st.form_submit_button("Create Account", use_container_width=True)
                if signup_submitted:
                    handle_signup(new_username, new_password, new_role, new_lang)
        
        if st.session_state.error:
            st.error(st.session_state.error)

    with col2:
        st.markdown("<div style='background-color: #2f3136; padding: 20px; border-radius: 8px; border: 1px solid #36393f;'>", unsafe_allow_html=True)
        st.markdown("<h4 style='color: #dcddde; margin-top: 0;'>🔑 Quick Demo Sign In</h4>", unsafe_allow_html=True)
        st.markdown("<p style='font-size: 0.85rem; color: #72767d;'>Click one of the preloaded demo accounts below to sign in instantly:</p>", unsafe_allow_html=True)
        
        if st.button("arun (Client - Tamil / தமிழ்)", use_container_width=True):
            handle_login("arun", "password123")
        if st.button("juan (Client - Spanish / Español)", use_container_width=True):
            handle_login("juan", "password123")
        if st.button("engineer (Support Engineer - English)", use_container_width=True):
            handle_login("engineer", "admin123")
        
        st.markdown("</div>", unsafe_allow_html=True)

# --- APPLICATION WORKSPACES ---
else:
    role = st.session_state.user["role"]
    username = st.session_state.user["username"]
    lang = st.session_state.user["preferred_language"]

    # Sidebar Header
    st.sidebar.markdown(f"<h3 style='color: white; margin-bottom: 0.2rem;'>👤 {username}</h3>", unsafe_allow_html=True)
    st.sidebar.markdown(f"<p style='color: #72767d; font-size: 0.8rem; text-transform: uppercase; font-weight: bold; margin-bottom: 1rem;'>Role: {role} {f'({lang})' if role=='client' else ''}</p>", unsafe_allow_html=True)
    
    if st.sidebar.button("🚪 Log Out", use_container_width=True):
        handle_logout()

    st.sidebar.markdown("<hr style='border-top: 1px solid #36393f; margin: 10px 0;'>", unsafe_allow_html=True)

    # 1. CLIENT WORKSPACE
    if role == "client":
        st.sidebar.subheader("Support Menu")
        
        # New Ticket Button
        if st.sidebar.button("➕ Raise Support Ticket", use_container_width=True):
            st.session_state.active_ticket_id = "NEW"
            st.session_state.active_ticket_detail = None
            st.rerun()

        # Load Client Tickets
        tickets = []
        try:
            res = requests.get(f"{API_URL}/api/tickets/my", headers=api_headers())
            if res.status_code == 200:
                tickets = res.json()
        except Exception as e:
            st.sidebar.error("Error loading tickets.")

        st.sidebar.markdown("<p style='font-size: 0.75rem; color: #72767d; font-weight: bold; text-transform: uppercase;'>Your Open Tickets</p>", unsafe_allow_html=True)
        
        for t in tickets:
            ticket_label = f"{t['id']} - {t['title'][:20]}..."
            is_active = st.session_state.active_ticket_id == t["id"]
            
            # Button for selecting ticket
            if st.sidebar.button(
                f"{'🟢' if t['status']=='open' else '⚫'} {ticket_label}", 
                key=f"t_{t['id']}", 
                use_container_width=True
            ):
                st.session_state.active_ticket_id = t["id"]
                st.session_state.active_ticket_detail = None
                st.rerun()

        # Main Area Client
        if st.session_state.active_ticket_id == "NEW":
            st.subheader("Raise New Support Ticket")
            st.markdown("<p style='color: #72767d;'>Fill in the details in your preferred language. We will automatically translate it to English for support.</p>", unsafe_allow_html=True)
            
            with st.form("new_ticket_form"):
                title = st.text_input("Ticket Topic", placeholder="Enter a title for your support request")
                message = st.text_area("Describe your issue (in your native language)", placeholder="Type message...")
                submit = st.form_submit_button("Raise Support Ticket")
                
                if submit:
                    if not title.strip() or not message.strip():
                        st.error("Fields cannot be empty.")
                    else:
                        with st.spinner("Translating and raising ticket..."):
                            res = requests.post(
                                f"{API_URL}/api/tickets",
                                json={"title": title, "initial_message": message},
                                headers=api_headers()
                            )
                            if res.status_code == 200:
                                data = res.json()
                                st.success(f"Ticket {data['id']} raised successfully!")
                                st.session_state.active_ticket_id = data["id"]
                                st.rerun()
                            else:
                                st.error("Failed to raise ticket: " + res.text)
                                
        elif st.session_state.active_ticket_id:
            # Active Ticket view
            ticket_id = st.session_state.active_ticket_id
            
            # Fetch ticket details
            try:
                res = requests.get(f"{API_URL}/api/tickets/{ticket_id}", headers=api_headers())
                if res.status_code == 200:
                    ticket = res.json()
                    st.session_state.active_ticket_detail = ticket
                else:
                    st.error("Failed to fetch details.")
                    ticket = st.session_state.active_ticket_detail
            except Exception:
                ticket = st.session_state.active_ticket_detail

            if ticket:
                # Ticket Title Header
                st.markdown(f"<h2>🎫 {ticket['id']}: {ticket['title']}</h2>", unsafe_allow_html=True)
                
                # Priority / Status Banner
                status_color = "#57F287" if ticket["status"] == "open" else "#72767d"
                priority_color = {
                    "high": "#ED4245",
                    "medium": "#FEE75C",
                    "low": "#57F287"
                }.get(ticket["priority"], "#dcddde")
                
                st.markdown(f"""
                <div style='display: flex; gap: 10px; margin-bottom: 1rem;'>
                    <span style='background-color: {status_color}22; color: {status_color}; border: 1px solid {status_color}55; padding: 4px 10px; border-radius: 4px; font-size: 0.8rem; font-weight: bold; text-transform: uppercase;'>Status: {ticket['status']}</span>
                    <span style='background-color: {priority_color}22; color: {priority_color}; border: 1px solid {priority_color}55; padding: 4px 10px; border-radius: 4px; font-size: 0.8rem; font-weight: bold; text-transform: uppercase;'>Priority: {ticket['priority']}</span>
                </div>
                """, unsafe_allow_html=True)
                
                # Chat Logs
                st.markdown("<hr style='border-top: 1px solid #36393f; margin: 10px 0;'>", unsafe_allow_html=True)
                
                # Manual sync button
                if st.button("🔄 Sync Chat History"):
                    st.rerun()

                # Display messages
                for msg in ticket["messages"]:
                    is_me = msg["sender_role"] == "client"
                    sender_label = "You" if is_me else "Support Engineer"
                    text = msg["original_text"] if is_me else msg["translated_text"]
                    
                    align = "flex-end" if is_me else "flex-start"
                    bubble_class = "chat-bubble-me" if is_me else "chat-bubble-other"
                    
                    st.markdown(f"""
                    <div style='display: flex; flex-direction: column; align-items: {align}; width: 100%;'>
                        <div class='{bubble_class}'>
                            <p style='margin: 0; font-size: 0.95rem;'>{text}</p>
                        </div>
                        <div class='meta-text' style='text-align: {"right" if is_me else "left"}; margin-top: -4px;'>
                            {sender_label} • {msg['created_at'].split("T")[1][:5]} {" (Translated)" if not is_me else ""}
                        </div>
                    </div>
                    """, unsafe_allow_html=True)
                
                # Text Input Bar
                if ticket["status"] == "resolved":
                    st.success("✅ This ticket has been resolved. Text messages are disabled.")
                else:
                    with st.form("send_message_form", clear_on_submit=True):
                        input_msg = st.text_input("Type your response (in your native language):", key="client_msg_input")
                        send_submit = st.form_submit_button("Send Response")
                        
                        if send_submit and input_msg.strip():
                            with st.spinner("Translating and sending..."):
                                send_res = requests.post(
                                    f"{API_URL}/api/tickets/{ticket_id}/messages",
                                    json={"text": input_msg},
                                    headers=api_headers()
                                )
                                if send_res.status_code == 200:
                                    st.rerun()
                                else:
                                    st.error("Failed to send message.")
        else:
            st.info("👈 Select a support ticket from the sidebar or raise a new one to begin chatting.")

    # 2. SUPPORT ENGINEER WORKSPACE
    elif role == "engineer":
        st.sidebar.subheader("Ticket Queue")
        
        # Load all tickets
        tickets = []
        try:
            res = requests.get(f"{API_URL}/api/tickets", headers=api_headers())
            if res.status_code == 200:
                tickets = res.json()
        except Exception:
            st.sidebar.error("Error loading tickets.")

        # Sorting open tickets to the top
        open_tickets = [t for t in tickets if t["status"] == "open"]
        resolved_tickets = [t for t in tickets if t["status"] == "resolved"]
        
        st.sidebar.markdown(f"<p style='font-size: 0.75rem; color: #72767d; font-weight: bold; text-transform: uppercase;'>Open Inbox ({len(open_tickets)})</p>", unsafe_allow_html=True)
        
        for t in open_tickets:
            ticket_label = f"{t['id']} - @{t['client_username']}"
            if st.sidebar.button(f"🔴 {ticket_label}", key=f"t_e_{t['id']}", use_container_width=True):
                st.session_state.active_ticket_id = t["id"]
                st.session_state.active_ticket_detail = None
                st.rerun()
                
        st.sidebar.markdown(f"<p style='font-size: 0.75rem; color: #72767d; font-weight: bold; text-transform: uppercase; margin-top: 15px;'>Resolved ({len(resolved_tickets)})</p>", unsafe_allow_html=True)
        
        for t in resolved_tickets:
            ticket_label = f"{t['id']} - @{t['client_username']}"
            if st.sidebar.button(f"✅ {ticket_label}", key=f"t_e_{t['id']}", use_container_width=True):
                st.session_state.active_ticket_id = t["id"]
                st.session_state.active_ticket_detail = None
                st.rerun()

        # Main Area Engineer
        if st.session_state.active_ticket_id and st.session_state.active_ticket_id != "NEW":
            ticket_id = st.session_state.active_ticket_id
            
            # Fetch ticket details
            try:
                res = requests.get(f"{API_URL}/api/tickets/{ticket_id}", headers=api_headers())
                if res.status_code == 200:
                    ticket = res.json()
                    st.session_state.active_ticket_detail = ticket
                else:
                    st.error("Failed to fetch details.")
                    ticket = st.session_state.active_ticket_detail
            except Exception:
                ticket = st.session_state.active_ticket_detail

            if ticket:
                # Ticket Title Header
                st.markdown(f"<h2>🎫 {ticket['id']}: {ticket['title']}</h2>", unsafe_allow_html=True)
                st.markdown(f"<p style='font-size: 0.9rem; color: #72767d; margin-top: -10px;'>Customer: <b>@{ticket['client_username']}</b></p>", unsafe_allow_html=True)
                
                # Priority / Status Banner / Sentiment / Resolve Button
                col_h1, col_h2 = st.columns([3, 1])
                
                with col_h1:
                    status_color = "#57F287" if ticket["status"] == "open" else "#72767d"
                    priority_color = {
                        "high": "#ED4245",
                        "medium": "#FEE75C",
                        "low": "#57F287"
                    }.get(ticket["priority"], "#dcddde")
                    sentiment_color = {
                        "positive": "#57F287",
                        "neutral": "#FEE75C",
                        "negative": "#ED4245"
                    }.get(ticket["sentiment"], "#dcddde")
                    
                    st.markdown(f"""
                    <div style='display: flex; gap: 10px; margin-bottom: 1rem; flex-wrap: wrap;'>
                        <span style='background-color: {status_color}22; color: {status_color}; border: 1px solid {status_color}55; padding: 4px 10px; border-radius: 4px; font-size: 0.8rem; font-weight: bold; text-transform: uppercase;'>Status: {ticket['status']}</span>
                        <span style='background-color: {priority_color}22; color: {priority_color}; border: 1px solid {priority_color}55; padding: 4px 10px; border-radius: 4px; font-size: 0.8rem; font-weight: bold; text-transform: uppercase;'>Priority: {ticket['priority']}</span>
                        <span style='background-color: {sentiment_color}22; color: {sentiment_color}; border: 1px solid {sentiment_color}55; padding: 4px 10px; border-radius: 4px; font-size: 0.8rem; font-weight: bold; text-transform: uppercase;'>Sentiment: {ticket['sentiment']}</span>
                    </div>
                    """, unsafe_allow_html=True)
                    
                with col_h2:
                    if ticket["status"] == "open":
                        if st.button("✅ Mark as Resolved", use_container_width=True):
                            with st.spinner("Closing ticket..."):
                                res_res = requests.post(f"{API_URL}/api/tickets/{ticket_id}/resolve", headers=api_headers())
                                if res_res.status_code == 200:
                                    st.rerun()
                                else:
                                    st.error("Failed to resolve ticket.")

                st.markdown("<hr style='border-top: 1px solid #36393f; margin: 10px 0;'>", unsafe_allow_html=True)
                
                # Manual sync button
                if st.button("🔄 Sync Chat History"):
                    st.rerun()

                # Display messages
                for msg in ticket["messages"]:
                    is_me = msg["sender_role"] == "engineer"
                    sender_label = "You (Support)" if is_me else f"Client (@{ticket['client_username']})"
                    text = msg["original_text"] if is_me else msg["translated_text"]
                    
                    align = "flex-end" if is_me else "flex-start"
                    bubble_class = "chat-bubble-me" if is_me else "chat-bubble-other"
                    
                    st.markdown(f"""
                    <div style='display: flex; flex-direction: column; align-items: {align}; width: 100%;'>
                        <div class='{bubble_class}'>
                            <p style='margin: 0; font-size: 0.95rem;'>{text}</p>
                        </div>
                        <div class='meta-text' style='text-align: {"right" if is_me else "left"}; margin-top: -4px;'>
                            {sender_label} • {msg['created_at'].split("T")[1][:5]} {f" (Translated from {LANGUAGE_LABELS.get(msg['language'], msg['language'])})" if not is_me and msg['language'] != 'en' else ""}
                        </div>
                    </div>
                    """, unsafe_allow_html=True)
                    
                    # Expandable container for client's original native message
                    if not is_me and msg["language"] != "en":
                        with st.expander(f"👁️ Show original {LANGUAGE_LABELS.get(msg['language'], msg['language'])} message"):
                            st.code(msg["original_text"])
                
                # Text Input Bar
                if ticket["status"] == "resolved":
                    st.info("This ticket has been marked as resolved. Reply inputs are disabled.")
                else:
                    with st.form("send_reply_form", clear_on_submit=True):
                        input_reply = st.text_input(f"Reply in English to @{ticket['client_username']}:", key="engineer_msg_input")
                        reply_submit = st.form_submit_button("Send Response")
                        
                        if reply_submit and input_reply.strip():
                            with st.spinner("Translating and sending..."):
                                send_res = requests.post(
                                    f"{API_URL}/api/tickets/{ticket_id}/messages",
                                    json={"text": input_reply},
                                    headers=api_headers()
                                )
                                if send_res.status_code == 200:
                                    st.rerun()
                                else:
                                    st.error("Failed to send reply.")
        else:
            st.info("👈 Select an incoming customer ticket from the sidebar queue to inspect and translate.")
