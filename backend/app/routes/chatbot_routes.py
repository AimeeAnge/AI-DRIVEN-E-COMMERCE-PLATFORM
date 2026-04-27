from flask import Blueprint, g, request

from ..services.chatbot_service import ChatbotError, get_conversation, handle_message, list_conversations
from ..utils.auth import login_required
from ..utils.pagination import pagination_params
from ..utils.responses import error_response, success_response


chatbot_bp = Blueprint("chatbot", __name__)


def _chatbot_error(exc):
    return error_response(exc.message, status_code=exc.status_code, code=exc.code, data=exc.data)


@chatbot_bp.post("/message")
@login_required
def chatbot_message():
    try:
        result = handle_message(g.current_user, request.get_json(silent=True) or {})
    except ChatbotError as exc:
        return _chatbot_error(exc)
    return success_response(message="Chatbot response created.", data=result, status_code=201)


@chatbot_bp.get("/conversations")
@login_required
def chatbot_conversations():
    page, page_size, offset = pagination_params(request.args)
    try:
        result = list_conversations(g.current_user["id"], page, page_size, offset)
    except ChatbotError as exc:
        return _chatbot_error(exc)
    return success_response(message="Chatbot conversations loaded.", data=result)


@chatbot_bp.get("/conversations/<conversation_id>")
@login_required
def chatbot_conversation(conversation_id):
    try:
        result = get_conversation(g.current_user["id"], conversation_id)
    except ChatbotError as exc:
        return _chatbot_error(exc)
    return success_response(message="Chatbot conversation loaded.", data=result)
