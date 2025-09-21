"""
🤖 Fagun Browser Automation Testing Agent - Error Detection & Monitoring
======================================================================

Advanced error detection and monitoring system that catches all types of errors
during testing including console errors, JavaScript errors, network errors, DOM errors,
and performance issues.

Author: Mejbaur Bahar Fagun
Role: Software Engineer in Test
LinkedIn: https://www.linkedin.com/in/mejbaur/
"""

import asyncio
import json
import time
from typing import List, Dict, Any, Optional, Callable
from playwright.async_api import Page, BrowserContext, CDPSession
from dataclasses import dataclass, field
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


@dataclass
class ErrorInfo:
    """Information about an error that occurred."""
    error_type: str
    error_message: str
    error_stack: str
    timestamp: datetime
    url: str
    source: str  # 'console', 'javascript', 'network', 'dom', 'performance'
    severity: str  # 'low', 'medium', 'high', 'critical'
    context: Dict[str, Any] = field(default_factory=dict)


class ErrorMonitor:
    """Advanced error monitoring system."""
    
    def __init__(self):
        self.errors: List[ErrorInfo] = []
        self.console_errors: List[ErrorInfo] = []
        self.js_errors: List[ErrorInfo] = []
        self.network_errors: List[ErrorInfo] = []
        self.dom_errors: List[ErrorInfo] = []
        self.performance_issues: List[ErrorInfo] = []
        self.cdp_session: Optional[CDPSession] = None
        self.monitoring_active = False
        
    async def start_monitoring(self, page: Page) -> None:
        """Start comprehensive error monitoring."""
        try:
            self.monitoring_active = True
            
            # Get CDP session for advanced monitoring
            self.cdp_session = await page.context.new_cdp_session(page)
            
            # Set up console error monitoring
            await self._setup_console_monitoring()
            
            # Set up JavaScript error monitoring
            await self._setup_javascript_monitoring()
            
            # Set up network error monitoring
            await self._setup_network_monitoring()
            
            # Set up DOM error monitoring
            await self._setup_dom_monitoring()
            
            # Set up performance monitoring
            await self._setup_performance_monitoring()
            
            # Inject error detection script
            await self._inject_error_detection_script(page)
            
            logger.info("🔍 Error monitoring started successfully")
            
        except Exception as e:
            logger.error(f"Failed to start error monitoring: {e}")
    
    async def stop_monitoring(self) -> None:
        """Stop error monitoring."""
        self.monitoring_active = False
        if self.cdp_session:
            try:
                await self.cdp_session.detach()
            except Exception as e:
                logger.warning(f"Error detaching CDP session: {e}")
        logger.info("🛑 Error monitoring stopped")
    
    async def _setup_console_monitoring(self) -> None:
        """Set up console error monitoring."""
        if not self.cdp_session:
            return
            
        try:
            # Enable console domain
            await self.cdp_session.send("Runtime.enable")
            await self.cdp_session.send("Console.enable")
            
            # Set up console message handler
            self.cdp_session.on("Runtime.consoleAPICalled", self._handle_console_message)
            self.cdp_session.on("Runtime.exceptionThrown", self._handle_runtime_exception)
            
        except Exception as e:
            logger.error(f"Failed to setup console monitoring: {e}")
    
    async def _setup_javascript_monitoring(self) -> None:
        """Set up JavaScript error monitoring."""
        if not self.cdp_session:
            return
            
        try:
            # Enable runtime domain for JS errors
            await self.cdp_session.send("Runtime.enable")
            
            # Set up exception handler
            self.cdp_session.on("Runtime.exceptionThrown", self._handle_javascript_exception)
            
        except Exception as e:
            logger.error(f"Failed to setup JavaScript monitoring: {e}")
    
    async def _setup_network_monitoring(self) -> None:
        """Set up network error monitoring."""
        if not self.cdp_session:
            return
            
        try:
            # Enable network domain
            await self.cdp_session.send("Network.enable")
            
            # Set up network event handlers
            self.cdp_session.on("Network.responseReceived", self._handle_network_response)
            self.cdp_session.on("Network.loadingFailed", self._handle_network_failure)
            self.cdp_session.on("Network.requestWillBeSent", self._handle_network_request)
            
        except Exception as e:
            logger.error(f"Failed to setup network monitoring: {e}")
    
    async def _setup_dom_monitoring(self) -> None:
        """Set up DOM error monitoring."""
        if not self.cdp_session:
            return
            
        try:
            # Enable DOM domain
            await self.cdp_session.send("DOM.enable")
            
            # Set up DOM event handlers
            self.cdp_session.on("DOM.documentUpdated", self._handle_dom_update)
            
        except Exception as e:
            logger.error(f"Failed to setup DOM monitoring: {e}")
    
    async def _setup_performance_monitoring(self) -> None:
        """Set up performance monitoring."""
        if not self.cdp_session:
            return
            
        try:
            # Enable performance domain
            await self.cdp_session.send("Performance.enable")
            
            # Set up performance event handlers
            self.cdp_session.on("Performance.metrics", self._handle_performance_metrics)
            
        except Exception as e:
            logger.error(f"Failed to setup performance monitoring: {e}")
    
    async def _inject_error_detection_script(self, page: Page) -> None:
        """Inject comprehensive error detection script."""
        error_detection_script = """
        (function() {
            // Store original error handlers
            const originalError = window.onerror;
            const originalUnhandledRejection = window.onunhandledrejection;
            
            // Global error handler
            window.onerror = function(message, source, lineno, colno, error) {
                const errorInfo = {
                    type: 'javascript_error',
                    message: message,
                    source: source,
                    line: lineno,
                    column: colno,
                    stack: error ? error.stack : null,
                    timestamp: new Date().toISOString(),
                    url: window.location.href
                };
                
                // Send to monitoring system
                if (window.fagunErrorMonitor) {
                    window.fagunErrorMonitor.reportError(errorInfo);
                }
                
                // Call original handler if it exists
                if (originalError) {
                    return originalError.apply(this, arguments);
                }
                
                return false;
            };
            
            // Unhandled promise rejection handler
            window.onunhandledrejection = function(event) {
                const errorInfo = {
                    type: 'unhandled_promise_rejection',
                    message: event.reason ? event.reason.toString() : 'Unknown promise rejection',
                    stack: event.reason && event.reason.stack ? event.reason.stack : null,
                    timestamp: new Date().toISOString(),
                    url: window.location.href
                };
                
                // Send to monitoring system
                if (window.fagunErrorMonitor) {
                    window.fagunErrorMonitor.reportError(errorInfo);
                }
                
                // Call original handler if it exists
                if (originalUnhandledRejection) {
                    return originalUnhandledRejection.apply(this, arguments);
                }
            };
            
            // Monitor console errors
            const originalConsoleError = console.error;
            console.error = function(...args) {
                const errorInfo = {
                    type: 'console_error',
                    message: args.join(' '),
                    timestamp: new Date().toISOString(),
                    url: window.location.href
                };
                
                // Send to monitoring system
                if (window.fagunErrorMonitor) {
                    window.fagunErrorMonitor.reportError(errorInfo);
                }
                
                // Call original console.error
                return originalConsoleError.apply(this, args);
            };
            
            // Monitor console warnings
            const originalConsoleWarn = console.warn;
            console.warn = function(...args) {
                const errorInfo = {
                    type: 'console_warning',
                    message: args.join(' '),
                    timestamp: new Date().toISOString(),
                    url: window.location.href
                };
                
                // Send to monitoring system
                if (window.fagunErrorMonitor) {
                    window.fagunErrorMonitor.reportError(errorInfo);
                }
                
                // Call original console.warn
                return originalConsoleWarn.apply(this, args);
            };
            
            // Monitor resource loading errors
            window.addEventListener('error', function(event) {
                if (event.target !== window) {
                    const errorInfo = {
                        type: 'resource_error',
                        message: `Failed to load ${event.target.tagName}: ${event.target.src || event.target.href}`,
                        element: event.target.tagName,
                        source: event.target.src || event.target.href,
                        timestamp: new Date().toISOString(),
                        url: window.location.href
                    };
                    
                    // Send to monitoring system
                    if (window.fagunErrorMonitor) {
                        window.fagunErrorMonitor.reportError(errorInfo);
                    }
                }
            }, true);
            
            // Monitor network errors
            const originalFetch = window.fetch;
            window.fetch = function(...args) {
                return originalFetch.apply(this, args).catch(error => {
                    const errorInfo = {
                        type: 'fetch_error',
                        message: error.message,
                        url: args[0],
                        timestamp: new Date().toISOString(),
                        currentUrl: window.location.href
                    };
                    
                    // Send to monitoring system
                    if (window.fagunErrorMonitor) {
                        window.fagunErrorMonitor.reportError(errorInfo);
                    }
                    
                    throw error;
                });
            };
            
            // Monitor XMLHttpRequest errors
            const originalXHROpen = XMLHttpRequest.prototype.open;
            XMLHttpRequest.prototype.open = function(method, url, ...args) {
                this._fagunUrl = url;
                return originalXHROpen.apply(this, [method, url, ...args]);
            };
            
            const originalXHRSend = XMLHttpRequest.prototype.send;
            XMLHttpRequest.prototype.send = function(...args) {
                this.addEventListener('error', function() {
                    const errorInfo = {
                        type: 'xhr_error',
                        message: 'XMLHttpRequest failed',
                        url: this._fagunUrl,
                        timestamp: new Date().toISOString(),
                        currentUrl: window.location.href
                    };
                    
                    // Send to monitoring system
                    if (window.fagunErrorMonitor) {
                        window.fagunErrorMonitor.reportError(errorInfo);
                    }
                });
                
                return originalXHRSend.apply(this, args);
            };
            
            // Monitor performance issues
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (entry.entryType === 'measure' && entry.duration > 1000) {
                        const errorInfo = {
                            type: 'performance_issue',
                            message: `Slow operation: ${entry.name} took ${entry.duration}ms`,
                            duration: entry.duration,
                            timestamp: new Date().toISOString(),
                            url: window.location.href
                        };
                        
                        // Send to monitoring system
                        if (window.fagunErrorMonitor) {
                            window.fagunErrorMonitor.reportError(errorInfo);
                        }
                    }
                }
            });
            
            observer.observe({ entryTypes: ['measure', 'navigation', 'resource'] });
            
            // Create error monitor object
            window.fagunErrorMonitor = {
                errors: [],
                reportError: function(errorInfo) {
                    this.errors.push(errorInfo);
                    console.log('Fagun Error Monitor:', errorInfo);
                },
                getErrors: function() {
                    return this.errors;
                },
                clearErrors: function() {
                    this.errors = [];
                }
            };
            
            console.log('Fagun Error Monitor initialized');
        })();
        """
        
        try:
            await page.add_init_script(error_detection_script)
            logger.info("🔍 Error detection script injected successfully")
        except Exception as e:
            logger.error(f"Failed to inject error detection script: {e}")
    
    def _handle_console_message(self, event: Dict[str, Any]) -> None:
        """Handle console messages."""
        try:
            if event.get('type') in ['error', 'warning']:
                error_info = ErrorInfo(
                    error_type=event.get('type', 'unknown'),
                    error_message=event.get('args', [{}])[0].get('value', 'Unknown console message'),
                    error_stack='',
                    timestamp=datetime.now(),
                    url='',
                    source='console',
                    severity='medium' if event.get('type') == 'warning' else 'high',
                    context={'console_event': event}
                )
                self.console_errors.append(error_info)
                self.errors.append(error_info)
                logger.warning(f"Console {event.get('type')}: {error_info.error_message}")
        except Exception as e:
            logger.error(f"Error handling console message: {e}")
    
    def _handle_runtime_exception(self, event: Dict[str, Any]) -> None:
        """Handle runtime exceptions."""
        try:
            exception_details = event.get('exceptionDetails', {})
            error_info = ErrorInfo(
                error_type='runtime_exception',
                error_message=exception_details.get('text', 'Unknown runtime exception'),
                error_stack=exception_details.get('stackTrace', {}).get('callFrames', []),
                timestamp=datetime.now(),
                url='',
                source='javascript',
                severity='high',
                context={'exception_details': exception_details}
            )
            self.js_errors.append(error_info)
            self.errors.append(error_info)
            logger.error(f"Runtime exception: {error_info.error_message}")
        except Exception as e:
            logger.error(f"Error handling runtime exception: {e}")
    
    def _handle_javascript_exception(self, event: Dict[str, Any]) -> None:
        """Handle JavaScript exceptions."""
        try:
            exception_details = event.get('exceptionDetails', {})
            error_info = ErrorInfo(
                error_type='javascript_exception',
                error_message=exception_details.get('text', 'Unknown JavaScript exception'),
                error_stack=exception_details.get('stackTrace', {}).get('callFrames', []),
                timestamp=datetime.now(),
                url='',
                source='javascript',
                severity='high',
                context={'exception_details': exception_details}
            )
            self.js_errors.append(error_info)
            self.errors.append(error_info)
            logger.error(f"JavaScript exception: {error_info.error_message}")
        except Exception as e:
            logger.error(f"Error handling JavaScript exception: {e}")
    
    def _handle_network_response(self, event: Dict[str, Any]) -> None:
        """Handle network responses."""
        try:
            response = event.get('response', {})
            status = response.get('status', 0)
            
            if status >= 400:
                error_info = ErrorInfo(
                    error_type='network_error',
                    error_message=f"HTTP {status} error for {response.get('url', 'unknown URL')}",
                    error_stack='',
                    timestamp=datetime.now(),
                    url=response.get('url', ''),
                    source='network',
                    severity='high' if status >= 500 else 'medium',
                    context={'status': status, 'response': response}
                )
                self.network_errors.append(error_info)
                self.errors.append(error_info)
                logger.warning(f"Network error: {error_info.error_message}")
        except Exception as e:
            logger.error(f"Error handling network response: {e}")
    
    def _handle_network_failure(self, event: Dict[str, Any]) -> None:
        """Handle network failures."""
        try:
            error_info = ErrorInfo(
                error_type='network_failure',
                error_message=f"Network failure: {event.get('errorText', 'Unknown network failure')}",
                error_stack='',
                timestamp=datetime.now(),
                url=event.get('requestId', ''),
                source='network',
                severity='high',
                context={'failure_event': event}
            )
            self.network_errors.append(error_info)
            self.errors.append(error_info)
            logger.error(f"Network failure: {error_info.error_message}")
        except Exception as e:
            logger.error(f"Error handling network failure: {e}")
    
    def _handle_network_request(self, event: Dict[str, Any]) -> None:
        """Handle network requests."""
        try:
            request = event.get('request', {})
            # Log request for debugging
            logger.debug(f"Network request: {request.get('method', 'GET')} {request.get('url', '')}")
        except Exception as e:
            logger.error(f"Error handling network request: {e}")
    
    def _handle_dom_update(self, event: Dict[str, Any]) -> None:
        """Handle DOM updates."""
        try:
            # Monitor for DOM-related issues
            logger.debug("DOM document updated")
        except Exception as e:
            logger.error(f"Error handling DOM update: {e}")
    
    def _handle_performance_metrics(self, event: Dict[str, Any]) -> None:
        """Handle performance metrics."""
        try:
            metrics = event.get('metrics', [])
            for metric in metrics:
                if metric.get('name') == 'TaskDuration' and metric.get('value', 0) > 1000:
                    error_info = ErrorInfo(
                        error_type='performance_issue',
                        error_message=f"Slow task detected: {metric.get('value', 0)}ms",
                        error_stack='',
                        timestamp=datetime.now(),
                        url='',
                        source='performance',
                        severity='medium',
                        context={'metric': metric}
                    )
                    self.performance_issues.append(error_info)
                    self.errors.append(error_info)
                    logger.warning(f"Performance issue: {error_info.error_message}")
        except Exception as e:
            logger.error(f"Error handling performance metrics: {e}")
    
    async def get_injected_errors(self, page: Page) -> List[ErrorInfo]:
        """Get errors from the injected error detection script."""
        try:
            errors = await page.evaluate("""
                () => {
                    if (window.fagunErrorMonitor) {
                        return window.fagunErrorMonitor.getErrors();
                    }
                    return [];
                }
            """)
            
            error_infos = []
            for error in errors:
                error_info = ErrorInfo(
                    error_type=error.get('type', 'unknown'),
                    error_message=error.get('message', 'Unknown error'),
                    error_stack=error.get('stack', ''),
                    timestamp=datetime.fromisoformat(error.get('timestamp', datetime.now().isoformat())),
                    url=error.get('url', ''),
                    source='injected_script',
                    severity=self._determine_severity(error.get('type', 'unknown')),
                    context={'injected_error': error}
                )
                error_infos.append(error_info)
            
            return error_infos
            
        except Exception as e:
            logger.error(f"Error getting injected errors: {e}")
            return []
    
    def _determine_severity(self, error_type: str) -> str:
        """Determine error severity based on type."""
        severity_map = {
            'javascript_error': 'high',
            'unhandled_promise_rejection': 'high',
            'console_error': 'medium',
            'console_warning': 'low',
            'resource_error': 'medium',
            'fetch_error': 'medium',
            'xhr_error': 'medium',
            'performance_issue': 'low',
            'network_error': 'high',
            'network_failure': 'high'
        }
        return severity_map.get(error_type, 'medium')
    
    def get_all_errors(self) -> List[ErrorInfo]:
        """Get all collected errors."""
        return self.errors
    
    def get_errors_by_type(self, error_type: str) -> List[ErrorInfo]:
        """Get errors by type."""
        return [error for error in self.errors if error.error_type == error_type]
    
    def get_errors_by_severity(self, severity: str) -> List[ErrorInfo]:
        """Get errors by severity."""
        return [error for error in self.errors if error.severity == severity]
    
    def get_error_summary(self) -> Dict[str, Any]:
        """Get error summary statistics."""
        total_errors = len(self.errors)
        errors_by_type = {}
        errors_by_severity = {}
        
        for error in self.errors:
            # Count by type
            errors_by_type[error.error_type] = errors_by_type.get(error.error_type, 0) + 1
            
            # Count by severity
            errors_by_severity[error.severity] = errors_by_severity.get(error.severity, 0) + 1
        
        return {
            'total_errors': total_errors,
            'errors_by_type': errors_by_type,
            'errors_by_severity': errors_by_severity,
            'console_errors': len(self.console_errors),
            'js_errors': len(self.js_errors),
            'network_errors': len(self.network_errors),
            'dom_errors': len(self.dom_errors),
            'performance_issues': len(self.performance_issues)
        }
    
    def clear_errors(self) -> None:
        """Clear all collected errors."""
        self.errors.clear()
        self.console_errors.clear()
        self.js_errors.clear()
        self.network_errors.clear()
        self.dom_errors.clear()
        self.performance_issues.clear()


# Global error monitor instance
error_monitor = ErrorMonitor()
