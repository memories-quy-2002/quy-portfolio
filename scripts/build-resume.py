"""Build a concise, ATS-readable CV from user-confirmed portfolio details."""
from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.colors import HexColor
from reportlab.lib.utils import simpleSplit
ROOT=Path(__file__).resolve().parents[1]
OUTPUT=ROOT/'public/assets/documents/quy-nguyen-cv.pdf'
OUTPUT.parent.mkdir(parents=True,exist_ok=True)
FONT_ROOT=Path('/usr/share/fonts/truetype/dejavu')
for name,file in [('Body','DejaVuSans.ttf'),('Bold','DejaVuSans-Bold.ttf')]:
    pdfmetrics.registerFont(TTFont(name,str(FONT_ROOT/file)))
PAGE_W,PAGE_H=595.28,841.89
c=canvas.Canvas(str(OUTPUT),pagesize=(PAGE_W,PAGE_H))
c.setTitle('Quý Nguyễn - Software Engineer CV')
c.setAuthor('Quý Nguyễn')
y=PAGE_H-38
LEFT=43
WIDTH=PAGE_W-LEFT*2

def text(value,size=8.2,bold=False,color='#263345',gap=2):
    """Wrap text to the content width and preserve a compact reading rhythm."""
    global y
    font='Bold' if bold else 'Body'
    c.setFont(font,size);c.setFillColor(HexColor(color))
    for line in simpleSplit(value,font,size,WIDTH):
        c.drawString(LEFT,y,line);y-=size*1.28
    y-=gap

def section(title):
    global y
    y-=4
    c.setStrokeColor(HexColor('#D9E2E9'));c.line(LEFT,y+7,PAGE_W-LEFT,y+7)
    text(title,9,True,'#16726E',3)

def bullet(value):
    text('• '+value,7.8,gap=1)

text('Quý Nguyễn',21,True,'#102638',1)
text('Software Engineer | Full-Stack Developer | Ho Chi Minh City, Vietnam',9.1,True,gap=2)
text('linkedin.com/in/memories2002  ·  github.com/memories-quy-2002',8.2,color='#16726E',gap=4)
c.linkURL('https://www.linkedin.com/in/memories2002/',(LEFT,y+4,LEFT+220,y+16),relative=0)
c.linkURL('https://github.com/memories-quy-2002',(LEFT+220,y+4,PAGE_W-LEFT,y+16),relative=0)
section('PROFILE')
text('Software engineer at FPT Software with a Computer Science background and hands-on experience across Node.js backend services and React applications. Builds maintainable APIs and full-stack products with TypeScript, relational databases, automated tests, and CI/CD.',8.2)
section('TECHNICAL SKILLS')
text('TypeScript, Node.js, Express.js, NestJS, React | PostgreSQL, MySQL, Prisma, Redis | REST APIs, Kafka, gRPC | Docker, GitLab CI/CD, GitHub Actions, Jest, Playwright, k6',7.9)
section('EXPERIENCE')
text('FPT Software | Fresher Node.js Developer | Apr 2026 - Present',8.4,True,gap=1)
bullet('Completed hands-on training in TypeScript, Node.js, Express.js, NestJS, React, PostgreSQL, and REST API development.')
bullet('Built backend features with CRUD, validation, pagination, transactions, JWT authentication and authorization, and RBAC; used Prisma for data modeling and migrations.')
bullet('Practiced Jest, Docker, GitLab CI/CD, SonarQube, and two-sprint Scrum delivery.')
text('CT Group Vietnam | Technology & Product Division Staff | Sep 2025 - Feb 2026',8.4,True,gap=1)
bullet('Designed UAV system architectures and standardized proposals across use cases; defined end-to-end data flows for analysis and visualization.')
bullet('Translated operational and regulatory needs into technical specifications and aligned requirements across teams.')
text('Professional development | Career break | Dec 2024 - Aug 2025',8.4,True,gap=1)
text('TMA Solutions | Front-end Developer Intern | Sep 2023 - Dec 2023',8.4,True,gap=1)
bullet('Assisted with responsive ReactJS web applications; debugged and optimized existing code for page speed and accessibility.')
bullet('Used Git for version control and participated in code reviews.')
section('SELECTED PROJECTS')
text('Digital-E System | Full-stack e-commerce | React, TypeScript, Node.js, Express, PostgreSQL, Prisma',8.2,True,gap=1)
bullet('Built shopping, checkout, payment, order, and admin workflows; integrated PayOS and card payments.')
bullet('Added automated quality checks with Jest, React Testing Library, k6, CodeQL, and GitHub Actions; deployed on Vercel.')
text('Food Recipes | Recipe discovery platform | React, Node.js, PostgreSQL, Supabase',8.2,True,gap=1)
bullet('Developed recipe discovery, search, saving, authentication, meal planning, shopping-list, and pantry workflows; deployed with Vercel and Railway.')
text('eCoffee | Team project | NestJS, Kafka, gRPC, PostgreSQL',8.2,True,gap=1)
bullet('Coffee franchise platform spanning online orders, POS, delivery, loyalty, and multi-store inventory.')
section('EDUCATION & CERTIFICATIONS')
text('HCMUT | MSc Computer Science, Sep 2026 - Nov 2028 (in progress) | BSc Computer Science, English Program, Sep 2020 - Nov 2024 | GPA 3.2 / 4.0',8)
text('IELTS 7.0 (Apr 2026; expires Apr 2028) | Meta Full Stack Developer Specialization (Mar 2026; ID Q5YY1GVSFUF9) | Meta Front-End Developer Professional Certificate (Mar 2026) | Advanced React, Meta/Coursera (Mar 2026)',7.7)
if y<30:raise ValueError(f'Resume content overlaps footer: y={y}')
c.setFont('Body',7.5);c.setFillColor(HexColor('#697C8C'))
c.drawString(LEFT,20,'Quý Nguyễn · Software Engineer')
c.drawRightString(PAGE_W-LEFT,20,'CV · 05 Oct 2026')
c.save()
print(OUTPUT)
