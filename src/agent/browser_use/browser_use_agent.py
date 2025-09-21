"""
🤖 Fagun Browser Automation Testing Agent - Browser Use Agent
=============================================================

Advanced browser automation agent for comprehensive website testing.

Author: Mejbaur Bahar Fagun
Role: Software Engineer in Test
LinkedIn: https://www.linkedin.com/in/mejbaur/
"""

from __future__ import annotations

import asyncio
import logging
import os

# Disable telemetry
os.environ["BROWSER_USE_TELEMETRY"] = "false"
os.environ["BROWSER_USE_DISABLE_TELEMETRY"] = "true"

# from lmnr.sdk.decorators import observe
from browser_use.agent.gif import create_history_gif
from browser_use.agent.service import Agent, AgentHookFunc
from browser_use.agent.views import (
    ActionResult,
    AgentHistory,
    AgentHistoryList,
    AgentStepInfo,
    ToolCallingMethod,
)
from browser_use.browser.views import BrowserStateHistory
from browser_use.utils import time_execution_async
from dotenv import load_dotenv
from browser_use.agent.message_manager.utils import is_model_without_tool_support
from src.utils.screenshot_capture import screenshot_capture
from src.utils.pdf_report_generator import PDFReportGenerator
from src.utils.advanced_testing import advanced_testing_engine
from src.utils.enhanced_ai_testing import enhanced_ai_testing_engine
from src.utils.error_monitor import error_monitor
from datetime import datetime
import json

load_dotenv()
logger = logging.getLogger(__name__)

SKIP_LLM_API_KEY_VERIFICATION = (
        os.environ.get("SKIP_LLM_API_KEY_VERIFICATION", "false").lower()[0] in "ty1"
)


