"""
🤖 Fagun Browser Automation Testing Agent - Agent Settings Tab
==============================================================

UI components for agent configuration and settings.

Author: Mejbaur Bahar Fagun
Role: Software Engineer in Test
LinkedIn: https://www.linkedin.com/in/mejbaur/
"""

import json
import os

import gradio as gr
from gradio.components import Component
from typing import Any, Dict, Optional
from src.webui.webui_manager import WebuiManager
from src.utils import config
import logging
from functools import partial

logger = logging.getLogger(__name__)


def update_model_dropdown(llm_provider):
    """
    Update the model name dropdown with predefined models for the selected provider.
    """
    # Use predefined models for the selected provider
    if llm_provider in config.model_names:
        return gr.Dropdown(choices=config.model_names[llm_provider], value=config.model_names[llm_provider][0],
                           interactive=True)
    else:
        return gr.Dropdown(choices=[], value="", interactive=True, allow_custom_value=True)




def create_agent_settings_tab(webui_manager: WebuiManager):
    """
    Creates an agent settings tab.
    """
    input_components = set(webui_manager.get_components())
    tab_components = {}


    with gr.Group():
        with gr.Row():
            llm_provider = gr.Dropdown(
                choices=[provider for provider, model in config.model_names.items()],
                label="🤖 AI Service Provider",
                value=os.getenv("DEFAULT_LLM", "openai"),
                info="Choose which AI company's service to use (OpenAI, Google, etc.)",
                interactive=True
            )
            llm_model_name = gr.Dropdown(
                label="🧠 AI Model",
                choices=config.model_names[os.getenv("DEFAULT_LLM", "openai")],
                value=config.model_names[os.getenv("DEFAULT_LLM", "openai")][0],
                interactive=True,
                allow_custom_value=True,
                info="Pick the specific AI model to use (like GPT-4, Claude, etc.)"
            )
        with gr.Row():
            llm_temperature = gr.Slider(
                minimum=0.0,
                maximum=2.0,
                value=0.6,
                step=0.1,
                label="🎲 AI Creativity Level",
                info="Lower = More predictable, Higher = More creative responses",
                interactive=True
            )

            use_vision = gr.Checkbox(
                label="👁️ Enable Visual Analysis",
                value=True,
                info="Let AI see and analyze screenshots of websites",
                interactive=True
            )

            ollama_num_ctx = gr.Slider(
                minimum=2 ** 8,
                maximum=2 ** 16,
                value=16000,
                step=1,
                label="📝 Memory Size (Ollama only)",
                info="How much information AI can remember at once (higher = slower but smarter)",
                visible=False,
                interactive=True
            )

        with gr.Row():
            llm_base_url = gr.Textbox(
                label="🌐 Custom API URL",
                value="",
                info="Only needed if using a custom AI service (leave blank for standard services)"
            )
            llm_api_key = gr.Textbox(
                label="🔑 Your API Key",
                type="password",
                value="",
                info="Get this from your AI service provider (OpenAI, Google, etc.)"
            )

    with gr.Group():
        with gr.Row():
            planner_llm_provider = gr.Dropdown(
                choices=[provider for provider, model in config.model_names.items()],
                label="🎯 Planning AI Service",
                info="Optional: Different AI for planning complex tasks",
                value=None,
                interactive=True
            )
            planner_llm_model_name = gr.Dropdown(
                label="🧠 Planning AI Model",
                interactive=True,
                allow_custom_value=True,
                info="AI model for planning and organizing tasks"
            )
        with gr.Row():
            planner_llm_temperature = gr.Slider(
                minimum=0.0,
                maximum=2.0,
                value=0.6,
                step=0.1,
                label="🎲 Planning AI Creativity",
                info="How creative the planning AI should be",
                interactive=True
            )

            planner_use_vision = gr.Checkbox(
                label="👁️ Enable Visual Planning",
                value=False,
                info="Let planning AI see website screenshots",
                interactive=True
            )

            planner_ollama_num_ctx = gr.Slider(
                minimum=2 ** 8,
                maximum=2 ** 16,
                value=16000,
                step=1,
                label="📝 Planning Memory Size",
                info="How much information planning AI can remember (Ollama only)",
                visible=False,
                interactive=True
            )

        with gr.Row():
            planner_llm_base_url = gr.Textbox(
                label="🌐 Planning API URL",
                value="",
                info="Custom URL for planning AI service (leave blank for standard)"
            )
            planner_llm_api_key = gr.Textbox(
                label="🔑 Planning API Key",
                type="password",
                value="",
                info="API key for planning AI service"
            )

    with gr.Row():
        max_steps = gr.Slider(
            minimum=1,
            maximum=1000,
            value=100,
            step=1,
            label="🔄 Maximum Testing Steps",
            info="How many steps AI can take to complete a task",
            interactive=True
        )
        max_actions = gr.Slider(
            minimum=1,
            maximum=100,
            value=10,
            step=1,
            label="⚡ Actions Per Step",
            info="How many actions AI can do in each step",
            interactive=True
        )

    with gr.Row():
        max_input_tokens = gr.Number(
            label="📄 Maximum Text Input",
            value=128000,
            precision=0,
            interactive=True
        )
        tool_calling_method = gr.Dropdown(
            label="🛠️ AI Communication Method",
            value="auto",
            interactive=True,
            allow_custom_value=True,
            choices=['function_calling', 'json_mode', 'raw', 'auto', 'tools', "None"],
            visible=True
        )
    tab_components.update(dict(
        llm_provider=llm_provider,
        llm_model_name=llm_model_name,
        llm_temperature=llm_temperature,
        use_vision=use_vision,
        ollama_num_ctx=ollama_num_ctx,
        llm_base_url=llm_base_url,
        llm_api_key=llm_api_key,
        planner_llm_provider=planner_llm_provider,
        planner_llm_model_name=planner_llm_model_name,
        planner_llm_temperature=planner_llm_temperature,
        planner_use_vision=planner_use_vision,
        planner_ollama_num_ctx=planner_ollama_num_ctx,
        planner_llm_base_url=planner_llm_base_url,
        planner_llm_api_key=planner_llm_api_key,
        max_steps=max_steps,
        max_actions=max_actions,
        max_input_tokens=max_input_tokens,
        tool_calling_method=tool_calling_method,
    ))
    webui_manager.add_components("agent_settings", tab_components)

    llm_provider.change(
        fn=lambda x: gr.update(visible=x == "ollama"),
        inputs=llm_provider,
        outputs=ollama_num_ctx
    )
    llm_provider.change(
        lambda provider: update_model_dropdown(provider),
        inputs=[llm_provider],
        outputs=[llm_model_name]
    )
    planner_llm_provider.change(
        fn=lambda x: gr.update(visible=x == "ollama"),
        inputs=[planner_llm_provider],
        outputs=[planner_ollama_num_ctx]
    )
    planner_llm_provider.change(
        lambda provider: update_model_dropdown(provider),
        inputs=[planner_llm_provider],
        outputs=[planner_llm_model_name]
    )

