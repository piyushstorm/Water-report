from django.utils import timezone
from datetime import timedelta
import random


def categorize_usage(usage, avg_usage=100):
    """Categorize water usage based on historical average"""
    if usage > avg_usage * 2:
        return "Critical"
    elif usage > avg_usage * 1.5:
        return "High"
    else:
        return "Normal"


class LeakageDetector:
    """Leakage detection utility"""
    
    @staticmethod
    def analyze_usage(user_id, current_usage, recent_usage, historical_avg):
        """
        Analyze water usage for potential leaks
        
        Args:
            user_id: User ID
            current_usage: Current usage value
            recent_usage: List of recent usage records
            historical_avg: Historical average usage
        
        Returns:
            dict: Analysis results with issues and severity
        """
        issues = []
        severity = "low"
        has_issues = False
        
        # Check for consistently high usage (potential leak indicator)
        if len(recent_usage) >= 5:
            high_usage_count = sum(1 for r in recent_usage[:5] if r.usage > historical_avg * 1.5)
            if high_usage_count >= 4:
                issues.append("Consistently high water usage detected over recent readings")
                severity = "high"
                has_issues = True
        
        # Check for unusual nighttime usage (leak indicator)
        nighttime_readings = [r for r in recent_usage if 0 <= r.timestamp.hour < 6]
        if nighttime_readings:
            avg_nighttime = sum(r.usage for r in nighttime_readings) / len(nighttime_readings)
            if avg_nighttime > historical_avg * 0.5:
                issues.append("Unusual water usage during nighttime hours detected")
                severity = "high" if severity != "critical" else "critical"
                has_issues = True
        
        # Check for sudden spike
        if current_usage > historical_avg * 3:
            issues.append(f"Sudden spike in water usage: {current_usage:.2f}L (avg: {historical_avg:.2f}L)")
            severity = "critical"
            has_issues = True
        
        # Check for gradual increase trend
        if len(recent_usage) >= 7:
            recent_7_avg = sum(r.usage for r in recent_usage[:7]) / 7
            if recent_7_avg > historical_avg * 1.8:
                issues.append("Water usage showing upward trend - possible leak developing")
                severity = "medium" if severity == "low" else severity
                has_issues = True
        
        return {
            "has_issues": has_issues,
            "issues": issues,
            "severity": severity,
            "current_usage": current_usage,
            "historical_avg": historical_avg,
            "analyzed_at": timezone.now().isoformat()
        }


class ReportGenerator:
    """Report generation utility"""
    
    @staticmethod
    def generate_csv_report(usage_data):
        """Generate CSV report from usage data"""
        import csv
        from io import StringIO
        
        output = StringIO()
        writer = csv.writer(output)
        
        # Write header
        writer.writerow(['Date', 'Time', 'Usage (L)', 'Category', 'Location'])
        
        # Write data
        for record in usage_data:
            writer.writerow([
                record.timestamp.strftime('%Y-%m-%d'),
                record.timestamp.strftime('%H:%M:%S'),
                f"{record.usage:.2f}",
                record.category,
                record.location or 'N/A'
            ])
        
        return output.getvalue()
    
    @staticmethod
    def generate_pdf_report(user_data, usage_data, report_type='monthly'):
        """Generate PDF report from usage data"""
        from reportlab.lib.pagesizes import letter, A4
        from reportlab.lib import colors
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import inch
        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
        from reportlab.lib.enums import TA_CENTER, TA_LEFT
        from io import BytesIO
        
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        elements = []
        styles = getSampleStyleSheet()
        
        # Title
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#1e40af'),
            spaceAfter=30,
            alignment=TA_CENTER
        )
        elements.append(Paragraph(f"Water Usage {report_type.capitalize()} Report", title_style))
        elements.append(Spacer(1, 0.3*inch))
        
        # User info
        info_style = styles['Normal']
        elements.append(Paragraph(f"<b>Name:</b> {user_data['name']}", info_style))
        elements.append(Paragraph(f"<b>Email:</b> {user_data['email']}", info_style))
        elements.append(Paragraph(f"<b>Report Generated:</b> {timezone.now().strftime('%Y-%m-%d %H:%M:%S')}", info_style))
        elements.append(Spacer(1, 0.5*inch))
        
        # Summary statistics
        if usage_data:
            total_usage = sum(r.usage for r in usage_data)
            avg_usage = total_usage / len(usage_data)
            max_usage = max(r.usage for r in usage_data)
            min_usage = min(r.usage for r in usage_data)
            
            elements.append(Paragraph("<b>Summary Statistics</b>", styles['Heading2']))
            summary_data = [
                ['Metric', 'Value'],
                ['Total Usage', f'{total_usage:.2f} L'],
                ['Average Usage', f'{avg_usage:.2f} L'],
                ['Maximum Usage', f'{max_usage:.2f} L'],
                ['Minimum Usage', f'{min_usage:.2f} L'],
                ['Total Records', str(len(usage_data))],
            ]
            
            summary_table = Table(summary_data, colWidths=[3*inch, 3*inch])
            summary_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            elements.append(summary_table)
            elements.append(Spacer(1, 0.5*inch))
        
        # Detailed usage table
        if usage_data:
            elements.append(Paragraph("<b>Detailed Usage Records</b>", styles['Heading2']))
            elements.append(Spacer(1, 0.2*inch))
            
            # Limit to first 50 records for PDF
            limited_data = usage_data[:50]
            table_data = [['Date', 'Time', 'Usage (L)', 'Category']]
            
            for record in limited_data:
                table_data.append([
                    record.timestamp.strftime('%Y-%m-%d'),
                    record.timestamp.strftime('%H:%M'),
                    f'{record.usage:.2f}',
                    record.category
                ])
            
            usage_table = Table(table_data, colWidths=[1.5*inch, 1.5*inch, 1.5*inch, 1.5*inch])
            usage_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e40af')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 10),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.white),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ('FONTSIZE', (0, 1), (-1, -1), 8),
            ]))
            elements.append(usage_table)
            
            if len(usage_data) > 50:
                elements.append(Spacer(1, 0.2*inch))
                elements.append(Paragraph(f"<i>Showing 50 of {len(usage_data)} records</i>", styles['Italic']))
        else:
            elements.append(Paragraph("No usage data available for this period.", styles['Normal']))
        
        # Build PDF (fixed - removed duplicate)
        doc.build(elements)
        buffer.seek(0)
        return buffer