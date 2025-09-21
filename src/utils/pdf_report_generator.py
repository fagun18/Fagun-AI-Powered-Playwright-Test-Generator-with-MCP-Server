"""
🤖 Fagun Browser Automation Testing Agent - PDF Report Generator
===============================================================

Generates comprehensive PDF testing reports with screenshots, results, and analysis.

Author: Mejbaur Bahar Fagun
Role: Software Engineer in Test
LinkedIn: https://www.linkedin.com/in/mejbaur/
"""

import os
import json
import base64
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any, Optional
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, PageBreak
from reportlab.platypus.frames import Frame
from reportlab.platypus.doctemplate import PageTemplate, BaseDocTemplate
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
import io


class PDFReportGenerator:
    """Generates comprehensive PDF testing reports for the Fagun Browser Automation Testing Agent."""
    
    def __init__(self, output_dir: str = "reports"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()
    
    def _setup_custom_styles(self):
        """Setup custom styles for the PDF report."""
        # Title style
        self.styles.add(ParagraphStyle(
            name='CustomTitle',
            parent=self.styles['Title'],
            fontSize=24,
            spaceAfter=30,
            alignment=TA_CENTER,
            textColor=colors.HexColor('#2E86AB')
        ))
        
        # Heading styles
        self.styles.add(ParagraphStyle(
            name='CustomHeading1',
            parent=self.styles['Heading1'],
            fontSize=16,
            spaceAfter=12,
            spaceBefore=12,
            textColor=colors.HexColor('#2E86AB')
        ))
        
        self.styles.add(ParagraphStyle(
            name='CustomHeading2',
            parent=self.styles['Heading2'],
            fontSize=14,
            spaceAfter=8,
            spaceBefore=8,
            textColor=colors.HexColor('#A23B72')
        ))
        
        # Status styles
        self.styles.add(ParagraphStyle(
            name='SuccessStatus',
            parent=self.styles['Normal'],
            fontSize=12,
            textColor=colors.HexColor('#28A745'),
            backColor=colors.HexColor('#D4EDDA'),
            borderColor=colors.HexColor('#C3E6CB'),
            borderWidth=1,
            borderPadding=5
        ))
        
        self.styles.add(ParagraphStyle(
            name='FailedStatus',
            parent=self.styles['Normal'],
            fontSize=12,
            textColor=colors.HexColor('#DC3545'),
            backColor=colors.HexColor('#F8D7DA'),
            borderColor=colors.HexColor('#F5C6CB'),
            borderWidth=1,
            borderPadding=5
        ))
        
        self.styles.add(ParagraphStyle(
            name='ErrorStatus',
            parent=self.styles['Normal'],
            fontSize=12,
            textColor=colors.HexColor('#FFC107'),
            backColor=colors.HexColor('#FFF3CD'),
            borderColor=colors.HexColor('#FFEAA7'),
            borderWidth=1,
            borderPadding=5
        ))
    
    def generate_report(self, test_data: Dict[str, Any], output_filename: Optional[str] = None) -> str:
        """
        Generate a comprehensive PDF testing report.
        
        Args:
            test_data: Dictionary containing test execution data
            output_filename: Optional custom filename for the report
            
        Returns:
            Path to the generated PDF file
        """
        if not output_filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            output_filename = f"fagun_test_report_{timestamp}.pdf"
        
        output_path = self.output_dir / output_filename
        
        # Create PDF document
        doc = SimpleDocTemplate(
            str(output_path),
            pagesize=A4,
            rightMargin=72,
            leftMargin=72,
            topMargin=72,
            bottomMargin=18
        )
        
        # Build report content
        story = []
        
        # Add title page
        story.extend(self._create_title_page(test_data))
        story.append(PageBreak())
        
        # Add executive summary
        story.extend(self._create_executive_summary(test_data))
        story.append(PageBreak())
        
        # Add test results overview
        story.extend(self._create_test_results_overview(test_data))
        story.append(PageBreak())
        
        # Add detailed test results
        story.extend(self._create_detailed_test_results(test_data))
        story.append(PageBreak())
        
        # Add screenshots section
        story.extend(self._create_screenshots_section(test_data))
        story.append(PageBreak())
        
        # Add bugs and issues section
        story.extend(self._create_bugs_section(test_data))
        story.append(PageBreak())
        
        # Add error monitoring section
        story.extend(self._create_error_monitoring_section(test_data))
        story.append(PageBreak())
        
        # Add recommendations
        story.extend(self._create_recommendations_section(test_data))
        story.append(PageBreak())
        
        # Add technical details
        story.extend(self._create_technical_details(test_data))
        
        # Build PDF
        doc.build(story)
        
        return str(output_path)
    
    def _create_title_page(self, test_data: Dict[str, Any]) -> List:
        """Create the title page of the report."""
        story = []
        
        # Main title
        story.append(Paragraph("🤖 Fagun Browser Automation Testing Agent", self.styles['CustomTitle']))
        story.append(Spacer(1, 20))
        
        # Report title
        story.append(Paragraph("Comprehensive Testing Report", self.styles['CustomHeading1']))
        story.append(Spacer(1, 30))
        
        # Report metadata
        metadata = [
            ["Report Generated:", datetime.now().strftime("%Y-%m-%d %H:%M:%S")],
            ["Test Duration:", test_data.get('duration', 'N/A')],
            ["Total Tests:", str(test_data.get('total_tests', 0))],
            ["Passed Tests:", str(test_data.get('passed_tests', 0))],
            ["Failed Tests:", str(test_data.get('failed_tests', 0))],
            ["Error Tests:", str(test_data.get('error_tests', 0))],
            ["Success Rate:", f"{test_data.get('success_rate', 0):.1f}%"]
        ]
        
        metadata_table = Table(metadata, colWidths=[2*inch, 3*inch])
        metadata_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#F8F9FA')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 12),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('BACKGROUND', (1, 0), (1, -1), colors.white),
        ]))
        
        story.append(metadata_table)
        story.append(Spacer(1, 40))
        
        # Author information
        story.append(Paragraph("Report Generated By:", self.styles['CustomHeading2']))
        story.append(Paragraph("Mejbaur Bahar Fagun", self.styles['Normal']))
        story.append(Paragraph("Software Engineer in Test", self.styles['Normal']))
        story.append(Paragraph("LinkedIn: https://www.linkedin.com/in/mejbaur/", self.styles['Normal']))
        
        return story
    
    def _create_executive_summary(self, test_data: Dict[str, Any]) -> List:
        """Create the executive summary section."""
        story = []
        
        story.append(Paragraph("Executive Summary", self.styles['CustomHeading1']))
        story.append(Spacer(1, 12))
        
        # Summary statistics
        total_tests = test_data.get('total_tests', 0)
        passed_tests = test_data.get('passed_tests', 0)
        failed_tests = test_data.get('failed_tests', 0)
        error_tests = test_data.get('error_tests', 0)
        success_rate = test_data.get('success_rate', 0)
        
        summary_text = f"""
        This comprehensive testing report presents the results of automated browser testing 
        performed by the Fagun Browser Automation Testing Agent. The testing session included 
        {total_tests} total test cases, with {passed_tests} tests passing successfully, 
        {failed_tests} tests failing, and {error_tests} tests encountering errors.
        
        The overall success rate of {success_rate:.1f}% provides valuable insights into the 
        application's stability and functionality. This report includes detailed analysis of 
        each test case, screenshots of critical moments, identified bugs and issues, and 
        recommendations for improvement.
        """
        
        story.append(Paragraph(summary_text, self.styles['Normal']))
        story.append(Spacer(1, 20))
        
        # Key findings
        story.append(Paragraph("Key Findings", self.styles['CustomHeading2']))
        
        findings = test_data.get('key_findings', [])
        if not findings:
            findings = [
                f"Successfully executed {total_tests} automated test cases",
                f"Achieved {success_rate:.1f}% overall success rate",
                f"Identified {len(test_data.get('bugs', []))} potential issues requiring attention",
                f"Captured {len(test_data.get('screenshots', []))} screenshots for analysis"
            ]
        
        for finding in findings:
            story.append(Paragraph(f"• {finding}", self.styles['Normal']))
            story.append(Spacer(1, 6))
        
        return story
    
    def _create_test_results_overview(self, test_data: Dict[str, Any]) -> List:
        """Create the test results overview section."""
        story = []
        
        story.append(Paragraph("Test Results Overview", self.styles['CustomHeading1']))
        story.append(Spacer(1, 12))
        
        # Results summary table
        results_data = [
            ["Status", "Count", "Percentage", "Description"],
            ["✅ Passed", str(test_data.get('passed_tests', 0)), f"{test_data.get('passed_percentage', 0):.1f}%", "Tests completed successfully"],
            ["❌ Failed", str(test_data.get('failed_tests', 0)), f"{test_data.get('failed_percentage', 0):.1f}%", "Tests failed due to functional issues"],
            ["⚠️ Error", str(test_data.get('error_tests', 0)), f"{test_data.get('error_percentage', 0):.1f}%", "Tests encountered technical errors"],
            ["📊 Total", str(test_data.get('total_tests', 0)), "100.0%", "All test cases executed"]
        ]
        
        results_table = Table(results_data, colWidths=[1.5*inch, 1*inch, 1*inch, 2.5*inch])
        results_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2E86AB')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        story.append(results_table)
        story.append(Spacer(1, 20))
        
        # Performance metrics
        story.append(Paragraph("Performance Metrics", self.styles['CustomHeading2']))
        
        metrics = test_data.get('performance_metrics', {})
        avg_response_time = metrics.get('avg_response_time', 'N/A')
        max_response_time = metrics.get('max_response_time', 'N/A')
        min_response_time = metrics.get('min_response_time', 'N/A')
        
        metrics_text = f"""
        <b>Average Response Time:</b> {avg_response_time}<br/>
        <b>Maximum Response Time:</b> {max_response_time}<br/>
        <b>Minimum Response Time:</b> {min_response_time}<br/>
        <b>Test Duration:</b> {test_data.get('duration', 'N/A')}
        """
        
        story.append(Paragraph(metrics_text, self.styles['Normal']))
        
        return story
    
    def _create_detailed_test_results(self, test_data: Dict[str, Any]) -> List:
        """Create the detailed test results section."""
        story = []
        
        story.append(Paragraph("Detailed Test Results", self.styles['CustomHeading1']))
        story.append(Spacer(1, 12))
        
        test_cases = test_data.get('test_cases', [])
        
        for i, test_case in enumerate(test_cases, 1):
            # Test case header
            story.append(Paragraph(f"Test Case {i}: {test_case.get('name', 'Unnamed Test')}", self.styles['CustomHeading2']))
            
            # Test details
            details = [
                ["Status:", test_case.get('status', 'Unknown')],
                ["Duration:", test_case.get('duration', 'N/A')],
                ["Description:", test_case.get('description', 'No description available')],
                ["Expected Result:", test_case.get('expected_result', 'N/A')],
                ["Actual Result:", test_case.get('actual_result', 'N/A')]
            ]
            
            details_table = Table(details, colWidths=[1.5*inch, 4*inch])
            details_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#F8F9FA')),
                ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
                ('ALIGN', (0, 0), (0, -1), 'LEFT'),
                ('ALIGN', (1, 0), (1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                ('BACKGROUND', (1, 0), (1, -1), colors.white),
            ]))
            
            story.append(details_table)
            
            # Error details if any
            if test_case.get('error_message'):
                story.append(Spacer(1, 6))
                story.append(Paragraph("Error Details:", self.styles['CustomHeading2']))
                story.append(Paragraph(test_case.get('error_message', ''), self.styles['Normal']))
            
            story.append(Spacer(1, 20))
        
        return story
    
    def _create_screenshots_section(self, test_data: Dict[str, Any]) -> List:
        """Create the screenshots section."""
        story = []
        
        story.append(Paragraph("Screenshots and Visual Evidence", self.styles['CustomHeading1']))
        story.append(Spacer(1, 12))
        
        screenshots = test_data.get('screenshots', [])
        
        if not screenshots:
            story.append(Paragraph("No screenshots were captured during this testing session.", self.styles['Normal']))
            return story
        
        for i, screenshot in enumerate(screenshots, 1):
            story.append(Paragraph(f"Screenshot {i}: {screenshot.get('description', 'Test Screenshot')}", self.styles['CustomHeading2']))
            story.append(Spacer(1, 6))
            
            # Add screenshot if path exists
            screenshot_path = screenshot.get('path')
            if screenshot_path and os.path.exists(screenshot_path):
                try:
                    img = Image(screenshot_path, width=6*inch, height=4*inch)
                    story.append(img)
                except Exception as e:
                    story.append(Paragraph(f"Error loading screenshot: {str(e)}", self.styles['Normal']))
            else:
                story.append(Paragraph("Screenshot not available", self.styles['Normal']))
            
            story.append(Spacer(1, 12))
        
        return story
    
    def _create_bugs_section(self, test_data: Dict[str, Any]) -> List:
        """Create the bugs and issues section."""
        story = []
        
        story.append(Paragraph("Identified Bugs and Issues", self.styles['CustomHeading1']))
        story.append(Spacer(1, 12))
        
        bugs = test_data.get('bugs', [])
        
        if not bugs:
            story.append(Paragraph("No bugs or issues were identified during this testing session.", self.styles['Normal']))
            return story
        
        for i, bug in enumerate(bugs, 1):
            story.append(Paragraph(f"Bug {i}: {bug.get('title', 'Untitled Bug')}", self.styles['CustomHeading2']))
            
            bug_details = [
                ["Severity:", bug.get('severity', 'Unknown')],
                ["Status:", bug.get('status', 'Open')],
                ["Description:", bug.get('description', 'No description available')],
                ["Steps to Reproduce:", bug.get('steps_to_reproduce', 'N/A')],
                ["Expected Behavior:", bug.get('expected_behavior', 'N/A')],
                ["Actual Behavior:", bug.get('actual_behavior', 'N/A')]
            ]
            
            bug_table = Table(bug_details, colWidths=[1.5*inch, 4*inch])
            bug_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#F8F9FA')),
                ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
                ('ALIGN', (0, 0), (0, -1), 'LEFT'),
                ('ALIGN', (1, 0), (1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                ('BACKGROUND', (1, 0), (1, -1), colors.white),
            ]))
            
            story.append(bug_table)
            story.append(Spacer(1, 20))
        
        return story
    
    def _create_recommendations_section(self, test_data: Dict[str, Any]) -> List:
        """Create the recommendations section."""
        story = []
        
        story.append(Paragraph("Recommendations and Next Steps", self.styles['CustomHeading1']))
        story.append(Spacer(1, 12))
        
        recommendations = test_data.get('recommendations', [])
        
        if not recommendations:
            # Generate default recommendations based on test results
            success_rate = test_data.get('success_rate', 0)
            failed_tests = test_data.get('failed_tests', 0)
            error_tests = test_data.get('error_tests', 0)
            
            recommendations = []
            
            if success_rate < 80:
                recommendations.append("Focus on improving test stability and addressing failed test cases")
            
            if failed_tests > 0:
                recommendations.append("Investigate and fix the identified functional issues")
            
            if error_tests > 0:
                recommendations.append("Review and resolve technical errors in the test environment")
            
            recommendations.extend([
                "Implement continuous integration to catch issues early",
                "Consider adding more comprehensive test coverage",
                "Regular monitoring and maintenance of test automation suite"
            ])
        
        for i, recommendation in enumerate(recommendations, 1):
            story.append(Paragraph(f"{i}. {recommendation}", self.styles['Normal']))
            story.append(Spacer(1, 6))
        
        return story
    
    def _create_technical_details(self, test_data: Dict[str, Any]) -> List:
        """Create the technical details section."""
        story = []
        
        story.append(Paragraph("Technical Details", self.styles['CustomHeading1']))
        story.append(Spacer(1, 12))
        
        # Test environment details
        story.append(Paragraph("Test Environment", self.styles['CustomHeading2']))
        
        env_details = [
            ["Browser:", test_data.get('browser', 'Unknown')],
            ["Browser Version:", test_data.get('browser_version', 'Unknown')],
            ["Operating System:", test_data.get('os', 'Unknown')],
            ["Test Framework:", test_data.get('framework', 'Fagun Browser Automation Testing Agent')],
            ["Execution Time:", test_data.get('execution_time', 'N/A')],
            ["Test Data:", test_data.get('test_data_source', 'N/A')]
        ]
        
        env_table = Table(env_details, colWidths=[2*inch, 3*inch])
        env_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#F8F9FA')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (0, -1), 'LEFT'),
            ('ALIGN', (1, 0), (1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('BACKGROUND', (1, 0), (1, -1), colors.white),
        ]))
        
        story.append(env_table)
        story.append(Spacer(1, 20))
        
        # Additional notes
        story.append(Paragraph("Additional Notes", self.styles['CustomHeading2']))
        
        notes = test_data.get('notes', [
            "This report was generated automatically by the Fagun Browser Automation Testing Agent.",
            "All test results and screenshots are based on the actual execution data.",
            "For questions or clarifications, please contact the test automation team."
        ])
        
        for note in notes:
            story.append(Paragraph(f"• {note}", self.styles['Normal']))
            story.append(Spacer(1, 6))
        
        return story
    
    def _create_error_monitoring_section(self, test_data: Dict[str, Any]) -> List:
        """Create the error monitoring section."""
        story = []
        
        # Section title
        story.append(Paragraph("🔍 Error Monitoring & Detection", self.styles['Heading1']))
        story.append(Spacer(1, 12))
        
        error_monitoring = test_data.get("error_monitoring", {})
        
        if not error_monitoring or error_monitoring.get("total_errors", 0) == 0:
            story.append(Paragraph("No errors were detected during testing.", self.styles['Normal']))
            return story
        
        # Error summary
        story.append(Paragraph("Error Summary", self.styles['Heading2']))
        story.append(Spacer(1, 6))
        
        # Create error summary table
        error_summary_data = [
            ["Metric", "Count"],
            ["Total Errors", str(error_monitoring.get("total_errors", 0))],
            ["Console Errors", str(error_monitoring.get("console_errors", 0))],
            ["JavaScript Errors", str(error_monitoring.get("js_errors", 0))],
            ["Network Errors", str(error_monitoring.get("network_errors", 0))],
            ["DOM Errors", str(error_monitoring.get("dom_errors", 0))],
            ["Performance Issues", str(error_monitoring.get("performance_issues", 0))]
        ]
        
        error_summary_table = Table(error_summary_data, colWidths=[2*inch, 1*inch])
        error_summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2E86AB')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        story.append(error_summary_table)
        story.append(Spacer(1, 12))
        
        # Errors by type
        errors_by_type = error_monitoring.get("errors_by_type", {})
        if errors_by_type:
            story.append(Paragraph("Errors by Type", self.styles['Heading2']))
            story.append(Spacer(1, 6))
            
            type_data = [["Error Type", "Count"]]
            for error_type, count in errors_by_type.items():
                type_data.append([error_type.replace('_', ' ').title(), str(count)])
            
            type_table = Table(type_data, colWidths=[2*inch, 1*inch])
            type_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2E86AB')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            
            story.append(type_table)
            story.append(Spacer(1, 12))
        
        # Errors by severity
        errors_by_severity = error_monitoring.get("errors_by_severity", {})
        if errors_by_severity:
            story.append(Paragraph("Errors by Severity", self.styles['Heading2']))
            story.append(Spacer(1, 6))
            
            severity_data = [["Severity", "Count"]]
            for severity, count in errors_by_severity.items():
                severity_data.append([severity.title(), str(count)])
            
            severity_table = Table(severity_data, colWidths=[2*inch, 1*inch])
            severity_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2E86AB')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            
            story.append(severity_table)
            story.append(Spacer(1, 12))
        
        # Detailed errors
        detailed_errors = error_monitoring.get("detailed_errors", [])
        if detailed_errors:
            story.append(Paragraph("Detailed Error Information", self.styles['Heading2']))
            story.append(Spacer(1, 6))
            
            for i, error in enumerate(detailed_errors[:10], 1):  # Limit to first 10 errors
                story.append(Paragraph(f"Error {i}: {error.get('type', 'Unknown')}", self.styles['Heading3']))
                story.append(Paragraph(f"Message: {error.get('message', 'No message')}", self.styles['Normal']))
                story.append(Paragraph(f"Severity: {error.get('severity', 'Unknown')}", self.styles['Normal']))
                story.append(Paragraph(f"Timestamp: {error.get('timestamp', 'Unknown')}", self.styles['Normal']))
                story.append(Paragraph(f"URL: {error.get('url', 'Unknown')}", self.styles['Normal']))
                story.append(Paragraph(f"Source: {error.get('source', 'Unknown')}", self.styles['Normal']))
                story.append(Spacer(1, 6))
            
            if len(detailed_errors) > 10:
                story.append(Paragraph(f"... and {len(detailed_errors) - 10} more errors", self.styles['Normal']))
        
        return story