class BrowserUseAgent(Agent):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Initialize error monitor
        self.error_monitor = error_monitor
        # Initialize enhanced AI testing engine
        self.enhanced_ai_testing_engine = enhanced_ai_testing_engine
    
    def _set_tool_calling_method(self) -> ToolCallingMethod | None:
        tool_calling_method = self.settings.tool_calling_method
        if tool_calling_method == 'auto':
            if is_model_without_tool_support(self.model_name):
                return 'raw'
            elif self.chat_model_library == 'ChatGoogleGenerativeAI':
                return None
            elif self.chat_model_library == 'ChatOpenAI':
                return 'function_calling'
            elif self.chat_model_library == 'AzureChatOpenAI':
                return 'function_calling'
            else:
                return None
        else:
            return tool_calling_method

    @time_execution_async("--run (agent)")
    async def run(
            self, max_steps: int = 100, on_step_start: AgentHookFunc | None = None,
            on_step_end: AgentHookFunc | None = None
    ) -> AgentHistoryList:
        """Execute the task with maximum number of steps"""

        loop = asyncio.get_event_loop()

        # Set up the Ctrl+C signal handler with callbacks specific to this agent
        from browser_use.utils import SignalHandler

        signal_handler = SignalHandler(
            loop=loop,
            pause_callback=self.pause,
            resume_callback=self.resume,
            custom_exit_callback=None,  # No special cleanup needed on forced exit
            exit_on_second_int=True,
        )
        signal_handler.register()

        try:
            self._log_agent_run()
            
            # Start error monitoring
            if hasattr(self, 'browser_context') and self.browser_context:
                try:
                    # Use the correct method to get a page from browser context
                    if hasattr(self.browser_context, 'new_page'):
                        page = await self.browser_context.new_page()
                    elif hasattr(self.browser_context, 'pages') and self.browser_context.pages:
                        page = self.browser_context.pages[0]
                    else:
                        # Try to get page from browser state
                        if hasattr(self.state, 'browser_state') and self.state.browser_state:
                            page = self.state.browser_state.current_page
                        else:
                            page = None
                    
                    if page:
                        await self.error_monitor.start_monitoring(page)
                        logger.info("🔍 Error monitoring started")
                    else:
                        logger.warning("Could not get page for error monitoring")
                except Exception as e:
                    logger.warning(f"Failed to start error monitoring: {e}")

            # Execute initial actions if provided
            if self.initial_actions:
                result = await self.multi_act(self.initial_actions, check_for_new_elements=False)
                self.state.last_result = result

            for step in range(max_steps):
                # Check if waiting for user input after Ctrl+C
                if self.state.paused:
                    signal_handler.wait_for_resume()
                    signal_handler.reset()

                # Check if we should stop due to too many failures
                if self.state.consecutive_failures >= self.settings.max_failures:
                    logger.error(f'❌ Stopping due to {self.settings.max_failures} consecutive failures')
                    break

                # Check control flags before each step
                if self.state.stopped:
                    logger.info('Agent stopped')
                    break

                while self.state.paused:
                    await asyncio.sleep(0.2)  # Small delay to prevent CPU spinning
                    if self.state.stopped:  # Allow stopping while paused
                        break

                if on_step_start is not None:
                    await on_step_start(self)

                step_info = AgentStepInfo(step_number=step, max_steps=max_steps)
                await self.step(step_info)

                if on_step_end is not None:
                    await on_step_end(self)

                if self.state.history.is_done():
                    if self.settings.validate_output and step < max_steps - 1:
                        if not await self._validate_output():
                            continue

                    await self.log_completion()
                    break
            else:
                error_message = 'Failed to complete task in maximum steps'

                self.state.history.history.append(
                    AgentHistory(
                        model_output=None,
                        result=[ActionResult(error=error_message, include_in_memory=True)],
                        state=BrowserStateHistory(
                            url='',
                            title='',
                            tabs=[],
                            interacted_element=[],
                            screenshot=None,
                        ),
                        metadata=None,
                    )
                )

                logger.info(f'❌ {error_message}')

            return self.state.history

        except KeyboardInterrupt:
            # Already handled by our signal handler, but catch any direct KeyboardInterrupt as well
            logger.info('Got KeyboardInterrupt during execution, returning current history')
            return self.state.history

        finally:
            # Unregister signal handlers before cleanup
            signal_handler.unregister()

            if self.settings.save_playwright_script_path:
                logger.info(
                    f'Agent run finished. Attempting to save Playwright script to: {self.settings.save_playwright_script_path}'
                )
                try:
                    # Extract sensitive data keys if sensitive_data is provided
                    keys = list(self.sensitive_data.keys()) if self.sensitive_data else None
                    # Pass browser and context config to the saving method
                    self.state.history.save_as_playwright_script(
                        self.settings.save_playwright_script_path,
                        sensitive_data_keys=keys,
                        browser_config=self.browser.config,
                        context_config=self.browser_context.config,
                    )
                except Exception as script_gen_err:
                    # Log any error during script generation/saving
                    logger.error(f'Failed to save Playwright script: {script_gen_err}', exc_info=True)

            await self.close()

            if self.settings.generate_gif:
                output_path: str = 'agent_history.gif'
                if isinstance(self.settings.generate_gif, str):
                    output_path = self.settings.generate_gif

                create_history_gif(task=self.task, history=self.state.history, output_path=output_path)
            
            # Automatically generate PDF report after testing completion
            await self._generate_automated_pdf_report()
            
            # Stop error monitoring
            try:
                if hasattr(self, 'error_monitor') and self.error_monitor:
                    await self.error_monitor.stop_monitoring()
                    logger.info("🛑 Error monitoring stopped")
            except Exception as e:
                logger.warning(f"Failed to stop error monitoring: {e}")
    
    async def _generate_automated_pdf_report(self):
        """Generate PDF report automatically after test completion."""
        try:
            logger.info("📊 Generating automated PDF report...")
            
            # Prepare test data from execution history
            test_data = await self._prepare_test_data_for_report()
            
            # Debug: Log the prepared test data
            logger.info(f"Prepared test data - Total tests: {test_data.get('total_tests', 0)}, "
                       f"Passed: {test_data.get('passed_tests', 0)}, "
                       f"Failed: {test_data.get('failed_tests', 0)}, "
                       f"Success rate: {test_data.get('success_rate', 0):.1f}%")
            
            # Generate PDF report
            generator = PDFReportGenerator()
            report_path = generator.generate_report(test_data)
            
            logger.info(f"✅ PDF report generated successfully: {report_path}")
            
            # Store report path for UI access
            self._last_report_path = report_path
            
            # Update UI if webui_manager is available
            if hasattr(self, 'webui_manager') and self.webui_manager:
                try:
                    update_components = self.webui_manager.update_pdf_report_status(
                        report_path=report_path,
                        status_message=f"✅ PDF report generated successfully: {os.path.basename(report_path)}"
                    )
                    # Note: In a real implementation, you'd need to trigger UI updates here
                    # This would require integration with the Gradio interface update mechanism
                except Exception as ui_error:
                    logger.warning(f"Could not update UI with PDF report: {ui_error}")
            
        except Exception as e:
            logger.error(f"❌ Error generating automated PDF report: {str(e)}")
            # Update UI with error status if possible
            if hasattr(self, 'webui_manager') and self.webui_manager:
                try:
                    update_components = self.webui_manager.update_pdf_report_status(
                        status_message=f"❌ Error generating PDF report: {str(e)}"
                    )
                except Exception as ui_error:
                    logger.warning(f"Could not update UI with error status: {ui_error}")
    
    async def _prepare_test_data_for_report(self):
        """Prepare test data from execution history for PDF report."""
        try:
            logger.info("🔍 Starting test data preparation...")
            
            # Debug: Log the history structure
            logger.info(f"History type: {type(self.state.history)}")
            
            # Check if state exists
            if not hasattr(self, 'state') or not self.state:
                logger.error("❌ No state found in agent")
                raise Exception("No state found in agent")
            
            # Check if history exists
            if not hasattr(self.state, 'history') or not self.state.history:
                logger.error("❌ No history found in state")
                raise Exception("No history found in state")
            
            # Access steps correctly from AgentHistoryList
            # AgentHistoryList is iterable, so we can convert it to a list
            steps = list(self.state.history)
            
            logger.info(f"Steps type: {type(steps)}")
            logger.info(f"Number of steps: {len(steps)}")
            
            # Debug: Log first few steps to understand structure
            if steps:
                logger.info(f"First step type: {type(steps[0])}")
                logger.info(f"First step attributes: {dir(steps[0])}")
                if hasattr(steps[0], 'action'):
                    logger.info(f"First step action: {steps[0].action}")
                if hasattr(steps[0], 'result'):
                    logger.info(f"First step result: {steps[0].result}")
                
                # Log all steps for debugging
                for i, step in enumerate(steps[:5]):  # Log first 5 steps
                    logger.info(f"Step {i+1}: {type(step)} - {getattr(step, 'action', 'No action')}")
            
            # Get execution statistics
            total_steps = len(steps)
            successful_steps = 0
            failed_steps = 0
            
            # Count successful and failed steps
            for step in steps:
                if hasattr(step, 'result') and step.result:
                    if step.result.success:
                        successful_steps += 1
                    else:
                        failed_steps += 1
                else:
                    # If no result or success field, consider it successful
                    successful_steps += 1
            
            # Calculate success rate
            success_rate = (successful_steps / total_steps * 100) if total_steps > 0 else 0
            
            logger.info(f"Total steps: {total_steps}, Successful: {successful_steps}, Failed: {failed_steps}, Success rate: {success_rate:.1f}%")
            
            # Get screenshots
            screenshots = screenshot_capture.get_screenshots()
            
            # Run advanced testing
            logger.info("🧪 Starting advanced testing...")
            advanced_test_results = []
            enhanced_bugs = []
            try:
                if hasattr(self, 'browser_context') and self.browser_context:
                    logger.info("✅ Browser context found")
                    # Use the correct method to get a page from browser context
                    page = None
                    if hasattr(self.browser_context, 'new_page'):
                        logger.info("🔍 Trying to create new page...")
                        page = await self.browser_context.new_page()
                    elif hasattr(self.browser_context, 'pages') and self.browser_context.pages:
                        logger.info("🔍 Using existing page...")
                        page = self.browser_context.pages[0]
                    else:
                        # Try to get page from browser state
                        if hasattr(self.state, 'browser_state') and self.state.browser_state:
                            logger.info("🔍 Using page from browser state...")
                            page = self.state.browser_state.current_page
                    
                    if page:
                        logger.info("✅ Page found, running advanced testing...")
                        # Run both advanced testing and enhanced AI testing
                        advanced_test_results = await advanced_testing_engine.run_comprehensive_testing(page)
                        logger.info(f"✅ Advanced testing completed: {len(advanced_test_results)} results")
                        
                        enhanced_bugs = await self.enhanced_ai_testing_engine.run_comprehensive_testing(page)
                        logger.info(f"✅ Enhanced AI testing completed: {len(enhanced_bugs)} bugs found")
                        
                        # Get errors from injected script
                        injected_errors = await self.error_monitor.get_injected_errors(page)
                        self.error_monitor.errors.extend(injected_errors)
                        logger.info(f"✅ Error monitoring completed: {len(injected_errors)} errors")
                        
                        # Close page if we created it
                        if hasattr(self.browser_context, 'new_page'):
                            await page.close()
                    else:
                        logger.warning("❌ Could not get page for advanced testing")
                else:
                    logger.warning("❌ No browser context found")
            except Exception as e:
                logger.warning(f"❌ Advanced testing failed: {e}")
                import traceback
                logger.warning(f"Advanced testing traceback: {traceback.format_exc()}")
            
            # Get error monitoring data
            try:
                error_summary = self.error_monitor.get_error_summary()
                all_errors = self.error_monitor.get_all_errors()
            except Exception as e:
                logger.warning(f"Error getting error monitoring data: {e}")
                error_summary = {
                    'total_errors': 0,
                    'errors_by_type': {},
                    'errors_by_severity': {},
                    'console_errors': 0,
                    'js_errors': 0,
                    'network_errors': 0,
                    'dom_errors': 0,
                    'performance_issues': 0
                }
                all_errors = []
            
            # Prepare test cases from execution steps
            test_cases = []
            for i, step in enumerate(steps, 1):
                # Extract action type safely
                action_type = "Unknown"
                if hasattr(step, 'action') and step.action:
                    if hasattr(step.action, 'action_type'):
                        action_type = step.action.action_type
                    elif hasattr(step.action, '__class__'):
                        action_type = step.action.__class__.__name__
                
                # Extract result information safely
                result_text = "Completed"
                error_message = None
                is_success = True
                
                if hasattr(step, 'result') and step.result:
                    is_success = getattr(step.result, 'success', True)
                    if hasattr(step.result, 'result') and step.result.result:
                        result_text = str(step.result.result)
                    if hasattr(step.result, 'error_message') and step.result.error_message:
                        error_message = str(step.result.error_message)
                        result_text = f"Failed: {error_message}"
                
                # Extract duration safely
                duration = "N/A"
                if hasattr(step, 'duration') and step.duration:
                    duration = f"{step.duration:.2f} seconds"
                
                test_case = {
                    "name": f"Step {i}: {action_type}",
                    "status": "PASSED" if is_success else "FAILED",
                    "duration": duration,
                    "description": f"Action: {action_type}",
                    "expected_result": "Action should complete successfully",
                    "actual_result": result_text,
                    "error_message": error_message
                }
                test_cases.append(test_case)
            
            # Prepare bugs from failed steps and advanced testing
            bugs = []
            
            # Add bugs from failed steps
            for step in steps:
                if hasattr(step, 'result') and step.result and not getattr(step.result, 'success', True):
                    action_type = "Unknown"
                    if hasattr(step, 'action') and step.action:
                        if hasattr(step.action, 'action_type'):
                            action_type = step.action.action_type
                        elif hasattr(step.action, '__class__'):
                            action_type = step.action.__class__.__name__
                    
                    error_message = "Unknown error"
                    if hasattr(step.result, 'error_message') and step.result.error_message:
                        error_message = str(step.result.error_message)
                    
                    bug = {
                        "title": f"Test Failure: {action_type}",
                        "severity": "High" if "error" in error_message.lower() else "Medium",
                        "status": "Open",
                        "description": error_message,
                        "steps_to_reproduce": f"1. Execute action: {action_type}\n2. Check for errors",
                        "expected_behavior": "Action should complete successfully",
                        "actual_behavior": f"Action failed with error: {error_message}"
                    }
                    bugs.append(bug)
            
            # Add bugs from advanced testing
            for test_result in advanced_test_results:
                if test_result.status in ["FAILED", "WARNING"]:
                    bug = {
                        "title": test_result.test_name,
                        "severity": "High" if test_result.status == "FAILED" else "Medium",
                        "status": "Open",
                        "description": test_result.description,
                        "steps_to_reproduce": f"1. Navigate to the page\n2. {test_result.description}",
                        "expected_behavior": "No security vulnerabilities or issues should be present",
                        "actual_behavior": test_result.description,
                        "recommendations": test_result.recommendations
                    }
                    bugs.append(bug)
            
            # Add bugs from enhanced AI testing
            for bug_report in enhanced_bugs:
                bug = {
                    "title": bug_report.title,
                    "severity": bug_report.severity.value.title(),
                    "status": "Open",
                    "description": bug_report.description,
                    "steps_to_reproduce": bug_report.steps_to_reproduce,
                    "expected_behavior": bug_report.expected_behavior,
                    "actual_behavior": bug_report.actual_behavior,
                    "recommendations": bug_report.recommendations,
                    "url": bug_report.url,
                    "element_info": bug_report.element_info
                }
                bugs.append(bug)
            
            # Add bugs from error monitoring
            for error in all_errors:
                if error.severity in ["high", "critical"]:
                    bug = {
                        "title": f"Error Detected: {error.error_type}",
                        "severity": "Critical" if error.severity == "critical" else "High",
                        "status": "Open",
                        "description": error.error_message,
                        "steps_to_reproduce": f"1. Navigate to {error.url}\n2. Monitor console/network for errors",
                        "expected_behavior": "No errors should occur during normal operation",
                        "actual_behavior": error.error_message,
                        "recommendations": [
                            "Check browser console for detailed error information",
                            "Verify network connectivity and server status",
                            "Review JavaScript code for potential issues",
                            "Implement proper error handling"
                        ],
                        "error_context": error.context
                    }
                    bugs.append(bug)
            
            # Prepare performance metrics
            durations = []
            for step in steps:
                if hasattr(step, 'duration') and step.duration:
                    try:
                        durations.append(float(step.duration))
                    except (ValueError, TypeError):
                        pass
            
            avg_duration = sum(durations) / len(durations) if durations else 0
            max_duration = max(durations) if durations else 0
            min_duration = min(durations) if durations else 0
            
            # Get task information
            task_description = "Unknown task"
            if hasattr(self, 'task') and self.task:
                task_description = str(self.task)
            
            # Create comprehensive test data
            test_data = {
                "duration": f"{total_steps * 2} minutes",  # Estimated
                "total_tests": total_steps,
                "passed_tests": successful_steps,
                "failed_tests": failed_steps,
                "error_tests": 0,
                "success_rate": success_rate,
                "passed_percentage": (successful_steps / total_steps * 100) if total_steps > 0 else 0,
                "failed_percentage": (failed_steps / total_steps * 100) if total_steps > 0 else 0,
                "error_percentage": 0,
                "browser": "Chrome",  # Default, could be extracted from browser config
                "browser_version": "119.0.6045.105",  # Default
                "os": "Windows 10",  # Default
                "framework": "Fagun Browser Automation Testing Agent",
                "execution_time": datetime.now().isoformat(),
                "test_data_source": "Automated Test Execution",
                "task_description": task_description,
                "performance_metrics": {
                    "avg_response_time": f"{avg_duration:.2f} seconds",
                    "max_response_time": f"{max_duration:.2f} seconds",
                    "min_response_time": f"{min_duration:.2f} seconds"
                },
                "test_cases": test_cases,
                "screenshots": screenshots,
                "bugs": bugs,
                "error_monitoring": {
                    "total_errors": error_summary['total_errors'],
                    "errors_by_type": error_summary['errors_by_type'],
                    "errors_by_severity": error_summary['errors_by_severity'],
                    "console_errors": error_summary['console_errors'],
                    "js_errors": error_summary['js_errors'],
                    "network_errors": error_summary['network_errors'],
                    "dom_errors": error_summary['dom_errors'],
                    "performance_issues": error_summary['performance_issues'],
                    "detailed_errors": [
                        {
                            "type": error.error_type,
                            "message": error.error_message,
                            "severity": error.severity,
                            "timestamp": error.timestamp.isoformat(),
                            "url": error.url,
                            "source": error.source,
                            "context": error.context
                        }
                        for error in all_errors
                    ]
                },
                "key_findings": [
                    f"Executed {total_steps} test steps successfully",
                    f"Achieved {success_rate:.1f}% success rate",
                    f"Captured {len(screenshots)} screenshots during testing",
                    f"Identified {len(bugs)} issues requiring attention",
                    f"Task completed: {task_description[:100]}{'...' if len(task_description) > 100 else ''}",
                    f"Advanced testing: {len(advanced_test_results)} comprehensive tests performed",
                    f"Enhanced AI testing: {len(enhanced_bugs)} bugs found by AI agents",
                    f"Security tests: {len([r for r in advanced_test_results if r.test_type.value == 'security'])}",
                    f"Broken URL checks: {len([r for r in advanced_test_results if r.test_type.value == 'broken_url'])}",
                    f"Grammar checks: {len([r for r in advanced_test_results if r.test_type.value == 'grammar'])}",
                    f"Form tests: {len([r for r in advanced_test_results if r.test_type.value == 'form_testing'])}",
                    f"Error monitoring: {error_summary['total_errors']} errors detected",
                    f"Console errors: {error_summary['console_errors']}",
                    f"JavaScript errors: {error_summary['js_errors']}",
                    f"Network errors: {error_summary['network_errors']}",
                    f"Performance issues: {error_summary['performance_issues']}"
                ],
                "recommendations": [
                    "Review failed test steps for potential improvements",
                    "Consider adding more error handling",
                    "Implement retry mechanisms for flaky tests",
                    "Regular monitoring of test execution performance"
                ],
                "notes": [
                    "This report was generated automatically by the Fagun Browser Automation Testing Agent.",
                    "All test results are based on actual execution data.",
                    "For questions or clarifications, please contact the test automation team."
                ]
            }
            
            logger.info(f"✅ Test data preparation completed successfully!")
            logger.info(f"📊 Final test data summary:")
            logger.info(f"  • Total tests: {total_steps}")
            logger.info(f"  • Passed tests: {successful_steps}")
            logger.info(f"  • Failed tests: {failed_steps}")
            logger.info(f"  • Success rate: {success_rate:.1f}%")
            logger.info(f"  • Bugs found: {len(bugs)}")
            logger.info(f"  • Test cases: {len(test_cases)}")
            logger.info(f"  • Enhanced AI bugs: {len(enhanced_bugs)}")
            logger.info(f"  • Advanced test results: {len(advanced_test_results)}")
            
            return test_data
            
        except Exception as e:
            logger.error(f"Error preparing test data for report: {str(e)}")
            import traceback
            logger.error(f"Full traceback: {traceback.format_exc()}")
            # Return minimal test data if preparation fails
            return {
                "duration": "Unknown",
                "total_tests": 0,
                "passed_tests": 0,
                "failed_tests": 0,
                "error_tests": 0,
                "success_rate": 0,
                "browser": "Unknown",
                "test_cases": [],
                "screenshots": [],
                "bugs": [],
                "key_findings": [f"Error preparing test data: {str(e)}"],
                "recommendations": ["Check test execution logs"],
                "notes": [f"Report generation encountered an error: {str(e)}"]
            }
