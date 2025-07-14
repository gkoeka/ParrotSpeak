#!/usr/bin/env python3
"""
Generate PDF and HTML versions of legal documents
"""

import markdown
from weasyprint import HTML, CSS
from pathlib import Path
import os

def create_pdf_from_markdown(md_file, output_dir, title):
    """Convert markdown to PDF with styling"""
    
    # Read markdown content
    with open(md_file, 'r', encoding='utf-8') as f:
        md_content = f.read()
    
    # Convert markdown to HTML
    html_content = markdown.markdown(md_content, extensions=['toc'])
    
    # Create styled HTML
    styled_html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>{title}</title>
        <meta charset="utf-8">
        <style>
            @page {{
                size: A4;
                margin: 1in;
                @bottom-center {{
                    content: "Page " counter(page) " of " counter(pages);
                    font-size: 10px;
                    color: #666;
                }}
            }}
            body {{
                font-family: 'Times New Roman', serif;
                font-size: 11px;
                line-height: 1.6;
                color: #333;
                max-width: none;
            }}
            h1 {{
                color: #2c3e50;
                font-size: 18px;
                margin-bottom: 20px;
                padding-bottom: 10px;
                border-bottom: 2px solid #3498db;
                text-align: center;
            }}
            h2 {{
                color: #34495e;
                font-size: 14px;
                margin-top: 25px;
                margin-bottom: 10px;
                page-break-after: avoid;
            }}
            h3 {{
                color: #7f8c8d;
                font-size: 12px;
                margin-top: 15px;
                margin-bottom: 8px;
            }}
            p {{
                margin-bottom: 10px;
                text-align: justify;
            }}
            ul, ol {{
                margin-left: 20px;
                margin-bottom: 10px;
            }}
            li {{
                margin-bottom: 4px;
            }}
            .header {{
                text-align: center;
                margin-bottom: 30px;
            }}
            .footer {{
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #ccc;
                text-align: center;
                font-size: 10px;
                color: #666;
            }}
        </style>
    </head>
    <body>
        <div class="header">
            <h1>{title}</h1>
            <p><strong>ParrotSpeak - AI-Powered Translation Platform</strong></p>
        </div>
        {html_content}
        <div class="footer">
            <p>© 2025 ParrotSpeak. All rights reserved.</p>
            <p>Generated on: {os.popen('date').read().strip()}</p>
        </div>
    </body>
    </html>
    """
    
    # Create output directory
    Path(output_dir).mkdir(exist_ok=True)
    
    # Save HTML version
    html_file = Path(output_dir) / f"{md_file.stem}.html"
    with open(html_file, 'w', encoding='utf-8') as f:
        f.write(styled_html)
    
    # Generate PDF
    pdf_file = Path(output_dir) / f"{md_file.stem}.pdf"
    HTML(string=styled_html).write_pdf(pdf_file)
    
    return html_file, pdf_file

def main():
    """Generate all legal documents"""
    print("🔄 Generating legal documents...")
    
    # Create output directory
    output_dir = "docs/legal-pdfs"
    Path(output_dir).mkdir(exist_ok=True)
    
    # Generate Privacy Policy
    print("📄 Processing Privacy Policy...")
    privacy_html, privacy_pdf = create_pdf_from_markdown(
        Path("docs/privacy-policy.md"),
        output_dir,
        "Privacy Policy"
    )
    print(f"✅ Created: {privacy_html}")
    print(f"✅ Created: {privacy_pdf}")
    
    # Generate Terms of Service
    print("📄 Processing Terms of Service...")
    terms_html, terms_pdf = create_pdf_from_markdown(
        Path("docs/terms-of-service.md"),
        output_dir,
        "Terms of Service"
    )
    print(f"✅ Created: {terms_html}")
    print(f"✅ Created: {terms_pdf}")
    
    print("\n🎉 All legal documents generated successfully!")
    print(f"📁 Output directory: {output_dir}")
    
    # List generated files
    print("\n📋 Generated files:")
    for file in Path(output_dir).glob("*"):
        size_kb = file.stat().st_size / 1024
        print(f"   {file.name} ({size_kb:.1f} KB)")

if __name__ == "__main__":
    main()