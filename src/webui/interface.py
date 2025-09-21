"""
🤖 Fagun Browser Automation Testing Agent - Web Interface
=========================================================

Web UI components for the Fagun Browser Automation Testing Agent.

Author: Mejbaur Bahar Fagun
Role: Software Engineer in Test
LinkedIn: https://www.linkedin.com/in/mejbaur/
"""

import gradio as gr

from src.webui.webui_manager import WebuiManager
from src.webui.components.agent_settings_tab import create_agent_settings_tab
from src.webui.components.browser_settings_tab import create_browser_settings_tab
from src.webui.components.browser_use_agent_tab import create_browser_use_agent_tab

theme_map = {
    "Default": gr.themes.Default(),
    "Soft": gr.themes.Soft(),
    "Monochrome": gr.themes.Monochrome(),
    "Glass": gr.themes.Glass(),
    "Origin": gr.themes.Origin(),
    "Citrus": gr.themes.Citrus(),
    "Ocean": gr.themes.Ocean(),
    "Base": gr.themes.Base()
}


def create_ui(theme_name="Ocean"):
    css = """
    .gradio-container {
        width: 70vw !important; 
        max-width: 70% !important; 
        margin-left: auto !important;
        margin-right: auto !important;
        padding-top: 100px !important;
    }
    .header-text {
        text-align: center;
        margin-bottom: 20px;
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        z-index: 1000 !important;
        background-color: var(--body-background-fill) !important;
        padding: 20px 0 !important;
        border-bottom: 2px solid var(--border-color-primary) !important;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
        line-height: 1.2 !important;
    }
    .header-text h1 {
        margin: 0 0 10px 0 !important;
        font-size: 2.5em !important;
        line-height: 1.1 !important;
    }
    .header-text h3 {
        margin: 0 !important;
        font-size: 1.2em !important;
        line-height: 1.2 !important;
        opacity: 0.9 !important;
    }
    .tab-header-text {
        text-align: center;
    }
    .theme-section {
        margin-bottom: 10px;
        padding: 15px;
        border-radius: 10px;
    }
    /* Hide default Gradio footer */
    .gradio-container footer {
        display: none !important;
    }
    .gradio-container .footer {
        display: none !important;
    }
    /* Override hide-container behavior for header */
    .hide-container {
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
    }
    /* Ensure header is always visible */
    .header-text, .header-text * {
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        z-index: 1000 !important;
    }
    /* Override any Gradio hiding classes for header */
    .header-text.hide-container,
    .header-text.svelte-11xb1hd,
    .header-text.padded,
    .header-text.auto-margin {
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        z-index: 1000 !important;
    }
    """

    # dark mode in default
    js_func = """
    function refresh() {
        const url = new URL(window.location);

        if (url.searchParams.get('__theme') !== 'dark') {
            url.searchParams.set('__theme', 'dark');
            window.location.href = url.href;
        }
    }
    """

    ui_manager = WebuiManager()

    with gr.Blocks(
            title="Fagun Browser Automation Testing Agent", theme=theme_map[theme_name], css=css, js=js_func,
            head="""
            <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🤖</text></svg>">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            """,
    ) as demo:
        with gr.Row():
            gr.Markdown(
                """
                # 🤖 Fagun Browser Automation Testing Agent
                """,
                elem_classes=["header-text"],
            )

        with gr.Tabs() as tabs:
            with gr.TabItem("⚙️ Agent Settings"):
                create_agent_settings_tab(ui_manager)

            with gr.TabItem("🌐 Browser Settings"):
                create_browser_settings_tab(ui_manager)

            with gr.TabItem("🤖 Run Agent"):
                create_browser_use_agent_tab(ui_manager)

        # Custom Footer
        with gr.Row():
            gr.HTML(
                """
                <div style="text-align: center; margin-top: 20px; padding: 10px; border-top: 1px solid #ccc;">
                    <p style="margin: 5px 0;">
                        <a href="https://www.linkedin.com/in/mejbaur/" target="_blank" style="text-decoration: none; color: #0077b5;">
                            Connect with Builder
                        </a>
                    </p>
                    <p style="margin: 5px 0; font-weight: bold; font-size: 1.1em; background: linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4, #feca57, #ff9ff3, #54a0ff); background-size: 400% 400%; -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; animation: gradientShift 3s ease-in-out infinite;">
                        Mejbaur Bahar Fagun
                    </p>
                    <p style="margin: 5px 0; color: #666; font-size: 0.9em;">
                        Software Engineer in Test
                    </p>
                </div>
                <style>
                    @keyframes gradientShift {
                        0% { background-position: 0% 50%; }
                        50% { background-position: 100% 50%; }
                        100% { background-position: 0% 50%; }
                    }
                </style>
                """
            )

    return demo
