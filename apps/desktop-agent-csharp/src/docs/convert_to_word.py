import os
import re
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH

def add_formatted_text(paragraph, text):
    """
    Tách các đoạn chữ in đậm (bọc trong **) và viết thường để áp dụng định dạng chuẩn Word.
    """
    parts = re.split(r'(\*\*.*?\*\*)', text)
    for part in parts:
        if part.startswith('**') and part.endswith('**'):
            # Bỏ ký tự ** ở đầu và cuối
            run = paragraph.add_run(part[2:-2])
            run.bold = True
        else:
            paragraph.add_run(part)

def convert_md_to_docx(md_path, docx_path):
    print(f"Starting conversion: {md_path} -> {docx_path}")
    
    if not os.path.exists(md_path):
        print(f"Error: Source file not found {md_path}")
        return
        
    doc = Document()
    
    # Thiết lập Font chữ mặc định cho toàn bộ tài liệu (Calibri)
    style = doc.styles['Normal']
    font = style.font
    font.name = 'Calibri'
    font.size = Pt(11)
    font.color.rgb = RGBColor(51, 51, 51) # Màu xám đậm chuyên nghiệp
    
    with open(md_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    in_table = False
    table_lines = []
    
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        
        # 1. Xử lý bảng biểu (Table)
        if line.startswith('|'):
            in_table = True
            table_lines.append(line)
            i += 1
            continue
        elif in_table:
            # Đã đi qua hết các dòng của bảng hiện tại, tiến hành ghi bảng vào Word
            in_table = False
            parse_and_write_table(doc, table_lines)
            table_lines = []
            
        # Bỏ qua các dòng trống
        if not line:
            i += 1
            continue
            
        # 2. Xử lý Tiêu đề chính (Heading 1)
        if line.startswith('# '):
            title_text = line[2:].strip()
            p = doc.add_paragraph()
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            run = p.add_run(title_text)
            run.font.size = Pt(20)
            run.font.bold = True
            run.font.color.rgb = RGBColor(31, 78, 121) # Màu xanh Navy đậm
            p.paragraph_format.space_after = Pt(12)
            
        # 3. Xử lý Tiêu đề cấp 2 (Heading 2)
        elif line.startswith('## '):
            h_text = line[3:].strip()
            p = doc.add_heading(level=2)
            run = p.add_run(h_text)
            run.font.size = Pt(14)
            run.font.bold = True
            run.font.color.rgb = RGBColor(31, 78, 121)
            p.paragraph_format.space_before = Pt(12)
            p.paragraph_format.space_after = Pt(6)
            
        # 4. Xử lý Tiêu đề cấp 3 (Heading 3)
        elif line.startswith('### '):
            h_text = line[4:].strip()
            p = doc.add_heading(level=3)
            run = p.add_run(h_text)
            run.font.size = Pt(12)
            run.font.bold = True
            run.font.color.rgb = RGBColor(89, 89, 89) # Xám đậm trung tính
            p.paragraph_format.space_before = Pt(8)
            p.paragraph_format.space_after = Pt(4)
            
        # 5. Xử lý Đường phân cách (Horizontal Rule)
        elif line == '---':
            p = doc.add_paragraph()
            run = p.add_run("__________________________________________________________________")
            run.font.color.rgb = RGBColor(200, 200, 200)
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p.paragraph_format.space_after = Pt(12)
            
        # 6. Xử lý Danh sách (Bullet List)
        elif line.startswith('* ') or line.startswith('- '):
            list_text = line[2:].strip()
            # Dọn dẹp ký tự task list [x] hoặc [ ] nếu có
            if list_text.startswith('[x]'):
                list_text = "[Đã duyệt] " + list_text[3:].strip()
            elif list_text.startswith('[ ]'):
                list_text = "[Chưa duyệt] " + list_text[3:].strip()
                
            p = doc.add_paragraph(style='List Bullet')
            add_formatted_text(p, list_text)
            p.paragraph_format.space_after = Pt(3)
            
        # 7. Xử lý đoạn văn thường (Paragraph)
        else:
            p = doc.add_paragraph()
            add_formatted_text(p, line)
            p.paragraph_format.space_after = Pt(6)
            
        i += 1
        
    # Trường hợp file kết thúc bằng một bảng
    if in_table and table_lines:
        parse_and_write_table(doc, table_lines)

    # Lưu file
    doc.save(docx_path)
    print(f"Successfully created Word file at: {docx_path}")

def parse_and_write_table(doc, lines):
    """
    Xử lý danh sách các dòng markdown đại diện cho bảng và viết vào file Word.
    """
    valid_rows = []
    for line in lines:
        # Tách các cột dựa trên ký tự |
        cols = [c.strip() for c in line.split('|')]
        # Bỏ phần tử trống ở đầu và cuối do dòng MD bắt đầu và kết thúc bằng |
        if len(cols) >= 2:
            cols = cols[1:-1]
            
        # Bỏ qua dòng kẻ ngang phân cách tiêu đề (ví dụ: | :--- | :--- |)
        if all(re.match(r'^[\s\-:]+$', c) for c in cols):
            continue
            
        valid_rows.append(cols)
        
    if not valid_rows:
        return
        
    num_rows = len(valid_rows)
    num_cols = len(valid_rows[0])
    
    # Tạo bảng trong Word
    table = doc.add_table(rows=num_rows, cols=num_cols)
    table.style = 'Light Shading Accent 1' # Kiểu bảng chuyên nghiệp có sẵn trong Word
    
    for r_idx, row_data in enumerate(valid_rows):
        row = table.rows[r_idx]
        for c_idx, cell_value in enumerate(row_data):
            cell = row.cells[c_idx]
            p = cell.paragraphs[0]
            # Nếu là dòng tiêu đề (Header)
            if r_idx == 0:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                run = p.add_run(cell_value.replace('**', ''))
                run.bold = True
                run.font.color.rgb = RGBColor(255, 255, 255) # Chữ trắng trên nền xanh của Accent 1
            else:
                add_formatted_text(p, cell_value)

if __name__ == "__main__":
    md_file = r"c:\Git cua tui\Offline-Agent-CSharp\docs\ba_report_local_agent.md"
    docx_file = r"c:\Git cua tui\Offline-Agent-CSharp\docs\ba_report_local_agent.docx"
    convert_md_to_docx(md_file, docx_file)