def create_sample_test_data() -> Dict[str, Any]:
    """Create sample test data for demonstration purposes."""
    return {
        'duration': '2 hours 15 minutes',
        'total_tests': 15,
        'passed_tests': 12,
        'failed_tests': 2,
        'error_tests': 1,
        'success_rate': 80.0,
        'passed_percentage': 80.0,
        'failed_percentage': 13.3,
        'error_percentage': 6.7,
        'browser': 'Chrome',
        'browser_version': '119.0.6045.105',
        'os': 'Windows 10',
        'framework': 'Fagun Browser Automation Testing Agent',
        'execution_time': '2024-01-15 14:30:00',
        'test_data_source': 'Production Environment',
        'performance_metrics': {
            'avg_response_time': '1.2 seconds',
            'max_response_time': '3.5 seconds',
            'min_response_time': '0.8 seconds'
        },
        'test_cases': [
            {
                'name': 'Login Functionality Test',
                'status': 'PASSED',
                'duration': '45 seconds',
                'description': 'Test user login with valid credentials',
                'expected_result': 'User should be logged in successfully',
                'actual_result': 'User logged in successfully'
            },
            {
                'name': 'Form Submission Test',
                'status': 'FAILED',
                'duration': '30 seconds',
                'description': 'Test form submission with required fields',
                'expected_result': 'Form should submit successfully',
                'actual_result': 'Form submission failed with validation error',
                'error_message': 'Required field "email" was not filled'
            },
            {
                'name': 'Navigation Test',
                'status': 'ERROR',
                'duration': '15 seconds',
                'description': 'Test page navigation functionality',
                'expected_result': 'Page should navigate to target URL',
                'actual_result': 'Navigation failed due to timeout',
                'error_message': 'Page load timeout after 30 seconds'
            }
        ],
        'screenshots': [
            {
                'description': 'Login page screenshot',
                'path': 'screenshots/login_page.png'
            },
            {
                'description': 'Form validation error',
                'path': 'screenshots/form_error.png'
            }
        ],
        'bugs': [
            {
                'title': 'Form validation not working properly',
                'severity': 'High',
                'status': 'Open',
                'description': 'Form allows submission without required fields',
                'steps_to_reproduce': '1. Navigate to form page\n2. Leave email field empty\n3. Click submit',
                'expected_behavior': 'Form should show validation error',
                'actual_behavior': 'Form submits with empty email field'
            }
        ],
        'key_findings': [
            'Login functionality works correctly',
            'Form validation has critical issues',
            'Navigation performance needs improvement',
            'Overall system stability is good'
        ],
        'recommendations': [
            'Fix form validation issues immediately',
            'Improve page load performance',
            'Add more comprehensive error handling',
            'Implement better user feedback for form errors'
        ],
        'notes': [
            'This report was generated automatically by the Fagun Browser Automation Testing Agent.',
            'All test results and screenshots are based on the actual execution data.',
            'For questions or clarifications, please contact the test automation team.'
        ]
    }


if __name__ == "__main__":
    # Example usage
    generator = PDFReportGenerator()
    sample_data = create_sample_test_data()
    report_path = generator.generate_report(sample_data)
    print(f"PDF report generated: {report_path}")
