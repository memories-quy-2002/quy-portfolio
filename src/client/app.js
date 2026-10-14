'use strict';
/** Static routes and enhanced navigation share one rendering path. Native links remain valid. */
let language = /^\/vi(?:\/|$)/.test(location.pathname) ? 'vi' : 'en';
let theme = document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
const main = document.getElementById('main');
const header = document.getElementById('header');
const footer = document.getElementById('footer');
const backToTopControl = document.getElementById('back-to-top');
const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
let revealObserver;
let chapterObserver;
let activeDialog;
let navigationToken = 0;
let renderedRouteKey;
const routeKey = url => routePath(url.pathname) + (url.search || '');
const external = 'target="_blank" rel="noopener noreferrer"';
const pick = value => value[language === 'vi' ? 1 : 0];
const t = key => pick(copy[key]);
function applyTheme(next=theme==='dark'?'light':'dark') {
 theme=next;
 document.documentElement.dataset.theme=theme;
 try{localStorage.setItem('portfolio-theme',theme);}catch{/* Theme remains active for this page without storage. */}
 const themeColor=document.querySelector('meta[name="theme-color"]');
 if(themeColor)themeColor.content=theme==='light'?'#f4f7fa':'#0b1422';
 const control=header.querySelector('[data-theme-toggle]');
 if(control){
  const action=pick(theme==='dark'?['Switch to light mode','Chuyển sang giao diện sáng']:['Switch to dark mode','Chuyển sang giao diện tối']);
  control.setAttribute('aria-label',action);control.setAttribute('title',action);control.setAttribute('aria-pressed',String(theme==='light'));
  control.innerHTML=icon(theme==='dark'?'sun':'moon');
 }
}
const routePath = path => path === '/' ? '/' : `/${path.split('/').filter(Boolean).join('/')}/`;
const contentPath = path => {
 const normalized=routePath(path);
 return normalized.startsWith('/vi/')?normalized.slice(3):normalized;
};
const localizePath = (path,targetLanguage=language) => {
 const normalized=contentPath(path);
 return targetLanguage==='vi'?`/vi${normalized}`:normalized;
};
const urlFor = project => localizePath(`/case-studies/${project.id}/`);
const icon = (name, extra = '') => `<span class="icon ${extra}" style="--icon:url('/assets/icons/${name}.svg')" aria-hidden="true"></span>`;
const logoMap = {'React':'react','ReactJS':'react','TypeScript':'typescript','Tailwind CSS':'tailwindcss','Vite':'vitejs','Node.js':'nodejs','NestJS':'nestjs','Express':'express','PostgreSQL':'postgresql','MySQL':'mysql','Redis':'redis','Kafka':'apachekafka','Docker':'docker','GitHub Actions':'githubactions','Jest / Vitest':'vitest','Playwright / k6':'playwright','Playwright':'playwright','Prisma':'prisma','REST API':'rest','gRPC':'grpc','Firebase':'firebase','Firebase Auth':'firebase','Cloudflare Workers':'cloudflare','PayOS':'payos','Redux Toolkit':'redux','TanStack Query':'reactquery','Vercel':'vercel','Meta':'meta','Coursera':'coursera','IELTS · IDP':'ielts-idp'};
const logo = (name, extra = '') => logoMap[name] ? `<span class="logo-avatar logo-avatar-${logoMap[name]} ${extra}"><img src="/assets/logos/${logoMap[name]}.svg" alt="" width="32" height="32" loading="lazy" decoding="async"></span>` : icon('code-xml',extra);
const brandLogo = name => `<span class="logo-avatar social-logo"><img src="/assets/logos/${name}.svg" alt="" width="32" height="32"></span>`;
const titleMarkup = text => text.split('<br>').map(line=>`<span class="title-line"><span class="title-word">${line}</span></span>`).join('');
const label = text => `<div class="eyebrow">${text}</div>`;
const tagIconMap = {'UAV':'cpu','Solution architecture':'layers','Technical specifications':'code-xml','Frontend':'monitor','Git':'code-xml'};
const tagTranslations = {'Solution architecture':'Kiến trúc giải pháp','Technical specifications':'Đặc tả kỹ thuật','Frontend':'Giao diện'};
const tags = values => `<div class="tags">${values.map(value => `<span data-tag="${value}">${logoMap[value]?`<img class="tech-logo tech-logo-${logoMap[value]}" src="/assets/logos/${logoMap[value]}.svg" alt="" width="${value==='PayOS'?44:18}" height="18" loading="lazy" decoding="async">`:tagIconMap[value]?icon(tagIconMap[value],'tag-icon'):''}${language==='vi'?(tagTranslations[value]||value):value}</span>`).join('')}</div>`;
const button = (href, text, primary = false, attributes = '') => {
 const email=href.startsWith('mailto:')?contactEmail():null;
 const target=email?`mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(pick(['Portfolio inquiry','Liên hệ từ portfolio']))}`:href.startsWith('/')&&!href.startsWith('//')&&!href.startsWith('/assets/')?localizePath(href):href;
 const labelText=email?t('emailMe'):text;
 return `<a class="button ${primary ? 'primary' : ''}" href="${target}" ${attributes}>${icon(target.startsWith('mailto:')?'mail':href.includes('github.com')?'code-xml':href.includes('linkedin.com')?'briefcase-business':href.startsWith('https')?'globe':href.includes('project')?'layers':href.includes('contact')?'mail':href.includes('tech')?'cpu':'book-open')}<span>${labelText}</span></a>`;
};
const heading = (eyebrow, title, description) => `<section class="page-heading reveal">${label(eyebrow)}<h1>${titleMarkup(title)}</h1><p class="lead">${description}</p></section>`;
function responsiveImageSrcset(src, width) {
 if(!src?.endsWith('.webp')||Number(width)<=960)return '';
 const base=src.slice(0,-5);
 const candidates=[`${base}-640.webp 640w`,`${base}-960.webp 960w`];
 if(Number(width)>1280)candidates.push(`${base}-1280.webp 1280w`);
 candidates.push(`${src} ${width}w`);
 return candidates.join(', ');
}
function responsiveImageAttrs(src, width, sizes) {
 const srcset=responsiveImageSrcset(src,width);
 return srcset?` srcset="${srcset}" sizes="${sizes}"`:'';
}
function architectureNode(node,index){
 const brand=node.brand?logo(node.brand,'architecture-brand'):icon(node.icon||'monitor','architecture-brand architecture-generic');
 return `<article class="architecture-node"><div class="architecture-node-brand">${brand}</div><h3>${escapeText(pick(node.title))}</h3></article>`;
}
function architectureConnector(text){return `<div class="architecture-connector"><span>${escapeText(pick(text))}</span><span class="architecture-arrow" aria-hidden="true">→</span></div>`;}
function architectureIntegration(item){const mark=item.brand?logo(item.brand,'integration-brand'):icon(item.icon||'cloud-upload','integration-brand integration-generic');return `<article class="architecture-integration">${mark}<h4>${escapeText(pick(item.title))}</h4></article>`;}
function architecture(project,compact=false){
 const flow=projectFlows[project.id];if(!flow)return '';
 const nodes=flow.nodes.map((node,index)=>`${architectureNode(node,index)}${index<flow.edges.length?architectureConnector(flow.edges[index]):''}`).join('');
 const source=flow.source?`<a class="architecture-source" href="${flow.source}" target="_blank" rel="noopener noreferrer">${pick(['Source repository ↗','Kho mã nguồn ↗'])}</a>`:'';
 const integrations=flow.integrations?.length?`<section class="architecture-support"><h3>${pick(flow.supportLabel)}</h3><div class="architecture-integrations">${flow.integrations.map(architectureIntegration).join('')}</div></section>`:'';
 const events=flow.events?`<section class="architecture-event-model"><div class="event-model-heading"><div><span class="integration-kind">${pick(flow.events.label)}</span><h3>${pick(flow.events.title)}</h3></div><span class="event-model-status">${pick(flow.events.status)}</span></div><div class="event-model-track">${flow.events.steps.map((step,index)=>`${index?`<div class="event-model-connector"><span>${escapeText(pick(flow.events.edges[index-1]))}</span><i aria-hidden="true">→</i></div>`:''}<article class="event-model-step">${step.brand?logo(step.brand,'event-model-brand'):icon(step.icon||'database','event-model-brand integration-generic')}<h4>${escapeText(pick(step.title))}</h4></article>`).join('')}</div><p class="event-model-footnote">${pick(flow.events.footnote)}</p></section>`:'';
 const serviceFacts=flow.facts?`<div class="architecture-facts">${flow.facts.map(fact=>`<span>${fact.icon?icon(fact.icon):''}<span>${pick(fact.text)}</span></span>`).join('')}</div>`:'';
 return `<figure class="architecture-flow ${project.tone} ${compact?'compact':''} ${flow.target?'architecture-target':''}"><figcaption class="architecture-head"><div><span class="architecture-kicker">${pick(flow.kicker)}</span><strong>${project.name}</strong></div><span class="architecture-status ${flow.target?'is-target':'is-source-backed'}">${pick(flow.status)}</span>${source}</figcaption><div class="architecture-content"><p class="architecture-description">${pick(flow.description)}</p><div class="architecture-track" role="group" aria-label="${pick(flow.aria)}">${nodes}</div>${integrations}${events}${serviceFacts}<p class="architecture-caption">${pick(flow.caption)}</p></div></figure>`;
}
const projectFlows={
 'digital-e-shop':{
  source:'https://github.com/memories-quy-2002/digital-e-shop/blob/main/docs/ARCHITECTURE.md',
  kicker:['Source-backed architecture','Kiến trúc đối chiếu mã nguồn'],status:['Implemented structure','Cấu trúc theo mã nguồn'],
  description:['A separate React client calls a modular NestJS API; MySQL remains the primary runtime store.','Giao diện React độc lập gọi API NestJS dạng mô-đun; MySQL là nơi lưu trữ chính khi ứng dụng chạy.'],
  aria:['Digital E system flow','Sơ đồ luồng hệ thống Digital E'],
  nodes:[
   {role:['Client','Giao diện'],title:['React storefront & admin','Cửa hàng trực tuyến & trang quản trị React'],detail:['Product discovery, cart, checkout and order tracking.','Tìm sản phẩm, giỏ hàng, thanh toán và theo dõi đơn.'],brand:'React',chips:['React 19','Vite']},
   {role:['Application','Ứng dụng'],title:['NestJS API · Express adapter','NestJS API · Express adapter'],detail:['Feature modules coordinate requests, validation and business rules.','Các mô-đun điều phối yêu cầu, kiểm tra dữ liệu và quy tắc nghiệp vụ.'],brand:'NestJS',chips:['Products','Cart','Orders','Inventory','Payments']},
   {role:['Persistence','Lưu trữ'],title:['MySQL','MySQL'],detail:['Primary runtime database; Prisma covers part of the model and migrations.','Cơ sở dữ liệu chính khi ứng dụng chạy; Prisma quản lý một phần mô hình dữ liệu và các bản migration.'],brand:'MySQL',chips:['Orders','Stock','Payment ledger']}
  ],edges:[['REST / JSON','REST / JSON'],['SQL transactions','Giao dịch SQL']],
  supportLabel:['Identity & payments','Định danh & thanh toán'],
  integrations:[
   {brand:'Firebase Auth',kind:['Identity','Định danh'],title:['Firebase Authentication','Firebase Authentication'],detail:['The client gets a Firebase ID token; the API verifies it and issues a cookie-backed session.','Giao diện nhận Firebase ID token; API xác minh rồi cấp phiên làm việc qua cookie.']},
   {brand:'PayOS',kind:['Checkout provider','Cổng thanh toán'],title:['PayOS checkout & webhook','Thanh toán & webhook PayOS'],detail:['The API creates checkout; a signed webhook returns for payment reconciliation.','API tạo phiên thanh toán; webhook có chữ ký gửi kết quả để đối soát.']}
  ],
  caption:['Based on the current repository architecture and payment/authentication source.','Dựa trên tài liệu kiến trúc hiện tại cùng mã nguồn xử lý thanh toán và xác thực.']
 },
 'food-recipes':{
  source:'https://github.com/memories-quy-2002/Food-recipes/blob/master/README.md',
  kicker:['Source-backed architecture','Kiến trúc đối chiếu source'],status:['Implemented structure','Cấu trúc theo mã nguồn'],
  description:['The React app uses the versioned NestJS REST API for recipes, planning, pantry and household workflows.','Ứng dụng React dùng NestJS REST API có version cho công thức, kế hoạch bữa ăn, kho bếp và hộ gia đình.'],
  aria:['Food Recipes system flow','Sơ đồ luồng hệ thống Food Recipes'],
  nodes:[
   {role:['Client','Giao diện'],title:['React + TypeScript','React + TypeScript'],detail:['Route-based app with TanStack Query for server state and Redux Toolkit.','Ứng dụng theo route, dùng TanStack Query cho server state và Redux Toolkit.'],brand:'React',chips:['Vite','TanStack Query','Redux Toolkit']},
   {role:['Application','Ứng dụng'],title:['NestJS REST API · /api/v1','NestJS REST API · /api/v1'],detail:['Feature modules cover recipes, authentication, planning, pantry and households.','Các module phụ trách công thức, xác thực, kế hoạch, kho bếp và hộ gia đình.'],brand:'NestJS',chips:['JWT','Refresh rotation','REST / OpenAPI']},
   {role:['Persistence','Lưu trữ'],title:['PostgreSQL + Prisma','PostgreSQL + Prisma'],detail:['Persists recipe data, plans, pantry, cooking sessions and refresh sessions.','Lưu công thức, kế hoạch, kho bếp, phiên nấu và refresh session.'],brand:'PostgreSQL',chips:['Prisma 7','Domain modules']}
  ],edges:[['REST / JSON','REST / JSON'],['Prisma queries','Truy vấn Prisma']],
  supportLabel:['Direct image upload','Tải ảnh trực tiếp'],
  integrations:[
   {icon:'server',kind:['Media flow','Luồng media'],title:['Signed upload grant → object storage','Signed upload grant → object storage'],detail:['The API issues a short-lived signed grant; the browser uploads image bytes directly to the configured storage endpoint.','API cấp quyền tải lên có chữ ký, thời hạn ngắn; trình duyệt gửi file trực tiếp đến storage endpoint đã cấu hình.']}
  ],
  caption:['Deployment is split between a Vercel frontend and a containerized NestJS API.','Giao diện chạy trên Vercel, còn API NestJS được đóng gói container và triển khai riêng.']
 },
 ecoffee:{
  target:true,kicker:['Documented target architecture','Kiến trúc mục tiêu theo tài liệu'],status:['Target · partly verified','Mục tiêu · xác minh một phần'],
  description:['A public REST edge routes into bounded services. Internal gRPC handles synchronous calls; Kafka carries asynchronous events.','REST gateway tiếp nhận request công khai. gRPC dùng cho lời gọi đồng bộ giữa service; Kafka chuyển sự kiện bất đồng bộ.'],
  aria:['eCoffee target architecture flow','Sơ đồ luồng kiến trúc mục tiêu eCoffee'],
  nodes:[
   {role:['Entry points','Điểm truy cập'],title:['Customer, staff & POS apps','Ứng dụng khách, nhân viên & POS'],detail:['Online ordering, store operations and point of sale.','Đặt món online, vận hành cửa hàng và bán hàng tại quầy.'],icon:'monitor',chips:['Web','POS']},
   {role:['Public edge','Gateway công khai'],title:['Kong API Gateway','Kong API Gateway'],detail:['REST / JSON boundary for client traffic; routes to the owning domain.','Cổng REST / JSON cho client; chuyển request đến domain phụ trách.'],icon:'server',chips:['TLS','Routing','Rate limits']},
   {role:['Example domain services','Ví dụ domain service'],title:['Order · Inventory · Delivery','Order · Inventory · Delivery'],detail:['Separate service owners; Order owns order and payment state.','Các service có quyền sở hữu riêng; Order quản lý trạng thái đơn và thanh toán.'],brand:'NestJS',chips:['REST edge','Internal gRPC']}
  ],edges:[['HTTPS · REST / JSON','HTTPS · REST / JSON'],['Routes to service owners','Định tuyến đến service phụ trách']],
  events:{label:['Asynchronous reliability pattern','Mẫu tin cậy bất đồng bộ'],title:['Transactional outbox → Kafka → inbox','Transactional outbox → Kafka → inbox'],status:['Architecture direction · partial prototype','Định hướng kiến trúc · prototype một phần'],
   steps:[
    {brand:'PostgreSQL',title:['Order DB + outbox','DB Order + outbox'],detail:['Domain change and event record share one local transaction.','Thay đổi domain và event record cùng một transaction cục bộ.']},
    {icon:'workflow',title:['Outbox relay','Outbox relay'],detail:['Publishes committed events for delivery.','Phát các event đã commit để chuyển tiếp.']},
    {brand:'Kafka',title:['Kafka topics','Kafka topics'],detail:['Async event transport; at-least-once delivery.','Truyền event bất đồng bộ; giao ít nhất một lần.']},
    {icon:'layers',title:['Consumer inbox','Inbox của consumer'],detail:['Deduplicates repeated delivery.','Khử trùng lặp khi nhận lại event.']}
   ],edges:[['poll / publish','poll / publish'],['async event','event bất đồng bộ'],['consume / dedupe','nhận / khử trùng']],
   footnote:['Outbox/inbox and cross-service adoption are documented as partial or unverified; this is not an exactly-once claim.','Tài liệu ghi nhận outbox/inbox và mức độ áp dụng liên service mới một phần hoặc chưa xác minh; đây không phải cam kết exactly-once.']
  },
  facts:[{icon:'database',text:['Each service owns a separate logical database and migrations.','Mỗi service sở hữu database logic và migration riêng.']},{icon:'cable',text:['gRPC for synchronous calls · Kafka for asynchronous events.','gRPC cho gọi đồng bộ · Kafka cho event bất đồng bộ.']}],
  caption:['This diagram reflects the supplied architecture documents. They describe a target service catalog and mark several cross-service behaviors as partially implemented or unverified.','Sơ đồ phản ánh tài liệu kiến trúc bạn gửi. Tài liệu mô tả catalog service mục tiêu và ghi rõ một số luồng liên service mới triển khai một phần hoặc chưa xác minh.']
 }
};
function projectVisual(project, large = false) {
 const width=project.gallery?.[0]?.width||1440;
 return project.image ? `<figure class="project-visual ${project.tone} ${large ? 'large' : ''}"><div class="browser-bar" aria-hidden="true"><span class="browser-dots"><i></i><i></i><i></i></span><span>${new URL(project.live).hostname}</span></div><img src="${project.image}"${responsiveImageAttrs(project.image,width,'(max-width: 640px) calc(100vw - 64px), (max-width: 960px) 85vw, (max-width: 1200px) 50vw, 560px')} alt="${pick(project.imageAlt)}" width="${width}" height="${project.gallery?.[0]?.height||1000}" loading="lazy" decoding="async"></figure>` : `<div class="project-visual blueprint ${large ? 'large' : ''}">${architecture(project, !large)}</div>`;
}
function projectCard(project, index) {
 return `<a class="project-card reveal ${project.tone}" data-project="${project.id}" href="${urlFor(project)}"><div class="project-summary"><div class="project-category">${icon(({"digital-e-shop":'shopping-bag',"food-recipes":'utensils',ecoffee:'coffee'})[project.id])}<span>${pick(project.category)}</span></div><h3>${project.name}<span class="project-title-stroke"> / 0${index+1}</span></h3><p>${pick(project.summary)}</p>${tags(project.tags)}<span class="project-cta">${icon('book-open')}${t('study')}</span></div><div class="project-stage">${projectVisual(project,true)}<span class="project-index" aria-hidden="true">0${index+1}</span><span class="project-stage-label">${pick(project.category)}</span></div></a>`;
}
function homeProjectPreview(project,index) {
 return `<a class="home-project-preview ${project.tone} reveal" data-project="${project.id}" href="${urlFor(project)}"><div class="home-project-copy">${label(pick(project.category))}<h3>${project.name}</h3><p>${pick(project.summary)}</p>${tags(project.tags.slice(0,3))}<span class="project-cta">${icon('book-open')}${t('study')}</span></div><div class="home-project-image">${projectVisual(project)}<span class="home-project-number" aria-hidden="true">0${index+1}</span></div></a>`;
}
function productGallery(project) {
 if(!project.gallery?.length)return `<section class="case-showcase reveal">${projectVisual(project,true)}<p class="image-caption">${t('ecoffeeNote')}</p></section>`;
 const first=project.gallery[0];
 return `<section class="case-showcase product-gallery reveal" data-gallery="${project.id}"><div class="gallery-heading">${label(t('gallery'))}<span class="muted">${t('galleryHint')}</span></div><button class="gallery-main" data-enlarge aria-label="${t('enlarge')}"><img data-shared-image src="${first.image}"${responsiveImageAttrs(first.image,first.width,'(max-width: 720px) calc(100vw - 36px), (max-width: 1190px) calc(100vw - 64px), 1126px')} alt="${pick(first.title)}" width="${first.width}" height="${first.height}" decoding="async"></button><div class="gallery-thumbnails" aria-label="${t('gallery')}">${project.gallery.map((shot,index)=>`<button data-shot="${index}" aria-pressed="${index===0}" aria-label="${pick(shot.title)}"><img src="${shot.image.replace(/\.webp$/,'-thumb.webp')}" alt="" width="360" height="203" loading="lazy" decoding="async"><span>${pick(shot.title)}</span></button>`).join('')}</div></section>`;
}
function caseHeroVisual(project) {
 const shot=project.gallery?.[0];
 if(!shot)return '';
 return `<figure class="case-hero-visual"><img src="${shot.image}"${responsiveImageAttrs(shot.image,shot.width,'(max-width: 850px) calc(100vw - 48px), (max-width: 1200px) 46vw, 560px')} alt="${pick(shot.title)}" width="${shot.width}" height="${shot.height}" fetchpriority="high" decoding="async"><figcaption>${icon('sparkles')}${pick(shot.title)}</figcaption></figure>`;
}
function setupGallery(root) {
 const gallery=root.querySelector('[data-gallery]');if(!gallery?.dataset?.gallery)return;
 const project=projectData.find(p=>p.id===gallery.dataset.gallery);if(!project?.gallery)return;
 let selected=0;const mainImage=gallery.querySelector('.gallery-main img');
 const select=index=>{selected=(index+project.gallery.length)%project.gallery.length;const shot=project.gallery[selected];mainImage.srcset=responsiveImageSrcset(shot.image,shot.width);mainImage.sizes='(max-width: 720px) calc(100vw - 36px), (max-width: 1190px) calc(100vw - 64px), 1126px';mainImage.src=shot.image;mainImage.alt=pick(shot.title);mainImage.width=shot.width;mainImage.height=shot.height;gallery.querySelectorAll('[data-shot]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.shot)===selected)));};
 gallery.querySelectorAll('[data-shot]').forEach(b=>b.addEventListener('click',()=>select(Number(b.dataset.shot))));
 gallery.querySelector('[data-enlarge]').addEventListener('click',()=>{
  const dialog=document.createElement('dialog');activeDialog=dialog;dialog.className='gallery-dialog';dialog.setAttribute('aria-label',t('gallery'));
  dialog.innerHTML=`<div class="lightbox-top"><span>${project.name}</span><button data-close aria-label="${t('closeImage')}">${icon('x')}</button></div><img alt=""><p></p><div class="lightbox-controls"><button data-prev>${t('previousImage')}</button><span aria-live="polite"></span><button data-next>${t('nextImage')}</button></div>`;
  const show=()=>{const shot=project.gallery[selected];const img=dialog.querySelector('img');img.srcset=responsiveImageSrcset(shot.image,shot.width);img.sizes='(max-width: 720px) 100vw, 92vw';img.src=shot.image;img.alt=pick(shot.title);dialog.querySelector('p').textContent=pick(shot.caption);dialog.querySelector('[aria-live]').textContent=`${selected+1} / ${project.gallery.length}`;};
  const move=delta=>{select(selected+delta);show();};
  dialog.querySelector('[data-close]').addEventListener('click',()=>dialog.close());dialog.querySelector('[data-prev]').addEventListener('click',()=>move(-1));dialog.querySelector('[data-next]').addEventListener('click',()=>move(1));
  dialog.addEventListener('keydown',event=>{if(event.key==='ArrowRight'){event.preventDefault();move(1);}if(event.key==='ArrowLeft'){event.preventDefault();move(-1);}});
  dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
  dialog.addEventListener('close',()=>{dialog.remove();if(activeDialog===dialog)activeDialog=null;if(gallery.isConnected)gallery.querySelector('[data-enlarge]').focus();},{once:true});
  document.body.append(dialog);show();dialog.showModal();
 });
}
/** Validate owner-supplied contact data before rendering a mail link. */
function contactEmail() {
 const email=profileDetails.email?.trim();
 return email&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)?email:null;
}
function escapeText(value) {
 return String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
}
function resumeActions(compact=false) {
 const resume=profileDetails.resume;
 if(!resume?.url)return '';
 return `<div class="resume-actions ${compact?'compact':''}">${button(resume.url,pick(['View CV','Xem CV']),false,external)}${compact?'':button(resume.url,pick(['Download PDF','Tải PDF']),true,`download="${escapeText(resume.filename)}"`)}</div>`;
}
function profileContactSection() {
 const email=contactEmail();
 return `<section class="profile-contact reveal"><div><h2>${pick(['Resume & direct contact','CV & liên hệ trực tiếp'])}</h2><p>${pick(['A concise overview of my experience, education and projects.','Tóm tắt kinh nghiệm, học vấn và các dự án của tôi.'])}</p></div><div class="profile-contact-content"><div class="resume-row"><div><h3>${pick(['Resume / CV','Hồ sơ ứng tuyển / CV'])}</h3></div>${resumeActions()}</div>${email?`<div class="direct-email"><div><h3>Email</h3><a class="contact-email" href="mailto:${encodeURIComponent(email)}">${escapeText(email)}</a></div><button class="button" type="button" data-copy-email>${icon('mail')}${pick(['Copy email','Sao chép email'])}</button><p class="copy-feedback" role="status" aria-live="polite"></p></div>`:''}</div></section>`;
}
/** Clipboard failure stays recoverable; the visible email can be copied manually. */
function setupContactActions(root) {
 const control=root.querySelector('[data-copy-email]');
 if(!control?.addEventListener)return;
 control.addEventListener('click',async()=>{
  const email=contactEmail();if(!email||control.disabled)return;
  const feedback=root.querySelector('.copy-feedback');
  control.disabled=true;
  try{if(!navigator.clipboard?.writeText)throw new Error('Clipboard unavailable');await navigator.clipboard.writeText(email);feedback.textContent=pick(['Email copied.','Đã sao chép email.']);}
  catch{feedback.textContent=pick(['Copy unavailable. Select the email address and copy it manually.','Không thể tự động sao chép. Hãy chọn địa chỉ email và sao chép thủ công.']);}
  finally{control.disabled=false;}
 });
}
function projectContributions(project) {
 const detail=contributionDetails[project.id];if(!detail)return '';
 const headings={
  'digital-e-shop':[['Product experience','API & data','Payments & access','Quality & delivery'],['Trải nghiệm sản phẩm','API & dữ liệu','Thanh toán & phân quyền','Chất lượng & triển khai']],
  'food-recipes':[['Kitchen workflows','API & authentication','Frontend & deployment'],['Quy trình bếp','API & xác thực','Frontend & triển khai']],
  ecoffee:[['Identity & sessions','Delivery contracts','Event reliability'],['Danh tính & phiên','Giao tiếp delivery','Độ tin cậy sự kiện']]
 };
 return `<section class="case-contribution"><div class="contribution-intro">${label(t('personalContributions'))}<h2>${pick(['What I worked on','Phần việc tôi phụ trách'])}</h2><p class="contribution-role">${pick(detail.role)}</p></div><ol class="contribution-grid">${pick(detail.points).map((point,index)=>`<li><span class="contribution-number">${String(index+1).padStart(2,'0')}</span><div><h3>${escapeText(pick(headings[project.id])[index])}</h3><p>${escapeText(point)}</p></div></li>`).join('')}</ol></section>`;
}

function caseEvidencePanel(project) {
 const evidence=caseEvidence[project.id];if(!evidence)return '';
 return `<section class="case-evidence reveal" aria-label="${t('roleScopeOutcome')}"><article><span>${t('roleLabel')}</span><b>${pick(evidence.role)}</b></article><article><span>${t('scopeLabel')}</span><b>${pick(evidence.scope)}</b></article><article><span>${t('problem')}</span><b>${pick(project.problem)}</b></article><article><span>${t('outcomeLabel')}</span><b>${pick(evidence.outcome)}</b></article></section>`;
}
function caseValidationPanel(project) {
 const evidence=caseEvidence[project.id];if(!evidence?.verification)return '';
 const source=projectFlows[project.id]?.source;
 const sourceLink=source?`<div class="actions">${button(source,t('source'),false,external)}</div>`:'';
 const points=pick(evidence.verification).map(point=>`<div>${escapeText(point)}</div>`).join('');
 return `<section id="verification" class="case-section case-validation reveal">${label('06')}<h2>${t('verification')}</h2><div class="feature-grid">${points}</div>${sourceLink}</section>`;
}
function technicalDecisionCards(project) {
 return (engineeringDecisions[project.id]||[]).map((decision,index)=>`<article class="engineering-decision"><header><span>${String(index+1).padStart(2,'0')}</span><h3>${pick(decision.title)}</h3></header><div class="decision-body"><section><h4>${t('decisionRationale')}</h4><p>${pick(decision.why)}</p></section><section><h4>${t('tradeoff')}</h4><p>${pick(decision.trade)}</p></section></div></article>`).join('');
}

function contactBanner() {
 return `<section class="contact-banner reveal"><div>${label(t('contactLabel'))}<h2>${t('contactTitle').replace(/<br\s*\/?>/gi,' ')}</h2><p>${t('contactCopy')}</p></div>${button('/contact/', t('connect'), true)}</section>`;
}
function nextProjectSection(project) {
 const next=nextProject(project);
 return `<section class="next-project reveal"><div><span class="eyebrow">${t('nextProject')}</span><h2>${next.name}</h2><p>${pick(next.summary)}</p></div><a class="button primary" href="${urlFor(next)}"><span>${t('study')}</span><span aria-hidden="true">→</span></a></section>`;
}
function nextProject(project) {
 const index=projectData.indexOf(project);
 return projectData[(index+1)%projectData.length];
}
function nowSection() {
 const items=['nowWork','nowStudy','nowFocus'].map(key=>`<article class="home-now-item reveal"><span>${t(`${key}Label`)}</span><h3>${t(`${key}Title`)}</h3><p>${t(`${key}Copy`)}</p></article>`).join('');
 return `<section class="section home-now" aria-labelledby="now-title"><div class="home-now-intro reveal">${label(t('nowLabel'))}<h2 id="now-title">${t('nowTitle')}</h2><p>${t('nowIntro')}</p><span class="home-now-updated">${t('nowUpdated')}</span></div><div class="home-now-items">${items}</div></section>`;
}
function homePage() {
 return `<div class="container home-page"><section class="hero home-hero-scene" aria-labelledby="home-title"><div class="hero-copy"><div class="hero-availability"><span aria-hidden="true"></span>${pick(["Open to opportunities","Sẵn sàng hợp tác"])}</div><h1 id="home-title">${titleMarkup(pick(["Hello, I’m<br><em>Nguyễn Mạnh Phú Quý</em>","Xin chào, tôi là<br><em>Nguyễn Mạnh Phú Quý</em>"]))}</h1><p class="hero-subtitle">${pick(["Software Engineer · Full-stack / Backend","Kỹ sư phần mềm · Full-stack / Backend"])}</p><div class="actions">${button("/projects/", pick(["View projects","Xem dự án"]), true)}${resumeActions(true).replace(pick(["View CV","Xem CV"]),pick(["Download CV","Tải CV"])).replace('target="_blank" rel="noopener noreferrer"','download="'+escapeText(profileDetails.resume.filename)+'"')}</div></div><div class="hero-art"><div class="system-visual" data-system-visual role="group" aria-label="${pick(['Interactive orbital systems map','Bản đồ hệ thống quỹ đạo tương tác'])}" aria-describedby="orbit-hint orbit-details">
 <div class="system-orbits" data-system-orbits aria-hidden="true"><span class="system-orbit system-orbit-outer"></span><span class="system-orbit system-orbit-middle"></span><span class="system-orbit system-orbit-inner"></span></div>
 <canvas class="system-connections" data-system-connections aria-hidden="true"></canvas>
 <div class="system-core" aria-hidden="true"><img src="/assets/hero/orbit/core.webp" alt="" width="512" height="512" decoding="async" fetchpriority="high"></div>
 ${[
  {icon:'database',label:['Database · PostgreSQL & Redis','Dữ liệu · PostgreSQL & Redis'],detail:['PostgreSQL provides durable relational storage; Redis keeps frequently accessed data and short-lived state close to the application.','PostgreSQL lưu dữ liệu quan hệ bền vững; Redis giữ dữ liệu truy cập thường xuyên và trạng thái ngắn hạn gần ứng dụng.'],layer:['DATA & PERSISTENCE','DỮ LIỆU & LƯU TRỮ'],stack:'PostgreSQL|Redis',plane:0,phase:0,radius:.315,speed:.105},
  {icon:'cloud',label:['Cloud infrastructure','Hạ tầng đám mây'],detail:['Vercel and Railway host web applications and services, while GitHub workflows carry validated changes into deployment.','Vercel và Railway lưu trữ ứng dụng web, dịch vụ; GitHub Actions đưa các thay đổi đã kiểm tra vào quy trình triển khai.'],layer:['CLOUD & DELIVERY','ĐÁM MÂY & TRIỂN KHAI'],stack:'Vercel|Railway|GitHub Actions',plane:0,phase:1.0472,radius:.315,speed:.105},
  {icon:'code',label:['Frontend · React & TypeScript','Giao diện · React & TypeScript'],detail:['React and TypeScript organize reusable interfaces, typed data flows, and accessible product interactions.','React và TypeScript tổ chức giao diện tái sử dụng, luồng dữ liệu có kiểu và tương tác dễ tiếp cận.'],layer:['USER INTERFACE','GIAO DIỆN NGƯỜI DÙNG'],stack:'React|TypeScript|Tailwind CSS',plane:0,phase:2.0944,radius:.315,speed:.105},
  {icon:'gear',label:['API · NestJS & Node.js','API · NestJS & Node.js'],detail:['NestJS modules keep API responsibilities explicit and make business workflows easier to evolve and test.','Các module NestJS tách bạch trách nhiệm API, giúp luồng nghiệp vụ dễ phát triển và kiểm thử.'],layer:['APPLICATION API','API ỨNG DỤNG'],stack:'NestJS|Node.js|REST',plane:0,phase:3.14159,radius:.315,speed:.105},
  {icon:'server',label:['Services · Docker & Vercel','Dịch vụ · Docker & Vercel'],detail:['Docker makes service environments repeatable; deployment platforms publish the application for real users.','Docker giúp môi trường dịch vụ nhất quán; nền tảng triển khai đưa ứng dụng đến người dùng.'],layer:['RUNTIME & DEPLOYMENT','MÔI TRƯỜNG & TRIỂN KHAI'],stack:'Docker|CI/CD|Vercel',plane:0,phase:4.18879,radius:.315,speed:.105},
  {icon:'events',label:['Events · Kafka & gRPC','Sự kiện · Kafka & gRPC'],detail:['Kafka supports asynchronous event flows, while gRPC connects services with typed contracts for direct communication.','Kafka hỗ trợ luồng sự kiện bất đồng bộ; gRPC kết nối dịch vụ bằng hợp đồng có kiểu dữ liệu rõ ràng.'],layer:['SERVICE COMMUNICATION','GIAO TIẾP GIỮA DỊCH VỤ'],stack:'Kafka|gRPC|Protobuf',plane:0,phase:5.23599,radius:.315,speed:.105},
 ].map((node,index)=>'<button class="system-node system-node-'+(index+1)+'" type="button" data-system-node data-orbit-node data-orbit-plane="'+node.plane+'" data-orbit-phase="'+node.phase+'" data-orbit-radius="'+node.radius+'" data-orbit-speed="'+node.speed+'" data-layer="'+pick(node.layer)+'" data-stack="'+node.stack+'" aria-pressed="false" aria-label="'+pick(node.label)+'" data-detail="'+pick(node.detail)+'"><img src="/assets/hero/orbit/'+node.icon+'.webp" alt="" width="256" height="256" decoding="async"></button>').join('')}
 </div>
 <section class="system-detail" id="orbit-details" data-system-detail data-state="idle" aria-live="polite" aria-atomic="true"><span class="system-detail-kicker" data-system-detail-layer>${pick(['SYSTEM OVERVIEW','TỔNG QUAN HỆ THỐNG'])}</span><h3 class="system-detail-title" data-system-detail-title>${pick(['Select a sphere to inspect','Chọn một quả cầu để xem'])}</h3><p class="system-detail-copy" data-system-detail-copy>${pick(['Explore how each layer contributes to the applications I build.','Khám phá vai trò của từng lớp trong các ứng dụng tôi xây dựng.'])}</p><div class="system-detail-tags" data-system-detail-tags aria-label="${pick(['Related technologies','Công nghệ liên quan'])}"></div></section>
 <span class="system-caption" id="orbit-hint">${pick(['Drag the open space to rotate the orbits · select a sphere for details','Kéo vùng trống để xoay quỹ đạo · chọn quả cầu để xem chi tiết'])}</span>
</div></section><div class="discipline-strip reveal"><span>${icon('monitor')}<b>${pick(['Frontend','Giao diện'])}</b></span><span>${icon('server')}<b>${pick(['Backend','Máy chủ'])}</b></span><span>${icon('layers')}<b>${pick(['Full-stack','Toàn diện'])}</b></span><span class="strip-note">${pick(['One connected perspective.','Một góc nhìn xuyên suốt.'])}</span></div>${nowSection()}<section class="section"><div class="section-heading reveal"><div>${label(t('selected'))}<h2>${t('selectedTitle')}</h2></div>${button('/projects/', t('allProjects'))}</div><div class="home-project-list">${projectData.map(homeProjectPreview).join('')}</div></section><section class="section home-stack"><div class="reveal">${label(t('stackLabel'))}<h2>${t('stackTitle')}</h2><p class="muted">${t('stackIntro')}</p>${button('/tech-stack/', t('stack'))}</div><div class="stack-preview">${stackData.map((group, i) => `<a class="stack-preview-card ${group.color} reveal" href="${localizePath('/tech-stack/')}#${group.id}" style="--delay:${i * 70}ms"><span class="stack-category-icon">${icon(({frontend:'monitor',backend:'server',data:'database',delivery:'workflow'})[group.id])}</span><h3>${pick(group.title)}</h3><p>${group.tools.slice(0,3).map(tool=>tool[0]).join(' · ')}</p></a>`).join('')}</div></section><section class="section home-profile"><div class="reveal">${label(t('profileLabel'))}<h2>${t('profileTitle')}</h2><p class="muted">${t('profileCopy')}</p></div><div class="profile-links"><a href="${localizePath('/experience/')}" class="profile-link reveal"><span class="profile-symbol">${icon('briefcase-business')}</span><div><span class="eyebrow">${t('experience')}</span><h3>FPT Software · CT Group · TMA Solutions</h3><p>${t('careerLink')}</p></div></a><a href="${localizePath('/education/')}" class="profile-link reveal"><span class="profile-symbol hcmut-logo"><img src="/assets/logos/hcmut.webp" alt="" width="48" height="48" loading="lazy" decoding="async"></span><div><span class="eyebrow">${t('education')}</span><h3>${t('school')}</h3><p>${t('ongoing')} · ${t('masters')}</p></div></a></div></section>${contactBanner()}</div>`;
}
function projectsPage() {
 return `<div class="container">${heading(t('selected'),pick(['Projects in focus.<br><em>Details that matter.</em>','Tập trung vào dự án.<br><em>Chi tiết tạo khác biệt.</em>']),t('selectedDesc'))}<div class="project-grid projects-gallery">${projectData.map(projectCard).join('')}</div>${contactBanner()}</div>`;
}
function technologyProjects(name) {
 const associations={React:['digital-e-shop','food-recipes'],TypeScript:['digital-e-shop','food-recipes','ecoffee'],'Tailwind CSS':['digital-e-shop','food-recipes'],Vite:['digital-e-shop','food-recipes'],'Node.js':['digital-e-shop','food-recipes','ecoffee'],NestJS:['digital-e-shop','food-recipes','ecoffee'],'REST API':['digital-e-shop','food-recipes'],gRPC:['ecoffee'],PostgreSQL:['food-recipes','ecoffee'],MySQL:['digital-e-shop'],Kafka:['ecoffee'],Prisma:['digital-e-shop','food-recipes','ecoffee'],Docker:['digital-e-shop','food-recipes'],'Playwright / k6':['digital-e-shop','food-recipes']};
 return projectData.filter(project=>(associations[name]||[]).includes(project.id));
}
function stackPage() {
 return `<div class="container">${heading(t('stackLabel'),t('stackTitle'),t('stackIntro'))}<div class="stack-groups">${stackData.map(group=>`<section class="stack-group ${group.color} reveal" id="${group.id}"><div class="stack-group-heading"><span class="stack-category-icon">${icon(({frontend:'monitor',backend:'server',data:'database',delivery:'workflow'})[group.id])}</span><div><h2>${pick(group.title)}</h2><p>${pick(group.desc)}</p></div></div><div class="tool-grid">${group.tools.map(tool=>`<article class="tool">${logo(tool[0],'tool-mark')}<div class="tool-copy"><h3>${tool[0]}</h3><p>${tool[language==='vi'?3:2]}</p><details class="tool-projects"><summary>${t('techProjects')}</summary><div>${technologyProjects(tool[0]).length?technologyProjects(tool[0]).map(project=>`<a href="${urlFor(project)}">${project.name}</a>`).join(''):`<p>${t('techPractice')}</p>`}</div></details></div></article>`).join('')}</div></section>`).join('')}</div><section class="section"><div class="section-heading reveal"><div>${label(t('principles'))}<h2>${pick(['Beyond the toolkit.','Không chỉ là công nghệ.'])}</h2></div></div><div class="principle-grid">${[1,2,3].map(index=>`<article class="principle reveal"><span class="principle-icon">${icon(['layers','shield-check','sparkles'][index-1])}</span><h3>${t('p'+index)}</h3><p>${t('p'+index+'desc')}</p></article>`).join('')}</div></section>${contactBanner()}</div>`;
}
function experiencePage() {
 const cards=experienceData.map((item,index)=>{
  const mark=item.logo?`<img src="${item.logo}" alt="" width="96" height="48" loading="lazy" decoding="async">`:item.icon?icon(item.icon,'experience-mark-icon'):`<span class="company-initial" aria-hidden="true">${item.initial}</span>`;
  const focus=!item.contribution&&item.points?`<details class="timeline-details"><summary>${pick(['Work & learning focus','Công việc & trọng tâm học hỏi'])}</summary><ul>${pick(item.points).map(point=>`<li>${point}</li>`).join('')}</ul></details>`:'';
  const contribution=item.contribution&&item.points?`<div class="employment-contribution"><h4>${t('personalContributions')}</h4><ul>${pick(item.points).map(point=>`<li>${point}</li>`).join('')}</ul></div>`:'';
 const companyId=item.company==='FPT Software'?'fpt':item.company==='CT Group Hi-Tech'?'ct-group':'tma';
  const current=item.dates?.[0].includes('Present');
  return `<article class="experience-card reveal" data-company="${companyId}"><div class="timeline-number">0${index+1}</div><div class="experience-body"><div class="experience-top"><div class="company-mark company-mark-${companyId}">${mark}</div><div class="experience-heading"><div class="eyebrow">${pick(item.stage)}</div><h2>${item.company}</h2></div></div><h3>${pick(item.title)}</h3>${item.dates?`<p class="experience-dates${current?' is-current':''}"><span>${pick(item.dates)}</span>${current?`<span class="current-role">${pick(['Current role','Đang làm'])}</span>`:''}</p>`:''}<p>${pick(item.description)}</p>${focus}${tags(item.tags)}${contribution}</div></article>`;
 }).join('');
 return `<div class="container">${heading(t('expLabel'),t('expTitle'),t('expIntro'))}<div class="experience-timeline">${cards}</div><section class="career-projects reveal"><div>${label(t('selected'))}<h2>${pick(['Putting it into practice.','Đưa kiến thức vào thực hành.'])}</h2><p>${pick(['Independent projects connect frontend experience with backend and data workflows.','Các dự án cá nhân kết nối kinh nghiệm xây dựng giao diện với phần máy chủ và dữ liệu.'])}</p></div>${button('/projects/',t('allProjects'))}</section>${contactBanner()}</div>`;
}
function educationPage() {
 const credentials=[
  {mark:'IELTS · IDP',name:['IELTS 7.0','IELTS 7.0'],issuer:['IDP Education Ltd','IDP Education Ltd'],date:['Issued Apr 2026 · Expires Apr 2028','Cấp tháng 04/2026 · Hết hạn tháng 04/2028'],detail:['Listening 8.0 · Reading 8.5 · Writing 6.0 · Speaking 5.5','Listening 8.0 · Reading 8.5 · Writing 6.0 · Speaking 5.5']},
  {mark:'Meta',name:['Meta Full Stack Developer: Front-End & Back-End from Scratch Specialization','Meta Full Stack Developer: Front-End & Back-End from Scratch Specialization'],issuer:['Meta · Issued Mar 2026','Meta · Cấp tháng 03/2026'],date:['Credential ID Q5YY1GVSFUF9','Mã chứng nhận Q5YY1GVSFUF9'],detail:['Frontend and backend development','Phát triển frontend và backend']},
  {mark:'Meta',name:['Meta Front-End Developer Professional Certificate','Meta Front-End Developer Professional Certificate'],issuer:['Meta · Credly','Meta · Credly'],date:['Earned Mar 2026','Hoàn thành tháng 03/2026'],detail:['React, responsive UI, web fundamentals, and Git','React, giao diện responsive, nền tảng web và Git']},
  {mark:'Coursera',name:['Advanced React','Advanced React'],issuer:['Meta · Coursera','Meta · Coursera'],date:['Completed Mar 2026','Hoàn thành tháng 03/2026'],detail:['Advanced React patterns, state, and performance','Pattern React nâng cao, state và hiệu năng']}
 ];
 return `<div class="container">${heading(t('eduLabel'),t('eduTitle'),t('eduIntro'))}<div class="education-grid">${[true,false].map(master=>`<article class="education-card ${master?'current':''} reveal">${label(master?t('ongoing'):t('complete'))}<span class="degree-label">${master?'MSc':'BSc'}</span><h2>${master?t('masters'):t('bachelor')}</h2><h3>${t('cs')}</h3><div class="school"><span class="school-mark"><img src="/assets/logos/hcmut.webp" alt="" width="48" height="44" loading="lazy" decoding="async"></span><p>${t('school')}</p></div><p class="education-detail">${master?pick(['Master of Computer Science · In progress','Thạc sĩ Khoa học Máy tính · Đang theo học']):t('englishProgram')}</p><p class="education-dates">${master?pick(['Sep 2026 - Nov 2028 · Expected','09/2026 - 11/2028 · Dự kiến']):pick(['Sep 2020 - Nov 2024 · GPA 3.2 / 4.0','09/2020 - 11/2024 · GPA 3,2 / 4,0'])}</p>${!master?`<p class="education-detail">${pick(['Capstone project: Digital-E Selling System','Đồ án tốt nghiệp: Digital-E Selling System'])}</p>`:''}</article>`).join('')}</div><section class="credentials-section"><div class="section-heading reveal"><div>${label(pick(['Certifications & professional learning','Chứng chỉ & học tập chuyên môn']))}<h2>${pick(['Keep learning.','Tiếp tục học hỏi.'])}</h2></div></div><div class="credentials-grid">${credentials.map(item=>`<article class="credential-card reveal"><span class="credential-mark credential-mark-${logoMap[item.mark]}"><img src="/assets/logos/${logoMap[item.mark]}.svg" alt="" width="40" height="40" loading="lazy" decoding="async"></span><div><h3>${pick(item.name)}</h3><p>${pick(item.issuer)}</p><p class="credential-date">${pick(item.date)}</p><p class="credential-detail">${pick(item.detail)}</p></div></article>`).join('')}</div></section><section class="education-foundation reveal"><span class="foundation-index" aria-hidden="true">∞</span><div>${label(t('foundation'))}<h2>${pick(['Learning is part of the work.','Học hỏi là một phần của công việc.'])}</h2><p>${t('foundationText')}</p>${button('/projects/',t('viewWork'))}</div></section>${contactBanner()}</div>`;
}
function contactPage() {
 return `<div class="container">${heading(t('contactLabel'),t('contactTitle'),t('contactCopy'))}${profileContactSection()}<div class="contact-grid"><a class="contact-card reveal" href="https://www.linkedin.com/in/memories2002" ${external}>${brandLogo('linkedin')}<span class="eyebrow">${pick(['Profile & conversation','Hồ sơ & trao đổi'])}</span><h2>LinkedIn</h2><p>${t('linkedinDesc')}</p><span class="contact-url">linkedin.com/in/memories2002</span></a><a class="contact-card reveal" href="https://github.com/memories-quy-2002" ${external}>${brandLogo('github')}<span class="eyebrow">${pick(['Projects & source','Dự án & mã nguồn'])}</span><h2>GitHub</h2><p>${t('githubDesc')}</p><span class="contact-url">github.com/memories-quy-2002</span></a></div><div class="contact-location reveal">${label(t('location'))}<p>${t('focus')}</p></div></div>`;
}
function casePage(project) {
 const chapters=['overview','problem','solution','features','architecture','verification','takeaway'];
 return `<div class="container case-study case-study-${project.id}"><section class="case-heading reveal"><div class="case-intro-copy"><a class="back-link" href="${localizePath('/projects/')}">${t('back')}</a>${label(pick(project.category))}<h1>${titleMarkup(project.name)}</h1><p class="lead">${pick(project.summary)}</p><div class="actions">${project.live?button(project.live,t('live'),true,external):''}${project.repo?button(project.repo,t('source'),false,external):''}</div></div>${caseHeroVisual(project)}<div class="case-facts"><div><span>${t('focusLabel')}</span><b>${pick(project.focus)}</b></div><div><span>${t('typeLabel')}</span><b>${pick(project.type)}</b></div><div><span>${t('techLabel')}</span>${tags(project.tags)}</div></div></section>${caseEvidencePanel(project)}${productGallery(project)}${projectContributions(project)}<div class="case-layout"><aside class="case-nav"><span class="eyebrow">${t('study')}</span>${chapters.map((chapter,index)=>`<a href="#${chapter}"><span>${String(index+1).padStart(2,'0')}</span>${t(chapter)}</a>`).join('')}</aside><div class="case-content"><section id="overview" class="case-section reveal">${label('01')}<h2>${t('overview')}</h2><p>${pick(project.overview)}</p></section><section id="problem" class="case-section reveal">${label('02')}<h2>${t('problem')}</h2><p>${pick(project.problem)}</p></section><section id="solution" class="case-section reveal">${label('03')}<h2>${t('solution')}</h2><div class="engineering-decisions">${technicalDecisionCards(project)}</div></section><section id="features" class="case-section reveal">${label('04')}<h2>${t('features')}</h2><div class="feature-grid">${pick(project.features).map(feature=>`<div>${feature}</div>`).join('')}</div></section><section id="architecture" class="case-section reveal">${label('05')}<h2>${t('architecture')}</h2>${architecture(project)}</section>${caseValidationPanel(project)}<section id="takeaway" class="case-section reveal">${label('07')}<h2>${t('takeaway')}</h2><p>${pick(project.takeaway)}</p></section></div></div><section class="section"><div class="section-heading reveal"><h2>${t('related')}</h2></div><div class="project-grid related">${projectData.filter(item=>item!==project&&item!==nextProject(project)).map(item=>projectCard(item,projectData.indexOf(item))).join('')}</div></section>${contactBanner()}${nextProjectSection(project)}</div>`;
}
const routeMap = {'/': ['home',homePage], '/projects/':['projects',projectsPage], '/tech-stack/':['stack',stackPage], '/experience/':['experience',experiencePage], '/education/':['education',educationPage], '/contact/':['contact',contactPage]};
function resolvedRoute(path) {
 const normalized=contentPath(path);
 if(routeMap[normalized])return {key:routeMap[normalized][0],renderer:routeMap[normalized][1]};
 const project=projectData.find(item=>normalized===`/case-studies/${item.id}/`);
 if(project)return {key:'projects',project,renderer:()=>casePage(project)};
 return {key:'404',renderer:()=>`<div class="container">${heading('404',t('notfound'),'')}<div class="actions">${button('/',t('returnHome'),true)}</div></div>`};
}
function renderPage() {
 renderedRouteKey=routeKey(location);
 if(activeDialog){const dialog=activeDialog;activeDialog=null;dialog.close();dialog.remove();}
 const route=resolvedRoute(location.pathname);
 revealObserver?.disconnect();chapterObserver?.disconnect();
 document.documentElement.lang=language;document.documentElement.dataset.theme=theme;
 document.title=`${route.project?route.project.name:route.key==='home'?t('role'):route.key==='404'?'404':t(route.key)} · Nguyễn Mạnh Phú Quý`;
 backToTopControl?.setAttribute('aria-label',pick(['Back to top','Lên đầu trang']));
 backToTopControl?.setAttribute('title',pick(['Back to top','Lên đầu trang']));
 document.querySelector('.skip-link').textContent=t('skip');
 header.innerHTML=`<div class="container header-inner"><a href="${localizePath('/')}" class="brand" aria-label="Nguyễn Mạnh Phú Quý"><span class="brand-mark" aria-hidden="true">PQ</span><span class="brand-label">Phú Quý</span></a><nav id="site-nav" class="site-nav" aria-label="${t('menu')}">${Object.values(routeMap).map(([key],index)=>`<a href="${localizePath(Object.keys(routeMap)[index])}" ${route.key===key?'aria-current="page"':''}>${icon(({home:'house',projects:'layers',stack:'cpu',experience:'briefcase-business',education:'graduation-cap',contact:'mail'})[key])}<span>${t(key)}</span></a>`).join('')}</nav><div class="header-controls"><button class="theme-toggle" data-theme-toggle type="button" aria-label="${pick(theme==='dark'?['Switch to light mode','Chuyển sang giao diện sáng']:['Switch to dark mode','Chuyển sang giao diện tối'])}" title="${pick(theme==='dark'?['Switch to light mode','Chuyển sang giao diện sáng']:['Switch to dark mode','Chuyển sang giao diện tối'])}" aria-pressed="${theme==='light'}">${icon(theme==='dark'?'sun':'moon')}</button><div class="language-switch" aria-label="${pick(['Language','Ngôn ngữ'])}"><button data-lang="en" aria-pressed="${language==='en'}" aria-label="English">EN</button><button data-lang="vi" aria-pressed="${language==='vi'}" aria-label="Tiếng Việt">VI</button></div><button class="menu-toggle" aria-label="${t('openMenu')}" aria-controls="site-nav" aria-expanded="false"><span></span><span></span></button></div></div><div class="scroll-progress" aria-hidden="true"></div>`;
 main.setAttribute('data-page',route.project?'case-study':route.key);
 main.innerHTML=route.renderer();
 footer.innerHTML=`<div class="container footer-inner"><div class="footer-main"><div class="footer-brand"><a class="brand" href="${localizePath('/')}" aria-label="Nguyễn Mạnh Phú Quý"><span class="brand-mark" aria-hidden="true">PQ</span><span class="brand-label">Phú Quý</span></a><span class="footer-full-name">Nguyễn Mạnh Phú Quý</span><p>${t('footer')}</p></div><nav class="footer-links" aria-label="${pick(['Footer navigation','Điều hướng cuối trang'])}"><span class="footer-heading">${pick(['Explore','Khám phá'])}</span><a href="${localizePath('/projects/')}">${t('projects')}</a><a href="${localizePath('/tech-stack/')}">${t('stack')}</a><a href="${localizePath('/experience/')}">${t('experience')}</a><a href="${localizePath('/education/')}">${t('education')}</a></nav><div class="footer-connect"><span class="footer-heading">${pick(['Connect','Kết nối'])}</span><div class="footer-social"><a href="https://www.linkedin.com/in/memories2002" ${external}><img src="/assets/logos/linkedin.svg" alt="" width="18" height="18" loading="lazy" decoding="async"><span>LinkedIn</span></a><a href="https://github.com/memories-quy-2002" ${external}><img src="/assets/logos/github.svg" alt="" width="18" height="18" loading="lazy" decoding="async"><span>GitHub</span></a><a href="${localizePath('/contact/')}">${icon('mail')}<span>${t('contact')}</span></a></div></div></div><div class="footer-bottom"><span>© ${new Date().getFullYear()} Nguyễn Mạnh Phú Quý</span></div></div>`;
 header.querySelectorAll('[data-lang]').forEach(control=>control.addEventListener('click',async()=>{
  const nextLanguage=control.dataset.lang;
  if(language===nextLanguage)return;
  const targetUrl=new URL(localizePath(location.pathname,nextLanguage),location.href);
  targetUrl.search=location.search;targetUrl.hash=location.hash;
  language=nextLanguage;
  try{localStorage.setItem('portfolio-language',language);}catch{/* The selection still works without storage. */}
  await navigate(targetUrl,{scrollY:window.scrollY});
  header.querySelector(`[data-lang="${language}"]`).focus();
 }));
 header.querySelector('[data-theme-toggle]').addEventListener('click',()=>applyTheme());
 header.querySelector('.menu-toggle').addEventListener('click',toggleMenu);
 watchReveals();updateProgress();setupGallery(main);setupContactActions(main);watchChapters();window.PortfolioMotion?.refresh(main);
}
function toggleMenu() {
 const button=header.querySelector('.menu-toggle');
 const open=button.getAttribute('aria-expanded')!=='true';
 button.setAttribute('aria-expanded',String(open));button.setAttribute('aria-label',t(open?'closeMenu':'openMenu'));
 header.querySelector('.site-nav').classList.toggle('open',open);
}
function watchReveals() {
 // Content remains visible if observers or JavaScript enhancement are unavailable.
 if(motion.matches||!('IntersectionObserver' in window))return;
 revealObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');revealObserver.unobserve(entry.target);}}),{threshold:.06,rootMargin:'0px 0px -24px 0px'});
 main.querySelectorAll('.reveal').forEach(element=>{
  if(element.getBoundingClientRect().top<window.innerHeight&&element.getBoundingClientRect().bottom>0)element.classList.add('is-visible');
  else{element.classList.add('reveal-pending');revealObserver.observe(element);}
 });
}
function watchChapters() {
 if(!('IntersectionObserver' in window))return;
 chapterObserver=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){main.querySelectorAll('.case-nav a').forEach(link=>{const active=link.hash===`#${entry.target.id}`;if(active)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});}},{rootMargin:'-15% 0px -55% 0px',threshold:0});
 main.querySelectorAll('.case-content .case-section').forEach(section=>chapterObserver.observe(section));
}
function updateProgress(){const max=document.documentElement.scrollHeight-window.innerHeight;const progress=header.querySelector('.scroll-progress');if(progress)progress.style.transform=`scaleX(${max>0?Math.min(1,Math.max(0,window.scrollY/max)):0})`;backToTopControl?.classList.toggle('is-visible',window.scrollY>360);}
function positionPage(url,scrollY){
 if(url.hash){const target=document.getElementById(decodeURIComponent(url.hash.slice(1)));if(target){target.scrollIntoView({behavior:'instant',block:'start'});return;}}
 window.scrollTo({top:scrollY,left:0,behavior:'instant'});
}
async function navigate(url,{pop=false,scrollY=0,origin=null}={}) {
 // Fragment history stays within the mounted page: no curtain, rerender or gallery reset.
 if(routeKey(url)===renderedRouteKey){positionPage(url,scrollY);return;}
 const token=++navigationToken;
 let updated=false;
 window.PortfolioMotion?.cancel();
 const update=()=>{
  if(token!==navigationToken||updated)return;
  updated=true;
  if(!pop){history.replaceState({...history.state,scrollY:window.scrollY},'',location.href);history.pushState({scrollY:0},'',url.href);}
  window.scrollTo({top:0,left:0,behavior:'instant'});renderPage();main.focus({preventScroll:true});positionPage(url,scrollY);
 };
 const route=resolvedRoute(url.pathname);
 const name=route.project?route.project.name:route.key==='404'?'404':t(route.key);
 if(!motion.matches&&window.PortfolioMotion){
  try{if(route.project&&origin?.dataset.project===route.project.id)await window.PortfolioMotion.projectTransition(update,origin,()=>token===navigationToken);else await window.PortfolioMotion.transition(update,name,()=>token===navigationToken);}catch{if(token===navigationToken){update();window.PortfolioMotion.cancel();}}
 }else if(!motion.matches){
  main.classList.add('page-leaving');await new Promise(resolve=>setTimeout(resolve,140));
  if(token!==navigationToken)return;
  update();main.classList.remove('page-leaving');main.classList.remove('page-enter');void main.offsetWidth;main.classList.add('page-enter');
 }else update();
 if(token===navigationToken)main.classList.remove('page-leaving');
}
document.addEventListener('click',event=>{
 const anchor=event.target.closest?.('a[href]');
 if(!anchor||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||anchor.target||anchor.hasAttribute('download'))return;
 const url=new URL(anchor.href,location.href);
 if(url.origin!==location.origin)return;
 if(routePath(url.pathname)===routePath(location.pathname)&&url.search===location.search){
  if(header.querySelector('.menu-toggle')?.getAttribute('aria-expanded')==='true')toggleMenu();
  if(!url.hash){event.preventDefault();window.scrollTo({top:0,behavior:motion.matches?'instant':'smooth'});}
  return;
 }
 if(!routeMap[contentPath(url.pathname)]&&!projectData.some(project=>`/case-studies/${project.id}/`===contentPath(url.pathname)))return;
 event.preventDefault();navigate(url,{origin:anchor});
});
window.addEventListener('popstate',event=>navigate(new URL(location.href),{pop:true,scrollY:event.state?.scrollY||0}));
window.addEventListener('scroll',updateProgress,{passive:true});
window.addEventListener('resize',updateProgress,{passive:true});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&header.querySelector('.menu-toggle')?.getAttribute('aria-expanded')==='true'){toggleMenu();header.querySelector('.menu-toggle').focus();}});
motion.addEventListener?.('change',()=>{if(motion.matches){revealObserver?.disconnect();main.querySelectorAll('.reveal-pending').forEach(element=>element.classList.add('is-visible'));}});
if('scrollRestoration' in history)history.scrollRestoration='manual';
backToTopControl?.addEventListener('click',()=>window.scrollTo({top:0,left:0,behavior:motion.matches?'instant':'smooth'}));
renderPage();
if(location.hash)requestAnimationFrame(()=>positionPage(new URL(location.href),0));

